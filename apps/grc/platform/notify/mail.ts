// SMTP mail. Framework-free (no next imports) so the worker bundles it too.
import nodemailer from "nodemailer";
import { z } from "zod";
import { decryptSecret, encryptSecret } from "../crypto";
import { getSetting, setSetting } from "../settings";

export const mailSettingsSchema = z.object({
  host: z.string().min(1),
  port: z.number().int().min(1).max(65535),
  secure: z.boolean(),
  username: z.string().optional().default(""),
  // Encrypted at rest (v1:iv:tag:ct); empty string = no auth password.
  passwordEncrypted: z.string().optional().default(""),
  from: z.string().min(3),
});

export type MailSettings = z.infer<typeof mailSettingsSchema>;

const NS = "mail";
const KEY = "smtp";

export async function getMailSettings(workspaceId: string): Promise<MailSettings | null> {
  return getSetting(workspaceId, NS, KEY, mailSettingsSchema);
}

export async function saveMailSettings(
  workspaceId: string,
  input: { host: string; port: number; secure: boolean; username: string; password: string | null; from: string },
): Promise<void> {
  const existing = await getMailSettings(workspaceId);
  const passwordEncrypted =
    input.password === null
      ? (existing?.passwordEncrypted ?? "") // blank form field keeps the stored password
      : input.password === ""
        ? ""
        : encryptSecret(input.password);
  const value: MailSettings = {
    host: input.host,
    port: input.port,
    secure: input.secure,
    username: input.username,
    passwordEncrypted,
    from: input.from,
  };
  await setSetting(workspaceId, NS, KEY, value);
}

export function buildTransport(config: MailSettings) {
  return nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: config.username
      ? { user: config.username, pass: config.passwordEncrypted ? decryptSecret(config.passwordEncrypted) : "" }
      : undefined,
  });
}

/** Sends immediately (test button, worker job handler). Throws on failure. */
export async function sendMailNow(
  workspaceId: string,
  message: { to: string; subject: string; text: string },
): Promise<void> {
  const config = await getMailSettings(workspaceId);
  if (!config) throw new Error("SMTP is not configured");
  const transport = buildTransport(config);
  await transport.sendMail({ from: config.from, ...message });
}
