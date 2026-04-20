import path from "path";
import fs from "fs";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";

export function migrateImagesToFiles() {
  // Find posts that still have imageData in DB but no imagePath
  const posts = db.select().from(schema.posts).all();
  const toMigrate = posts.filter(p => p.imageData && !p.imagePath);

  if (toMigrate.length === 0) return;

  const imagesDir = path.join(process.cwd(), "data", "images");
  fs.mkdirSync(imagesDir, { recursive: true });

  for (const post of toMigrate) {
    try {
      const mimeType = post.imageMimeType || "image/jpeg";
      const ext = mimeType.split("/")[1]?.replace("jpeg", "jpg") || "jpg";
      const filename = `post-${post.id}-migrated.${ext}`;
      const filePath = path.join(imagesDir, filename);

      const buffer = Buffer.from(post.imageData!, "base64");
      fs.writeFileSync(filePath, buffer);

      const relativePath = `data/images/${filename}`;
      db.update(schema.posts)
        .set({ imagePath: relativePath, imageData: null })
        .where(eq(schema.posts.id, post.id))
        .run();

      console.log(`[InPoster] Migrated image for post ${post.id} → ${relativePath}`);
    } catch (err) {
      console.error(`[InPoster] Failed to migrate image for post ${post.id}:`, err);
    }
  }
}
