// Ed25519-signed license files: offline-verifiable, no phone-home. A license
// is base64(JSON{payload, signature}) where signature = Ed25519 over the
// canonical UTF-8 JSON of the payload.
//
// The verification public key comes from LICENSE_PUBLIC_KEY (PEM, or base64
// of the PEM to survive env quoting). A production public key gets baked into
// GA builds (deploy/licensing/README.md); until then the env var is required
// to use licensing at all. Framework-free (node:crypto only).
import { createPublicKey, verify as edVerify } from "node:crypto";
import { z } from "zod";

export const licensePayloadSchema = z.object({
  licenseId: z.string().min(1),
  customer: z.string().min(1),
  modules: z.array(z.object({ key: z.string().min(1), seats: z.number().int().positive().optional() })).min(1),
  issuedAt: z.string(), // ISO date
  expiresAt: z.string(), // ISO date
});

export type LicensePayload = z.infer<typeof licensePayloadSchema>;

// Replace with the production public key PEM at GA; null = env-only.
const BAKED_PUBLIC_KEY_PEM: string | null = null;

export function licensePublicKeyPem(): string | null {
  const fromEnv = process.env.LICENSE_PUBLIC_KEY;
  if (fromEnv) {
    return fromEnv.includes("BEGIN PUBLIC KEY")
      ? fromEnv
      : Buffer.from(fromEnv, "base64").toString("utf8");
  }
  return BAKED_PUBLIC_KEY_PEM;
}

export type LicenseVerification =
  | { valid: true; payload: LicensePayload; expired: boolean }
  | { valid: false; reason: string };

export function verifyLicenseFile(fileContent: string, now: Date = new Date()): LicenseVerification {
  const pem = licensePublicKeyPem();
  if (!pem) {
    return { valid: false, reason: "No license public key is configured on this instance (LICENSE_PUBLIC_KEY)." };
  }
  let envelope: { payload?: unknown; signature?: string };
  try {
    envelope = JSON.parse(Buffer.from(fileContent.trim(), "base64").toString("utf8"));
  } catch {
    return { valid: false, reason: "Not a readable license file." };
  }
  if (!envelope.payload || typeof envelope.signature !== "string") {
    return { valid: false, reason: "License file is missing its payload or signature." };
  }
  const parsed = licensePayloadSchema.safeParse(envelope.payload);
  if (!parsed.success) return { valid: false, reason: "License payload has an unexpected shape." };

  let signatureOk = false;
  try {
    signatureOk = edVerify(
      null,
      Buffer.from(JSON.stringify(envelope.payload), "utf8"),
      createPublicKey(pem),
      Buffer.from(envelope.signature, "base64"),
    );
  } catch {
    signatureOk = false;
  }
  if (!signatureOk) return { valid: false, reason: "License signature is invalid." };

  const expired = new Date(parsed.data.expiresAt).getTime() < now.getTime();
  return { valid: true, payload: parsed.data, expired };
}
