// Secrets-at-rest encryption (SMTP passwords, connector credentials).
// AES-256-GCM with a key derived from SECRET_KEY (falls back to AUTH_SECRET so
// small installs need only one secret). Format: v1:<iv>:<tag>:<ciphertext>
// (base64). Server-only (node:crypto).
import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "node:crypto";

function key(): Buffer {
  const secret = process.env.SECRET_KEY ?? process.env.AUTH_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === "production") throw new Error("SECRET_KEY / AUTH_SECRET is not set");
    return scryptSync("dev-insecure-secret-change-me-please-0000", "unisentinel.v1", 32);
  }
  return scryptSync(secret, "unisentinel.v1", 32);
}

export function encryptSecret(plain: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(), iv);
  const ct = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  return `v1:${iv.toString("base64")}:${cipher.getAuthTag().toString("base64")}:${ct.toString("base64")}`;
}

export function decryptSecret(stored: string): string {
  const [version, ivB64, tagB64, ctB64] = stored.split(":");
  if (version !== "v1" || !ivB64 || !tagB64 || !ctB64) throw new Error("Unrecognized secret format");
  const decipher = createDecipheriv("aes-256-gcm", key(), Buffer.from(ivB64, "base64"));
  decipher.setAuthTag(Buffer.from(tagB64, "base64"));
  return Buffer.concat([decipher.update(Buffer.from(ctB64, "base64")), decipher.final()]).toString("utf8");
}
