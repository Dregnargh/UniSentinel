import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { generateKeyPairSync, sign as edSign } from "node:crypto";
import { verifyLicenseFile, type LicensePayload } from "./license";

const { publicKey, privateKey } = generateKeyPairSync("ed25519");
const otherPair = generateKeyPairSync("ed25519");

function makeLicense(payload: LicensePayload, key = privateKey): string {
  const signature = edSign(null, Buffer.from(JSON.stringify(payload), "utf8"), key).toString("base64");
  return Buffer.from(JSON.stringify({ payload, signature })).toString("base64");
}

const payload: LicensePayload = {
  licenseId: "lic-1",
  customer: "Acme Corporation",
  modules: [{ key: "catalog" }, { key: "tasks", seats: 25 }],
  issuedAt: "2026-01-01T00:00:00.000Z",
  expiresAt: "2027-01-01T00:00:00.000Z",
};

describe("license verification", () => {
  beforeEach(() => {
    process.env.LICENSE_PUBLIC_KEY = publicKey.export({ type: "spki", format: "pem" }).toString();
  });
  afterEach(() => {
    delete process.env.LICENSE_PUBLIC_KEY;
  });

  it("accepts a correctly signed license", () => {
    const result = verifyLicenseFile(makeLicense(payload), new Date("2026-07-01"));
    expect(result).toMatchObject({ valid: true, expired: false });
    if (result.valid) expect(result.payload.modules.map((m) => m.key)).toEqual(["catalog", "tasks"]);
  });

  it("flags expiry without rejecting the signature", () => {
    const result = verifyLicenseFile(makeLicense(payload), new Date("2028-01-01"));
    expect(result).toMatchObject({ valid: true, expired: true });
  });

  it("rejects a tampered payload", () => {
    const envelope = JSON.parse(Buffer.from(makeLicense(payload), "base64").toString());
    envelope.payload.modules.push({ key: "risk" });
    const tampered = Buffer.from(JSON.stringify(envelope)).toString("base64");
    expect(verifyLicenseFile(tampered)).toMatchObject({ valid: false, reason: "License signature is invalid." });
  });

  it("rejects a license signed by the wrong key", () => {
    const result = verifyLicenseFile(makeLicense(payload, otherPair.privateKey));
    expect(result).toMatchObject({ valid: false });
  });

  it("rejects garbage and reports a missing public key", () => {
    expect(verifyLicenseFile("not-base64!!!")).toMatchObject({ valid: false });
    delete process.env.LICENSE_PUBLIC_KEY;
    expect(verifyLicenseFile(makeLicense(payload))).toMatchObject({
      valid: false,
      reason: expect.stringContaining("LICENSE_PUBLIC_KEY"),
    });
  });
});
