// Runs once when the Next server starts (before it serves requests): registers
// cross-module event listeners. Guarded to the Node runtime — the edge/proxy
// bundle must not import module wiring (db, node:crypto).
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("@/modules/wiring");
  }
}
