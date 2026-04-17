import { db, schema } from "./db";
import { eq } from "drizzle-orm";
import { encrypt, decrypt } from "./crypto";

const SENSITIVE_KEYS = [
  "anthropic_api_key",
  "make_webhook_api_key",
  "openai_api_key",
  "unsplash_access_key",
];

export async function getSetting(key: string): Promise<string | null> {
  const result = db.select().from(schema.settings).where(eq(schema.settings.key, key)).get();
  if (!result) return null;
  return result.encrypted ? decrypt(result.value) : result.value;
}

export async function setSetting(key: string, value: string): Promise<void> {
  const shouldEncrypt = SENSITIVE_KEYS.includes(key);
  const storedValue = shouldEncrypt ? encrypt(value) : value;
  db.insert(schema.settings)
    .values({ key, value: storedValue, encrypted: shouldEncrypt, updatedAt: new Date().toISOString() })
    .onConflictDoUpdate({
      target: schema.settings.key,
      set: { value: storedValue, encrypted: shouldEncrypt, updatedAt: new Date().toISOString() },
    })
    .run();
}

export async function getAllSettings(): Promise<Record<string, string>> {
  const results = db.select().from(schema.settings).all();
  const out: Record<string, string> = {};
  for (const row of results) {
    out[row.key] = row.encrypted ? decrypt(row.value) : row.value;
  }
  return out;
}

export async function deleteSetting(key: string): Promise<void> {
  db.delete(schema.settings).where(eq(schema.settings.key, key)).run();
}
