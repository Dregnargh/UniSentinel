// Pure promotion-wizard helpers — shared by server actions and the client
// wizard, no db imports.

/** What the wizard decided for one local scope item. */
export type ScopeDecision =
  | { kind: "skip" }
  | { kind: "create" }
  | { kind: "link"; type: "catalog:service" | "catalog:asset"; id: string };

/**
 * Wizard select values: "skip" | "create" | "link|<entityType>|<entityId>".
 * "|" is safe as a separator — entity types are manifest constants and ids
 * are UUIDs.
 */
export function parseScopeDecision(value: string): ScopeDecision | null {
  if (value === "skip") return { kind: "skip" };
  if (value === "create") return { kind: "create" };
  if (value.startsWith("link|")) {
    const [, type, id] = value.split("|");
    if ((type === "catalog:service" || type === "catalog:asset") && id) {
      return { kind: "link", type, id };
    }
  }
  return null;
}

/** Local scope kinds → what the wizard provisions in the catalog. */
export function catalogKindFor(scopeKind: string): "service" | "asset" {
  return scopeKind === "service" || scopeKind === "process" ? "service" : "asset";
}
