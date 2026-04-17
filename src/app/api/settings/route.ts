import { NextResponse } from "next/server";
import { getAllSettings, setSetting } from "@/lib/settings";

const SENSITIVE_KEYS = [
  "anthropic_api_key",
  "make_webhook_api_key",
  "openai_api_key",
  "unsplash_access_key",
];

const MASK = "••••••••••••";

export async function GET() {
  try {
    const all = await getAllSettings();
    const masked: Record<string, string> = {};
    for (const [key, value] of Object.entries(all)) {
      masked[key] = SENSITIVE_KEYS.includes(key) && value ? MASK : value;
    }
    return NextResponse.json({ settings: masked });
  } catch (error) {
    console.error("Settings GET error:", error);
    return NextResponse.json({ error: "Failed to load settings" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { settings } = body as { settings: Record<string, string> };

    if (!settings || typeof settings !== "object") {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    for (const [key, value] of Object.entries(settings)) {
      // Skip masked values — user didn't change them
      if (value === MASK) continue;
      if (value === null || value === undefined) continue;
      await setSetting(key, String(value));
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Settings PUT error:", error);
    return NextResponse.json({ error: "Failed to save settings" }, { status: 500 });
  }
}
