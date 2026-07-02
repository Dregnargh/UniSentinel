// Issues a UniSentinel license file (vendor side).
//   node deploy/licensing/sign-license.mjs --key license-signing.private.pem \
//     --customer "Acme Corporation" --modules catalog,tasks,risk \
//     --expires 2027-01-01 [--seats 25] > acme.license
import { createPrivateKey, randomUUID, sign as edSign } from "node:crypto";
import { readFileSync } from "node:fs";

const args = {};
for (let i = 2; i < process.argv.length; i += 2) {
  args[process.argv[i].replace(/^--/, "")] = process.argv[i + 1];
}
const required = ["key", "customer", "modules", "expires"];
for (const r of required) {
  if (!args[r]) {
    console.error(`Missing --${r}. Usage: sign-license.mjs --key <pem> --customer <name> --modules a,b --expires YYYY-MM-DD [--seats N]`);
    process.exit(1);
  }
}

const payload = {
  licenseId: randomUUID(),
  customer: args.customer,
  modules: args.modules.split(",").map((key) => ({
    key: key.trim(),
    ...(args.seats ? { seats: Number(args.seats) } : {}),
  })),
  issuedAt: new Date().toISOString(),
  expiresAt: new Date(`${args.expires}T23:59:59.000Z`).toISOString(),
};

const privateKey = createPrivateKey(readFileSync(args.key, "utf8"));
const signature = edSign(null, Buffer.from(JSON.stringify(payload), "utf8"), privateKey).toString("base64");
process.stdout.write(Buffer.from(JSON.stringify({ payload, signature })).toString("base64"));
console.error(`\nIssued ${payload.licenseId} for "${payload.customer}" (${args.modules}), expires ${payload.expiresAt}.`);
