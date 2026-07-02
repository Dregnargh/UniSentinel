"use client";

import * as React from "react";
import { useActionState, useTransition } from "react";
import { Alert, Badge, Button, Card, Input, Modal, Select, Table, Textarea } from "@unisentinel/ui";
import type { ActionState } from "@/platform/auth/actions";
import { deleteAsset, importAssetsCsv, saveAsset, type ImportState } from "@/modules/catalog/actions";
import { ASSET_TYPES, ASSET_TYPE_LABEL, classificationTone, statusTone } from "@/modules/catalog/format";

interface Option {
  id: string;
  name: string;
}

export interface AssetRow {
  id: string;
  name: string;
  type: string;
  description: string;
  location: string;
  classification: string;
  status: string;
  ownerName: string | null;
  attributes: Record<string, string>;
}

export function AssetsClient({
  assets,
  owners,
  canManage,
  canImport,
}: {
  assets: AssetRow[];
  owners: Option[];
  canManage: boolean;
  canImport: boolean;
}) {
  const [query, setQuery] = React.useState("");
  const [typeFilter, setTypeFilter] = React.useState<string>("all");
  const [editorTarget, setEditorTarget] = React.useState<AssetRow | "new" | null>(null);
  const [importOpen, setImportOpen] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const visible = assets.filter(
    (a) =>
      (typeFilter === "all" || a.type === typeFilter) &&
      (a.name.toLowerCase().includes(query.toLowerCase()) ||
        a.location.toLowerCase().includes(query.toLowerCase())),
  );

  const remove = (asset: AssetRow) =>
    startTransition(async () => {
      const result = await deleteAsset(asset.id);
      setError(result.error ?? null);
    });

  return (
    <div className="stack">
      <div className="page-head">
        <div>
          <h1>Assets</h1>
          <p>The inventory: hardware, software, data, people, facilities and cloud.</p>
        </div>
        <div style={{ display: "flex", gap: "var(--us-space-2)" }}>
          {canImport && (
            <Button variant="outline" onClick={() => setImportOpen(true)}>
              Import CSV
            </Button>
          )}
          {canManage && <Button onClick={() => setEditorTarget("new")}>New asset</Button>}
        </div>
      </div>
      {error && (
        <Alert tone="danger" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      <Card>
        <Card.Body>
          <div style={{ display: "flex", gap: "var(--us-space-2)", marginBottom: "var(--us-space-4)", flexWrap: "wrap" }}>
            <div style={{ maxWidth: 280, flex: 1, minWidth: 200 }}>
              <Input placeholder="Search assets…" value={query} onChange={(e) => setQuery(e.target.value)} />
            </div>
            <div className="seg">
              <button type="button" data-active={typeFilter === "all" || undefined} onClick={() => setTypeFilter("all")}>
                All
              </button>
              {ASSET_TYPES.map((t) => (
                <button key={t} type="button" data-active={typeFilter === t || undefined} onClick={() => setTypeFilter(t)}>
                  {ASSET_TYPE_LABEL[t]}
                </button>
              ))}
            </div>
          </div>
          {visible.length === 0 ? (
            <p className="muted" style={{ margin: 0 }}>
              {assets.length === 0 ? "No assets yet — create one or import a CSV." : "No assets match."}
            </p>
          ) : (
            <Table hoverable>
              <Table.Head>
                <Table.Row>
                  <Table.HeaderCell>Asset</Table.HeaderCell>
                  <Table.HeaderCell>Type</Table.HeaderCell>
                  <Table.HeaderCell>Classification</Table.HeaderCell>
                  <Table.HeaderCell>Status</Table.HeaderCell>
                  <Table.HeaderCell>Location</Table.HeaderCell>
                  <Table.HeaderCell>Owner</Table.HeaderCell>
                  {canManage && <Table.HeaderCell align="right">Actions</Table.HeaderCell>}
                </Table.Row>
              </Table.Head>
              <Table.Body>
                {visible.map((a) => (
                  <Table.Row key={a.id}>
                    <Table.Cell>
                      <div style={{ fontWeight: 500 }}>{a.name}</div>
                      {Object.keys(a.attributes).length > 0 && (
                        <div className="muted mono" style={{ fontSize: "var(--us-text-xs)" }}>
                          {Object.entries(a.attributes)
                            .slice(0, 3)
                            .map(([k, v]) => `${k}=${v}`)
                            .join(" · ")}
                        </div>
                      )}
                    </Table.Cell>
                    <Table.Cell>
                      <Badge tone="info">{ASSET_TYPE_LABEL[a.type] ?? a.type}</Badge>
                    </Table.Cell>
                    <Table.Cell>
                      <Badge tone={classificationTone[a.classification] ?? "neutral"}>{a.classification}</Badge>
                    </Table.Cell>
                    <Table.Cell>
                      <Badge tone={statusTone[a.status] ?? "neutral"} dot>
                        {a.status}
                      </Badge>
                    </Table.Cell>
                    <Table.Cell>{a.location || <span className="muted">—</span>}</Table.Cell>
                    <Table.Cell>{a.ownerName ?? <span className="muted">—</span>}</Table.Cell>
                    {canManage && (
                      <Table.Cell align="right">
                        <div style={{ display: "inline-flex", gap: 6 }}>
                          <Button size="sm" variant="ghost" onClick={() => setEditorTarget(a)}>
                            Edit
                          </Button>
                          <Button size="sm" variant="danger" disabled={pending} onClick={() => remove(a)}>
                            Delete
                          </Button>
                        </div>
                      </Table.Cell>
                    )}
                  </Table.Row>
                ))}
              </Table.Body>
            </Table>
          )}
        </Card.Body>
      </Card>
      <AssetEditorModal
        key={editorTarget === "new" ? "new" : (editorTarget?.id ?? "none")}
        target={editorTarget}
        owners={owners}
        onClose={() => setEditorTarget(null)}
      />
      <ImportModal key={importOpen ? "open" : "closed"} open={importOpen} onClose={() => setImportOpen(false)} />
    </div>
  );
}

function AssetEditorModal({
  target,
  owners,
  onClose,
}: {
  target: AssetRow | "new" | null;
  owners: Option[];
  onClose: () => void;
}) {
  const isNew = target === "new";
  const asset = isNew || target === null ? null : target;
  const [state, action, pending] = useActionState<ActionState, FormData>(saveAsset, {});
  const [attrs, setAttrs] = React.useState<{ key: string; value: string }[]>(
    asset ? Object.entries(asset.attributes).map(([key, value]) => ({ key, value })) : [],
  );
  React.useEffect(() => {
    if (state.ok) onClose();
  }, [state.ok, onClose]);

  return (
    <Modal open={target !== null} onClose={onClose} title={isNew ? "New asset" : `Edit — ${asset?.name}`} size="md">
      <form action={action}>
        <Modal.Body>
          <div className="form-grid">
            {state.error && <Alert tone="danger">{state.error}</Alert>}
            {!isNew && <input type="hidden" name="assetId" value={asset?.id ?? ""} />}
            <label htmlFor="asset-name">Name</label>
            <Input id="asset-name" name="name" defaultValue={asset?.name} required placeholder="core-db-01" />
            <label htmlFor="asset-type">Type</label>
            <Select id="asset-type" name="type" defaultValue={asset?.type ?? "hardware"}>
              {ASSET_TYPES.map((t) => (
                <option key={t} value={t}>
                  {ASSET_TYPE_LABEL[t]}
                </option>
              ))}
            </Select>
            <label htmlFor="asset-classification">Classification</label>
            <Select id="asset-classification" name="classification" defaultValue={asset?.classification ?? "internal"}>
              <option value="public">Public</option>
              <option value="internal">Internal</option>
              <option value="confidential">Confidential</option>
              <option value="restricted">Restricted</option>
            </Select>
            <label htmlFor="asset-status">Status</label>
            <Select id="asset-status" name="status" defaultValue={asset?.status ?? "active"}>
              <option value="active">Active</option>
              <option value="planned">Planned</option>
              <option value="retired">Retired</option>
            </Select>
            <label htmlFor="asset-location">Location</label>
            <Input id="asset-location" name="location" defaultValue={asset?.location} placeholder="eu-west-1 / HQ / SaaS" />
            <label htmlFor="asset-owner">Owner</label>
            <Select id="asset-owner" name="ownerUserId" defaultValue="">
              <option value="">— none —</option>
              {owners.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name}
                </option>
              ))}
            </Select>
            <label htmlFor="asset-desc">Description</label>
            <Textarea id="asset-desc" name="description" defaultValue={asset?.description} rows={2} />
            <label>Attributes</label>
            {attrs.map((attr, i) => (
              <div key={i} style={{ display: "flex", gap: 8 }}>
                <Input
                  name="attrKey"
                  defaultValue={attr.key}
                  placeholder="key (e.g. ip)"
                  aria-label={`Attribute ${i + 1} key`}
                />
                <Input
                  name="attrValue"
                  defaultValue={attr.value}
                  placeholder="value"
                  aria-label={`Attribute ${i + 1} value`}
                />
              </div>
            ))}
            <div>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => setAttrs((a) => [...a, { key: "", value: "" }])}
              >
                + Add attribute
              </Button>
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={pending}>
            {isNew ? "Create asset" : "Save"}
          </Button>
        </Modal.Footer>
      </form>
    </Modal>
  );
}

function ImportModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [state, action, pending] = useActionState<ImportState, FormData>(importAssetsCsv, {});
  return (
    <Modal open={open} onClose={onClose} title="Import assets from CSV" size="md">
      <form action={action}>
        <Modal.Body>
          <div className="form-grid">
            {state.error && <Alert tone="danger">{state.error}</Alert>}
            {state.ok && (
              <Alert tone={state.problems?.length ? "warning" : "success"} title={`Imported ${state.imported} asset${state.imported === 1 ? "" : "s"}`}>
                {state.skipped && state.skipped.length > 0 && (
                  <div>Skipped existing: {state.skipped.join(", ")}</div>
                )}
                {state.problems && state.problems.length > 0 && (
                  <div>Problems: {state.problems.join(" ")}</div>
                )}
              </Alert>
            )}
            <p style={{ margin: 0 }}>
              Header must include <code className="mono">name</code> and <code className="mono">type</code>; optional:
              <code className="mono"> description, location, classification</code> and any{" "}
              <code className="mono">attr:&lt;key&gt;</code> columns. Existing assets (same name and type) are skipped.
            </p>
            <input type="file" name="file" accept=".csv,text/csv" required />
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" type="button" onClick={onClose}>
            {state.ok ? "Done" : "Cancel"}
          </Button>
          <Button type="submit" loading={pending}>
            Import
          </Button>
        </Modal.Footer>
      </form>
    </Modal>
  );
}
