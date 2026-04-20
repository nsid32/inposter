import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";

const VALID_STATUSES = ["draft", "approved", "published", "discarded"] as const;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const limitParam = searchParams.get("limit");
    const offsetParam = searchParams.get("offset");
    const limit = Math.min(parseInt(limitParam || "200") || 200, 500);
    const offset = parseInt(offsetParam || "0") || 0;

    if (status && !VALID_STATUSES.includes(status as typeof VALID_STATUSES[number])) {
      return NextResponse.json({ error: "Invalid status value" }, { status: 400 });
    }

    let posts;
    if (status) {
      posts = db
        .select()
        .from(schema.posts)
        .where(eq(schema.posts.status, status as "draft" | "approved" | "published" | "discarded"))
        .limit(limit)
        .offset(offset)
        .all();
    } else {
      posts = db.select().from(schema.posts).limit(limit).offset(offset).all();
    }

    const postsWithMeta = posts.map(p => ({
      ...p,
      imageData: undefined,  // omit the blob from list responses
      hasImage: !!(p.imagePath || p.imageData),
    }));
    return NextResponse.json({ posts: postsWithMeta });
  } catch (error) {
    console.error("Posts GET error:", error);
    return NextResponse.json({ error: "Failed to load posts" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) {
      return NextResponse.json({ error: "Content-Type must be application/json" }, { status: 415 });
    }

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
