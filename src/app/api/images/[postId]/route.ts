import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";
import path from "path";
import fs from "fs";

export async function GET(_request: NextRequest, { params }: { params: { postId: string } }) {
  try {
    const id = parseInt(params.postId);
    if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid post ID" }, { status: 400 });
    }

    const post = db.select().from(schema.posts).where(eq(schema.posts.id, id)).get();
    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // Serve from file if imagePath is set
    if (post.imagePath) {
      const filePath = path.join(process.cwd(), post.imagePath);
      if (fs.existsSync(filePath)) {
        const buffer = fs.readFileSync(filePath);
        const mimeType = post.imageMimeType || "image/jpeg";
        return new NextResponse(buffer, {
          headers: {
            "Content-Type": mimeType,
            "Cache-Control": "private, max-age=3600",
          },
        });
      }
    }

    // Fallback: serve from imageData if still in DB (legacy)
    if (post.imageData && post.imageMimeType) {
      const buffer = Buffer.from(post.imageData, "base64");
      return new NextResponse(buffer, {
        headers: {
          "Content-Type": post.imageMimeType,
          "Cache-Control": "private, max-age=3600",
        },
      });
    }

    return NextResponse.json({ error: "No image found" }, { status: 404 });
  } catch (error) {
    console.error("Image GET error:", error);
    return NextResponse.json({ error: "Failed to load image" }, { status: 500 });
  }
}
