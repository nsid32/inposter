import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";
import path from "path";
import fs from "fs";

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];
const MAX_DECODED_SIZE = 5 * 1024 * 1024; // 5 MB

export async function POST(
  request: NextRequest,
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

    const body = await request.json();
    const { image_data, image_mime_type } = body as {
      image_data: string;
      image_mime_type: string;
    };

    if (!image_data || !image_mime_type) {
      return NextResponse.json(
        { error: "image_data and image_mime_type are required" },
        { status: 400 }
      );
    }

    if (!ALLOWED_MIME_TYPES.includes(image_mime_type)) {
      return NextResponse.json(
        { error: `Invalid MIME type. Allowed: ${ALLOWED_MIME_TYPES.join(", ")}` },
        { status: 400 }
      );
    }

    const decodedSize = image_data.length * 0.75;
    if (decodedSize > MAX_DECODED_SIZE) {
      return NextResponse.json(
        { error: "Image exceeds 5 MB size limit" },
        { status: 400 }
      );
    }

    // Determine file extension from MIME type
    const ext = image_mime_type.split("/")[1]?.replace("jpeg", "jpg") || "jpg";
    const filename = `post-${id}-${Date.now()}.${ext}`;
    const imagesDir = path.join(process.cwd(), "data", "images");
    fs.mkdirSync(imagesDir, { recursive: true });
    const filePath = path.join(imagesDir, filename);

    // Remove old image file if exists
    if (post.imagePath) {
      const oldPath = path.join(process.cwd(), "data", "images", path.basename(post.imagePath));
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }

    // Write new image file
    const buffer = Buffer.from(image_data, "base64");
    fs.writeFileSync(filePath, buffer);

    // Update DB: set imagePath, clear imageData
    const relativePath = `data/images/${filename}`;
    const now = new Date().toISOString();
    const updated = db
      .update(schema.posts)
      .set({ imagePath: relativePath, imageData: null, imageMimeType: image_mime_type, updatedAt: now })
      .where(eq(schema.posts.id, id))
      .returning()
      .get();

    return NextResponse.json({ post: updated });
  } catch (error) {
    console.error("Post image POST error:", error);
    return NextResponse.json({ error: "Failed to save image" }, { status: 500 });
  }
}

export async function DELETE(
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

    // Remove file from disk
    if (post.imagePath) {
      const oldPath = path.join(process.cwd(), "data", "images", path.basename(post.imagePath));
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }

    const now = new Date().toISOString();
    const updated = db
      .update(schema.posts)
      .set({ imagePath: null, imageData: null, imageMimeType: null, updatedAt: now })
      .where(eq(schema.posts.id, id))
      .returning()
      .get();

    return NextResponse.json({ post: updated });
  } catch (error) {
    console.error("Post image DELETE error:", error);
    return NextResponse.json({ error: "Failed to remove image" }, { status: 500 });
  }
}
