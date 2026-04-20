import { NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { eq, and, gte, desc, sql } from "drizzle-orm";

export async function GET() {
  try {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weekAgoStr = weekAgo.toISOString();

    const [totalRow] = db.select({ count: sql<number>`count(*)` }).from(schema.posts).all();
    const [draftsRow] = db.select({ count: sql<number>`count(*)` }).from(schema.posts).where(eq(schema.posts.status, "draft")).all();
    const [publishedWeekRow] = db.select({ count: sql<number>`count(*)` }).from(schema.posts)
      .where(and(eq(schema.posts.status, "published"), gte(schema.posts.publishedAt, weekAgoStr))).all();

    const recentDraftsRaw = db.select().from(schema.posts)
      .where(eq(schema.posts.status, "draft"))
      .orderBy(desc(schema.posts.createdAt))
      .limit(5)
      .all();

    // Strip imageData blob — dashboard only needs id, content, tone, createdAt
    const recentDrafts = recentDraftsRaw.map(({ imageData: _imageData, ...rest }) => rest);

    return NextResponse.json({
      total: totalRow.count,
      drafts: draftsRow.count,
      publishedThisWeek: publishedWeekRow.count,
      recentDrafts,
    });
  } catch (error) {
    console.error("Dashboard error:", error);
    return NextResponse.json({ error: "Failed to load dashboard" }, { status: 500 });
  }
}
