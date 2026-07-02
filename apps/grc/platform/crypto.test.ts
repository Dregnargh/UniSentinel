import { describe, expect, it } from "vitest";
import { decryptSecret, encryptSecret } from "./crypto";

describe("secrets at rest", () => {
  it("round-trips", () => {
    const secret = "smtp-p@ssw0rd with spaces and ünïcode";
    const stored = encryptSecret(secret);
    expect(stored).toMatch(/^v1:/);
    expect(stored).not.toContain(secret);
    expect(decryptSecret(stored)).toBe(secret);
  });

  it("produces distinct ciphertexts per call (random IV)", () => {
    expect(encryptSecret("same")).not.toBe(encryptSecret("same"));
  });

  it("rejects tampered ciphertext", () => {
    const stored = encryptSecret("value");
    const parts = stored.split(":");
    parts[3] = Buffer.from("tampered!!").toString("base64");
    expect(() => decryptSecret(parts.join(":"))).toThrow();
  });
});
