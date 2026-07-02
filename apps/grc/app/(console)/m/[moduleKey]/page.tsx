import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireModule } from "@/platform/modules/guard";
import { getModule } from "@/modules/registry";
import { ModuleHomeClient } from "./ModuleHomeClient";

export const dynamic = "force-dynamic";

export async function generateMetadata(props: {
  params: Promise<{ moduleKey: string }>;
}): Promise<Metadata> {
  const { moduleKey } = await props.params;
  return { title: getModule(moduleKey)?.name ?? "Module" };
}

export default async function ModuleHomePage(props: { params: Promise<{ moduleKey: string }> }) {
  const { moduleKey } = await props.params;
  const manifest = getModule(moduleKey);
  if (!manifest) notFound();
  await requireModule(moduleKey);
  return (
    <ModuleHomeClient
      name={manifest.name}
      description={manifest.description}
      icon={manifest.icon}
      plannedPhase={manifest.plannedPhase}
      permissionCount={manifest.permissions.resources.reduce((n, r) => n + r.actions.length, 0)}
      entityTypes={manifest.entityTypes}
    />
  );
}
