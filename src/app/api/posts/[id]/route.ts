import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    const post = db.select().from(schema.posts).where(eq(schema.posts.id, id)).get();

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    return NextResponse.json({ post });
  } catch (error) {
    console.error("Post GET error:", error);
    return NextResponse.json({ error: "Failed to load post" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    const body = await request.json();
    const { content, status, tone } = body as {
      content?: string;
      status?: "draft" | "approved" | "published" | "discarded";
      tone?: string;
    };

    const existing = db.select().from(schema.posts).where(eq(schema.posts.id, id)).get();
    if (!existing) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    const updates: Record<string, unknown> = { updatedAt: new Date().toISOString() };
    if (content !== undefined) updates.content = content;
    if (status !== undefined) updates.status = status;
    if (tone !== undefined) updates.tone = tone;

    const updated = db
      .update(schema.posts)
      .set(updates)
      .where(eq(schema.posts.id, id))
      .returning()
      .get();

    return NextResponse.json({ post: updated });
  } catch (error) {
    console.error("Post PATCH error:", error);
    return NextResponse.json({ error: "Failed to update post" }, { status: 500 });
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

    db.delete(schema.posts).where(eq(schema.posts.id, id)).run();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Post DELETE error:", error);
    return NextResponse.json({ error: "Failed to delete post" }, { status: 500 });
  }
}
