import { NextRequest, NextResponse } from "next/server";
import { getSetting } from "@/lib/settings";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { full_url, download_location, mime_type } = body as {
      full_url: string;
      download_location: string;
      mime_type?: string;
    };

    if (!full_url || !download_location) {
      return NextResponse.json(
        { error: "full_url and download_location are required" },
        { status: 400 }
      );
    }

    const accessKey = await getSetting("unsplash_access_key");
    if (!accessKey) {
      return NextResponse.json(
        { error: "Unsplash access key not configured" },
        { status: 400 }
      );
    }

    // Trigger Unsplash download endpoint (required by API terms) — fire and forget
    fetch(download_location, {
      headers: { Authorization: `Client-ID ${accessKey}` },
    }).catch((err) => {
      console.warn("Unsplash download trigger failed (non-blocking):", err);
    });

    // Fetch the full-size image and convert to base64
    const imageRes = await fetch(full_url);
    if (!imageRes.ok) {
      return NextResponse.json(
        { error: `Failed to fetch image: ${imageRes.status}` },
        { status: 502 }
      );
    }

    const contentType =
      mime_type ||
      imageRes.headers.get("content-type") ||
      "image/jpeg";

    // Strip any parameters (e.g. "image/jpeg; charset=utf-8")
    const imageMimeType = contentType.split(";")[0].trim();

    const buf = await imageRes.arrayBuffer();
    const imageData = Buffer.from(buf).toString("base64");

    return NextResponse.json({ image_data: imageData, image_mime_type: imageMimeType });
  } catch (error) {
    console.error("Unsplash select error:", error);
    const message = error instanceof Error ? error.message : "Failed to fetch Unsplash image";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
