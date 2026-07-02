// Generates an Ed25519 license-signing keypair (vendor side).
//   node deploy/licensing/keygen.mjs <output-dir>
// Keep the private key OFFLINE — it is the ability to issue UniSentinel
// licenses. The public key goes into LICENSE_PUBLIC_KEY on instances (and is
// baked into GA builds).
import { generateKeyPairSync } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

const outDir = path.resolve(process.argv[2] ?? ".");
mkdirSync(outDir, { recursive: true });

const { publicKey, privateKey } = generateKeyPairSync("ed25519");
const pub = publicKey.export({ type: "spki", format: "pem" });
const priv = privateKey.export({ type: "pkcs8", format: "pem" });

writeFileSync(path.join(outDir, "license-signing.public.pem"), pub);
writeFileSync(path.join(outDir, "license-signing.private.pem"), priv, { mode: 0o600 });

console.log(`Wrote license-signing.public.pem and license-signing.private.pem to ${outDir}`);
console.log("\nLICENSE_PUBLIC_KEY (base64 for env files):");
console.log(Buffer.from(pub).toString("base64"));
