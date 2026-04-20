import { NextResponse } from "next/server";
import { getSetting } from "@/lib/settings";
import Anthropic from "@anthropic-ai/sdk";

interface ComposeRequest {
  topic: string;
  keyPoints?: string;
  audience?: string;
  cta?: string;
  tone: string;
  length: string;
  hashtags: number;
  emojis: boolean;
}

const LENGTH_CHARS: Record<string, string> = {
  short: "300",
  medium: "600",
  long: "1300",
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ComposeRequest;
    const { topic, keyPoints, audience, cta, tone, length, hashtags, emojis } = body;

    if (!topic) {
      return NextResponse.json({ error: "Topic is required" }, { status: 400 });
    }

    const apiKey = await getSetting("anthropic_api_key");
    if (!apiKey) {
      return NextResponse.json({ error: "No Anthropic API key configured" }, { status: 400 });
    }

    const model = (await getSetting("claude_model")) || "claude-sonnet-4-6";
    const maxChars = LENGTH_CHARS[length] || "600";

    const systemPrompt = `You are an expert LinkedIn content strategist. Write engaging, professional LinkedIn posts.

Rules:
- Write for LinkedIn's professional audience
- Use short paragraphs and line breaks for readability
- Avoid clichés ("excited to announce", "I'm humbled", "game-changer")
- Include a hook in the first line to stop the scroll
- End with a clear call-to-action or thought-provoking question
- Use hashtags naturally integrated in the post (not in a block at the end)
- STRICT character limit: each post MUST be ${maxChars} characters or fewer. Count carefully before responding.
- Match the requested tone exactly
- Return ONLY valid JSON with no markdown wrapping or code blocks`;

    const parts = [
      `Topic: ${topic}`,
      keyPoints ? `Key points to include: ${keyPoints}` : null,
      audience ? `Target audience: ${audience}` : null,
      cta ? `Call to action: ${cta}` : null,
      `Tone: ${tone}`,
      `STRICT maximum length: ${maxChars} characters (hard limit — do not exceed)`,
      `Number of hashtags to include: ${hashtags}`,
      `Use emojis: ${emojis ? "Yes, use a few relevant emojis" : "No emojis"}`,
    ]
      .filter(Boolean)
      .join("\n");

    const userMessage = `${parts}

Generate 2 different LinkedIn post variants based on the above. Return JSON only in this exact format:
{"variants":[{"content":"..."},{"content":"..."}]}`;

    const client = new Anthropic({ apiKey });
    const response = await client.messages.create({
      model,
      max_tokens: 2000,
      system: systemPrompt,
      messages: [{ role: "user", content: userMessage }],
    });

    const rawText = response.content[0].type === "text" ? response.content[0].text : "";

    // Parse JSON response
    let parsed: { variants: { content: string }[] };
    try {
      // Strip potential markdown code blocks
      const cleaned = rawText.replace(/```json?\n?/gi, "").replace(/```\n?/gi, "").trim();
      parsed = JSON.parse(cleaned);
    } catch {
      // If JSON parse fails, try to extract content from raw text
      console.error("JSON parse failed, raw:", rawText);
      return NextResponse.json({ error: "Failed to parse AI response" }, { status: 500 });
    }

    if (!parsed.variants || !Array.isArray(parsed.variants)) {
      return NextResponse.json({ error: "Invalid AI response format" }, { status: 500 });
    }

    // Hard truncation at word boundary if Claude exceeds the limit
    const limit = parseInt(maxChars);
    const variants = parsed.variants.map((v: { content: string }) => {
      if (v.content.length <= limit) return v;
      const truncated = v.content.slice(0, limit);
      const lastSpace = truncated.lastIndexOf(" ");
      return { content: lastSpace > 0 ? truncated.slice(0, lastSpace) : truncated };
    });

    return NextResponse.json({ variants });
  } catch (error) {
    console.error("Compose error:", error);
    const msg = error instanceof Error ? error.message : "Compose failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
