import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const settings = sqliteTable("settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  encrypted: integer("encrypted", { mode: "boolean" }).default(false),
  updatedAt: text("updated_at").default(sql`(datetime('now'))`),
});

export const posts = sqliteTable("posts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  linkedinId: text("linkedin_id").unique(),
  content: text("content").notNull(),
  source: text("source", { enum: ["ai_generated"] }).notNull().default("ai_generated"),
  status: text("status", { enum: ["draft", "approved", "published", "discarded"] }).notNull().default("draft"),
  tone: text("tone"),
  publishedAt: text("published_at"),
  linkedinUrl: text("linkedin_url"),
  likes: integer("likes").default(0),
  comments: integer("comments").default(0),
  shares: integer("shares").default(0),
  imageData: text("image_data"),
  imageMimeType: text("image_mime_type"),
  createdAt: text("created_at").default(sql`(datetime('now'))`),
  updatedAt: text("updated_at").default(sql`(datetime('now'))`),
});
