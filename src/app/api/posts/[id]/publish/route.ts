import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";
import { getSetting } from "@/lib/settings";

function mimeToExtension(mime: string): string {
  const map: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/jpg": "jpg",
    "image/png": "png",
    "image/gif": "gif",
    "image/webp": "webp",
  };
  return map[mime] ?? mime.split("/")[1] ?? "bin";
}

export async function POST(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    const post = db.select().from(schema.posts).where(eq(schema.posts.id, id)).get();

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    const webhookUrl = await getSetting("make_webhook_url");
    if (!webhookUrl) {
      return NextResponse.json(
        { error: "Make.com webhook not configured. Add it in Settings.", code: "webhook_not_configured" },
        { status: 400 }
      );
    }

    const webhookApiKey = await getSetting("make_webhook_api_key");
    const publishedAt = new Date().toISOString();

    const payload = {
      post_id: post.id,
      content: post.content,
      tone: post.tone,
      published_at: publishedAt,
      ...(post.imageData ? {
        image_data: post.imageData,
        image_mime_type: post.imageMimeType,
        image_extension: post.imageMimeType ? mimeToExtension(post.imageMimeType) : null,
      } : {}),
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
      const msg = error instanceof Error ? error.message : "Unknown network error";
      return NextResponse.json({ error: `Webhook request failed: ${msg}` }, { status: 500 });
    }

    if (!response.ok) {
      return NextResponse.json(
        { error: `Webhook returned HTTP ${response.status}: ${response.statusText}` },
        { status: 502 }
      );
    }

    const now = publishedAt;
    const updated = db
      .update(schema.posts)
      .set({
        status: "published",
        linkedinId: null,
        linkedinUrl: null,
        publishedAt: now,
        updatedAt: now,
      })
      .where(eq(schema.posts.id, id))
      .returning()
      .get();

    return NextResponse.json({ post: updated });
  } catch (error) {
    console.error("Publish error:", error);
    const msg = error instanceof Error ? error.message : "Publish failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
