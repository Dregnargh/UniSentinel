// RFC 6238 TOTP (HMAC-SHA1, 30s step, 6 digits) + RFC 4648 base32 — built on
// node:crypto, no dependencies, verified against the RFC test vectors in
// totp.test.ts. Server-only (node:crypto).
import { createHmac, randomBytes, timingSafeEqual, createHash } from "node:crypto";

const B32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

export function base32Encode(buf: Buffer): string {
  let bits = 0;
  let value = 0;
  let out = "";
  for (const byte of buf) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      out += B32_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) out += B32_ALPHABET[(value << (5 - bits)) & 31];
  return out;
}

export function base32Decode(s: string): Buffer {
  const clean = s.toUpperCase().replace(/=+$/, "").replace(/\s+/g, "");
  let bits = 0;
  let value = 0;
  const out: number[] = [];
  for (const ch of clean) {
    const idx = B32_ALPHABET.indexOf(ch);
    if (idx === -1) throw new Error("Invalid base32 character");
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      out.push((value >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }
  return Buffer.from(out);
}

function hotp(secret: Buffer, counter: number, digits: number): string {
  const msg = Buffer.alloc(8);
  msg.writeBigUInt64BE(BigInt(counter));
  const digest = createHmac("sha1", secret).update(msg).digest();
  const offset = digest[digest.length - 1]! & 0x0f;
  const code =
    ((digest[offset]! & 0x7f) << 24) |
    (digest[offset + 1]! << 16) |
    (digest[offset + 2]! << 8) |
    digest[offset + 3]!;
  return (code % 10 ** digits).toString().padStart(digits, "0");
}

export function totpCode(secretB32: string, timeMs: number, step = 30, digits = 6): string {
  const counter = Math.floor(timeMs / 1000 / step);
  return hotp(base32Decode(secretB32), counter, digits);
}

/** Accepts the current step ±window (clock drift on the phone/server). */
export function verifyTotp(secretB32: string, code: string, timeMs = Date.now(), window = 1): boolean {
  const normalized = code.replace(/\s+/g, "");
  if (!/^\d{6}$/.test(normalized)) return false;
  for (let w = -window; w <= window; w++) {
    const candidate = totpCode(secretB32, timeMs + w * 30_000);
    if (timingSafeEqual(Buffer.from(candidate), Buffer.from(normalized))) return true;
  }
  return false;
}

export function generateTotpSecret(): string {
  return base32Encode(randomBytes(20));
}

export function otpauthUrl(issuer: string, account: string, secretB32: string): string {
  const label = `${encodeURIComponent(issuer)}:${encodeURIComponent(account)}`;
  return `otpauth://totp/${label}?secret=${secretB32}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=6&period=30`;
}

// ---- Recovery codes ---------------------------------------------------------

export function generateRecoveryCodes(count = 8): { plain: string[]; hashes: string[] } {
  const plain = Array.from({ length: count }, () => {
    const raw = randomBytes(5).toString("hex"); // 10 hex chars
    return `${raw.slice(0, 5)}-${raw.slice(5)}`;
  });
  return { plain, hashes: plain.map(hashRecoveryCode) };
}

export function hashRecoveryCode(code: string): string {
  return createHash("sha256").update(code.trim().toLowerCase()).digest("hex");
}
