"use server";

import { revalidatePath } from "next/cache";
import { logAudit } from "./audit";
import { guardAction } from "./rbac/guard";
import { P } from "./rbac/catalog";
import { getStorage, storageKey } from "./storage";
import { deleteSetting, setSetting } from "./settings";
import { getBranding } from "./branding";
import type { ActionState } from "./auth/actions";

const BRANDING_PATH = "/settings/branding";

// SVG deliberately excluded (script-injection surface); raster formats only.
const ALLOWED: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
};
const MAX_BYTES = 1024 * 1024; // 1 MB

export async function uploadLogo(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const gate = await guardAction(P.settingsManage);
  if ("error" in gate) return gate;

  const file = formData.get("logo");
  if (!(file instanceof File) || file.size === 0) return { error: "Choose an image file." };
  if (file.size > MAX_BYTES) return { error: "Logo must be 1 MB or smaller." };
  const ext = ALLOWED[file.type];
  if (!ext) return { error: "Use a PNG, JPEG or WebP image." };

  const data = Buffer.from(await file.arrayBuffer());
  const key = storageKey(gate.user.workspaceId, "branding", `logo.${ext}`);
  const previous = await getBranding(gate.user.workspaceId);
  await getStorage().put(key, data, file.type);
  if (previous && previous.logoKey !== key) {
    await getStorage().delete(previous.logoKey).catch(() => {});
  }
  await setSetting(gate.user.workspaceId, "branding", "logo", { logoKey: key, contentType: file.type });
  await logAudit({
    workspaceId: gate.user.workspaceId,
    actor: { id: gate.user.id, name: gate.user.name, email: gate.user.email },
    action: "branding.logo_updated",
    entityType: "settings",
    entityId: "branding.logo",
    summary: `Uploaded a new company logo (${file.type}, ${Math.round(file.size / 1024)} kB).`,
  });
  revalidatePath("/", "layout");
  revalidatePath(BRANDING_PATH);
  return { ok: true };
}

export async function removeLogo(): Promise<ActionState> {
  const gate = await guardAction(P.settingsManage);
  if ("error" in gate) return gate;
  const current = await getBranding(gate.user.workspaceId);
  if (current) {
    await getStorage().delete(current.logoKey).catch(() => {});
    await deleteSetting(gate.user.workspaceId, "branding", "logo");
    await logAudit({
      workspaceId: gate.user.workspaceId,
      actor: { id: gate.user.id, name: gate.user.name, email: gate.user.email },
      action: "branding.logo_removed",
      entityType: "settings",
      entityId: "branding.logo",
      summary: "Removed the company logo.",
    });
  }
  revalidatePath("/", "layout");
  revalidatePath(BRANDING_PATH);
  return { ok: true };
}
