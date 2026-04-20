import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";
import { getSetting } from "@/lib/settings";
import path from "path";
import fs from "fs";

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
    if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid post ID" }, { status: 400 });
    }
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

    // Resolve image: prefer file on disk, fall back to legacy imageData in DB
    let resolvedImageData: string | null = null;
    let resolvedMimeType: string | null = post.imageMimeType ?? null;

    if (post.imagePath) {
      try {
        const filePath = path.join(process.cwd(), post.imagePath);
        if (fs.existsSync(filePath)) {
          resolvedImageData = fs.readFileSync(filePath).toString("base64");
        }
      } catch {
        // If file read fails, proceed without image rather than blocking publish
      }
    } else if (post.imageData) {
      resolvedImageData = post.imageData;
    }

    const payload = {
      post_id: post.id,
      content: post.content,
      tone: post.tone,
      published_at: publishedAt,
      ...(resolvedImageData ? {
        image_data: resolvedImageData,
        image_mime_type: resolvedMimeType,
        image_extension: resolvedMimeType ? mimeToExtension(resolvedMimeType) : null,
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
