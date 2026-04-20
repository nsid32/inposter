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
  content: text("content").notNull(),
  source: text("source", { enum: ["ai_generated"] }).notNull().default("ai_generated"),
  status: text("status", { enum: ["draft", "approved", "published", "discarded"] }).notNull().default("draft"),
  tone: text("tone"),
  publishedAt: text("published_at"),
  imagePath: text("image_path"),
  imageData: text("image_data"),
  imageMimeType: text("image_mime_type"),
  createdAt: text("created_at").default(sql`(datetime('now'))`),
  updatedAt: text("updated_at").default(sql`(datetime('now'))`),
});
