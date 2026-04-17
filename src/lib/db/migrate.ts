import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { db } from "./index";
import path from "path";

export function runMigrations() {
  migrate(db, { migrationsFolder: path.join(process.cwd(), "drizzle") });
}
