import { NextResponse } from "next/server";
import { getSetting } from "@/lib/settings";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";
import Anthropic from "@anthropic-ai/sdk";

interface Idea {
  title: string;
  description: string;
}

interface FollowUp {
  title: string;
  description: string;
  basedOn: string;
}

interface IdeasResponse {
  ideas: Idea[];
  followUps: FollowUp[];
}

export async function POST() {
  try {
    const apiKey = await getSetting("anthropic_api_key");
    if (!apiKey) {
      return NextResponse.json({ error: "No Anthropic API key configured" }, { status: 400 });
    }

    const model = (await getSetting("claude_model")) || "claude-sonnet-4-6";

    const rawInterests = await getSetting("areas_of_interest");
    const interestList = (rawInterests || "").split(",").map((s) => s.trim()).filter(Boolean);

    // Fetch last 5 published posts
    const publishedPosts = db
      .select()
      .from(schema.posts)
      .where(eq(schema.posts.status, "published"))
      .all();

    const recentPosts = publishedPosts.slice(-5);
    const postSnippets = recentPosts.map((p) =>
      (p.content as string).slice(0, 200)
    );

    const interestsClause = interestList.length > 0
      ? `\n\nThe user's professional areas of interest are: ${interestList.join(", ")}. Always generate ideas that are specifically relevant to these domains.`
      : "";

    const systemPrompt = `You are a LinkedIn content strategist helping a professional brainstorm post ideas.
Return ONLY valid JSON with no markdown wrapping or code blocks.
Always return exactly 5 fresh topic ideas in the "ideas" array.
The "followUps" array must always be present — it should be empty if no published post context is provided, or contain 1-2 follow-up suggestions based on previous posts when context is available.${interestsClause}`;

    const contextSection =
      postSnippets.length > 0
        ? `Here are some of the user's recent published LinkedIn posts for context:\n\n${postSnippets.map((s, i) => `Post ${i + 1}: "${s}"`).join("\n\n")}\n\nBased on these posts, suggest follow-up topics that continue the user's narrative or deepen a theme they've touched on.`
        : "The user has no published posts yet, so only generate fresh ideas. Return an empty array for followUps.";

    const userMessage = `${contextSection}

Generate LinkedIn post topic ideas. Return JSON only in this exact format:
{
  "ideas": [
    {"title": "...", "description": "One sentence explaining what the post would cover and why it would resonate on LinkedIn"},
    {"title": "...", "description": "..."},
    {"title": "...", "description": "..."},
    {"title": "...", "description": "..."},
    {"title": "...", "description": "..."}
  ],
  "followUps": []
}

If published posts were provided, replace the empty followUps array with 1-2 items:
{
  "followUps": [
    {"title": "...", "description": "One sentence explaining how this continues or expands on a previous post", "basedOn": "Brief reference to which previous post inspired this"}
  ]
}`;

    const client = new Anthropic({ apiKey });
    const response = await client.messages.create({
      model,
      max_tokens: 1500,
      system: systemPrompt,
      messages: [{ role: "user", content: userMessage }],
    });

    const rawText = response.content[0].type === "text" ? response.content[0].text : "";

    let parsed: IdeasResponse;
    try {
      const cleaned = rawText.replace(/```json?\n?/gi, "").replace(/```\n?/gi, "").trim();
      parsed = JSON.parse(cleaned) as IdeasResponse;
    } catch {
      console.error("JSON parse failed, raw:", rawText);
      return NextResponse.json({ error: "Failed to parse AI response" }, { status: 500 });
    }

    if (!parsed.ideas || !Array.isArray(parsed.ideas)) {
      return NextResponse.json({ error: "Invalid AI response format" }, { status: 500 });
    }

    return NextResponse.json({
      ideas: parsed.ideas,
      followUps: parsed.followUps ?? [],
    });
  } catch (error) {
    console.error("Ideas error:", error);
    const msg = error instanceof Error ? error.message : "Failed to generate ideas";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
