import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import { getSetting } from "@/lib/settings";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { content, custom_prompt, derive_only } = body as {
      content: string;
      custom_prompt?: string;
      derive_only?: boolean;
    };

    const anthropicApiKey = await getSetting("anthropic_api_key");
    if (!anthropicApiKey) {
      return NextResponse.json(
        { error: "Anthropic API key not configured" },
        { status: 400 }
      );
    }

    // Determine the prompt to use
    let promptUsed: string;
    if (custom_prompt) {
      promptUsed = custom_prompt;
    } else {
      // Call Claude to derive a DALL-E prompt from the post content
      const anthropic = new Anthropic({ apiKey: anthropicApiKey });
      const response = await anthropic.messages.create({
        model: "claude-sonnet-4-6",
        max_tokens: 300,
        messages: [
          {
            role: "user",
            content: `Write a concise DALL-E image prompt (max 200 characters) for a LinkedIn post image. The post is about: ${content}. Focus on visual concepts, not text. Be specific about style, mood, and subject.`,
          },
        ],
      });
      promptUsed =
        response.content[0].type === "text" ? response.content[0].text.trim() : "";
    }

    // If derive_only, return the prompt without calling DALL-E
    if (derive_only === true) {
      return NextResponse.json({ prompt_used: promptUsed });
    }

    const openaiApiKey = await getSetting("openai_api_key");
    if (!openaiApiKey) {
      return NextResponse.json(
        { error: "OpenAI API key not configured" },
        { status: 400 }
      );
    }

    // Call DALL-E 3
    const openai = new OpenAI({ apiKey: openaiApiKey });
    const imageResponse = await openai.images.generate({
      model: "dall-e-3",
      prompt: promptUsed,
      size: "1024x1024",
      quality: "standard",
      n: 1,
      response_format: "url",
    });

    const imageUrl = imageResponse.data?.[0]?.url;
    if (!imageUrl) {
      return NextResponse.json({ error: "No image URL returned from DALL-E" }, { status: 500 });
    }

    // Fetch the image and convert to base64
    const res = await fetch(imageUrl);
    const buf = await res.arrayBuffer();
    const b64 = Buffer.from(buf).toString("base64");

    return NextResponse.json({
      image_data: b64,
      image_mime_type: "image/png",
      prompt_used: promptUsed,
    });
  } catch (error) {
    console.error("Image generation error:", error);
    const message = error instanceof Error ? error.message : "Image generation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
