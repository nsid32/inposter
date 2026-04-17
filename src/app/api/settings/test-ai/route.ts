import { NextResponse } from "next/server";
import { getSetting } from "@/lib/settings";
import Anthropic from "@anthropic-ai/sdk";

export async function POST() {
  try {
    const apiKey = await getSetting("anthropic_api_key");
    if (!apiKey) {
      return NextResponse.json({ error: "No API key configured" }, { status: 400 });
    }

    const model = (await getSetting("claude_model")) || "claude-sonnet-4-6";

    const client = new Anthropic({ apiKey });
    const response = await client.messages.create({
      model,
      max_tokens: 20,
      messages: [{ role: "user", content: "Say 'ok'" }],
    });

    const text =
      response.content[0].type === "text" ? response.content[0].text : "";

    return NextResponse.json({ success: true, response: text });
  } catch (error: unknown) {
    console.error("Test AI error:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
