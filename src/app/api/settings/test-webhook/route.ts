import { NextResponse } from "next/server";
import { getSetting } from "@/lib/settings";

export async function POST() {
  try {
    const webhookUrl = await getSetting("make_webhook_url");
    if (!webhookUrl) {
      return NextResponse.json({ error: "No webhook URL configured" }, { status: 400 });
    }

    const webhookApiKey = await getSetting("make_webhook_api_key");

    const payload = {
      post_id: 0,
      content: "This is a test payload from InPoster.",
      tone: "Professional",
      published_at: new Date().toISOString(),
      _test: true,
    };

    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (webhookApiKey) headers["x-make-apikey"] = webhookApiKey;

    let response: Response;
    try {
      response = await fetch(webhookUrl, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Unknown error";
      return NextResponse.json({ error: `Network error: ${msg}` }, { status: 500 });
    }

    if (!response.ok) {
      return NextResponse.json(
        { error: `Webhook returned HTTP ${response.status}: ${response.statusText}` },
        { status: 502 }
      );
    }

    return NextResponse.json({ success: true, status: response.status });
  } catch (error: unknown) {
    console.error("Test webhook error:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
