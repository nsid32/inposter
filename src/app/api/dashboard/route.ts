import { NextResponse } from "next/server";
import { db, schema } from "@/lib/db";

export async function GET() {
  try {
    const allPosts = db.select().from(schema.posts).all();

    const total = allPosts.length;
    const drafts = allPosts.filter((p) => p.status === "draft").length;

    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weekAgoStr = weekAgo.toISOString();

    const publishedThisWeek = allPosts.filter(
      (p) => p.status === "published" && p.publishedAt && p.publishedAt >= weekAgoStr
    ).length;

    const recentDrafts = allPosts
      .filter((p) => p.status === "draft")
      .sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""))
      .slice(0, 5);

    return NextResponse.json({
      total,
      drafts,
      publishedThisWeek,
      recentDrafts,
    });
  } catch (error) {
    console.error("Dashboard error:", error);
    return NextResponse.json({ error: "Failed to load dashboard" }, { status: 500 });
  }
}
