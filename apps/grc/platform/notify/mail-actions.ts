"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { logAudit } from "../audit";
import { guardAction } from "../rbac/guard";
import { P } from "../rbac/catalog";
import type { ActionState } from "../auth/actions";
import { getMailSettings, saveMailSettings, sendMailNow } from "./mail";

const firstError = (e: z.ZodError): string => e.issues[0]?.message ?? "Please check the form.";
const MAIL_PATH = "/settings/mail";

const formSchema = z.object({
  host: z.string().trim().min(1, "Enter the SMTP host."),
  port: z.coerce.number().int().min(1).max(65535),
  secure: z.coerce.boolean().default(false),
  username: z.string().trim().optional().default(""),
  // Blank keeps the stored password; "-" clears it.
  password: z.string().optional().default(""),
  from: z.string().trim().min(3, "Enter the From address."),
});

export async function updateMailSettings(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const gate = await guardAction(P.settingsManage);
  if ("error" in gate) return gate;
  const parsed = formSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: firstError(parsed.error) };
  const d = parsed.data;

  await saveMailSettings(gate.user.workspaceId, {
    host: d.host,
    port: d.port,
    secure: d.secure,
    username: d.username,
    password: d.password === "" ? null : d.password === "-" ? "" : d.password,
    from: d.from,
  });
  await logAudit({
    workspaceId: gate.user.workspaceId,
    actor: { id: gate.user.id, name: gate.user.name, email: gate.user.email },
    action: "settings.mail_updated",
    entityType: "settings",
    entityId: "mail.smtp",
    summary: `Updated SMTP settings (${d.host}:${d.port}).`,
  });
  revalidatePath(MAIL_PATH);
  return { ok: true };
}

/** Sends a test message to the signed-in admin, synchronously for feedback. */
export async function sendTestEmail(): Promise<ActionState> {
  const gate = await guardAction(P.settingsManage);
  if ("error" in gate) return gate;
  if (!(await getMailSettings(gate.user.workspaceId))) {
    return { error: "Save the SMTP settings first." };
  }
  try {
    await sendMailNow(gate.user.workspaceId, {
      to: gate.user.email,
      subject: "UniSentinel — test email",
      text: "If you can read this, SMTP is configured correctly.",
    });
    return { ok: true };
  } catch (err) {
    return { error: `Sending failed: ${err instanceof Error ? err.message : String(err)}` };
  }
}
