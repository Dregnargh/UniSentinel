import type { Metadata } from "next";
import { requirePermission } from "@/platform/rbac/guard";
import { P } from "@/platform/rbac/catalog";
import { getMailSettings } from "@/platform/notify/mail";
import { MailClient } from "./MailClient";

export const metadata: Metadata = { title: "Mail" };
export const dynamic = "force-dynamic";

export default async function MailPage() {
  const { user } = await requirePermission(P.settingsManage);
  const config = await getMailSettings(user.workspaceId);
  return (
    <MailClient
      configured={config !== null}
      hasPassword={Boolean(config?.passwordEncrypted)}
      initial={
        config
          ? { host: config.host, port: config.port, secure: config.secure, username: config.username, from: config.from }
          : null
      }
      adminEmail={user.email}
    />
  );
}
