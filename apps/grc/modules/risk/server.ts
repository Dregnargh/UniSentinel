// Risk module event listeners (registered once via modules/wiring.ts).
import { eq } from "drizzle-orm";
import { rskRisks } from "@unisentinel/db";
import { getDb } from "@/platform/db";
import { listTasksByOrigin } from "@/modules/tasks/queries";
import { onEvent } from "@/platform/events";
import { logAudit, SYSTEM_ACTOR } from "@/platform/audit";
import { notify } from "@/platform/notify/service";
import { createLogger } from "@/platform/log";

const log = createLogger("risk-listeners");

// Guard on globalThis, not module scope: the bundler can evaluate more than
// one copy of this module, and the listener registry itself is global.
const globalCache = globalThis as unknown as { __usRiskListenersRegistered?: boolean };

export function registerRiskListeners(): void {
  if (globalCache.__usRiskListenersRegistered) return;
  globalCache.__usRiskListenersRegistered = true;

  // When a task that originated from a risk completes, roll the progress back
  // into the risk: audit entry on the risk + notify the risk owner.
  onEvent("task.completed", async (event) => {
    if (event.payload.originType !== "risk:risk" || typeof event.payload.originId !== "string") return;
    const { db } = getDb();
    const risks = await db
      .select()
      .from(rskRisks)
      .where(eq(rskRisks.id, event.payload.originId))
      .limit(1);
    const risk = risks[0];
    if (!risk || risk.workspaceId !== event.workspaceId) return;

    const linked = await listTasksByOrigin(event.workspaceId, { type: "risk:risk", id: risk.id });
    const done = linked.filter((t) => t.status === "done").length;

    await logAudit({
      workspaceId: event.workspaceId,
      actor: SYSTEM_ACTOR,
      action: "risk.treatment_progress",
      entityType: "risk:risk",
      entityId: risk.id,
      summary: `Treatment task “${String(event.payload.title ?? "")}” completed — ${done}/${linked.length} treatment tasks done for ${risk.ref}.`,
    });
    if (risk.ownerUserId && risk.ownerUserId !== event.actorUserId) {
      await notify({
        workspaceId: event.workspaceId,
        userIds: [risk.ownerUserId],
        type: "risk.treatment_progress",
        title: `Treatment progress on ${risk.ref}`,
        body: `“${String(event.payload.title ?? "a treatment task")}” was completed (${done}/${linked.length} done).`,
        href: `/m/risk/register/${risk.id}`,
      });
    }
    log.debug("treatment progress rolled up", { risk: risk.ref, done, total: linked.length });
  });
}
