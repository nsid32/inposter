import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];
const MAX_DECODED_SIZE = 5 * 1024 * 1024; // 5 MB

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
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

    const existing = db.select().from(schema.posts).where(eq(schema.posts.id, id)).get();
    if (!existing) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    const updated = db
      .update(schema.posts)
      .set({
        imageData: image_data,
        imageMimeType: image_mime_type,
        updatedAt: new Date().toISOString(),
      })
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

    const existing = db.select().from(schema.posts).where(eq(schema.posts.id, id)).get();
    if (!existing) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    const updated = db
      .update(schema.posts)
      .set({
        imageData: null,
        imageMimeType: null,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(schema.posts.id, id))
      .returning()
      .get();

    return NextResponse.json({ post: updated });
  } catch (error) {
    console.error("Post image DELETE error:", error);
    return NextResponse.json({ error: "Failed to remove image" }, { status: 500 });
  }
}
