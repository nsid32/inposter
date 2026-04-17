import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    let posts;
    if (status) {
      posts = db
        .select()
        .from(schema.posts)
        .where(eq(schema.posts.status, status as "draft" | "approved" | "published" | "discarded"))
        .all();
    } else {
      posts = db.select().from(schema.posts).all();
    }

    return NextResponse.json({ posts });
  } catch (error) {
    console.error("Posts GET error:", error);
    return NextResponse.json({ error: "Failed to load posts" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { content, source = "ai_generated", status = "draft", tone } = body as {
      content: string;
      source?: "ai_generated";
      status?: "draft" | "approved" | "published" | "discarded";
      tone?: string;
    };

    if (!content) {
      return NextResponse.json({ error: "Content is required" }, { status: 400 });
    }

    const now = new Date().toISOString();
    const result = db
      .insert(schema.posts)
      .values({
        content,
        source,
        status,
        tone: tone || null,
        createdAt: now,
        updatedAt: now,
      })
      .returning()
      .get();

    return NextResponse.json({ post: result }, { status: 201 });
  } catch (error) {
    console.error("Posts POST error:", error);
    return NextResponse.json({ error: "Failed to create post" }, { status: 500 });
  }
}
