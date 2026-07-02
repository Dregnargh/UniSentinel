import { promises as fs } from "node:fs";
import path from "node:path";
import type { StorageDriver } from "./index";

// Local filesystem driver. Content type is stored in a ".meta" sidecar so the
// driver stays a plain directory tree (backup-friendly, no database coupling).
// All paths go through path.join/resolve — Windows-safe by construction.

export function createLocalStorage(root: string): StorageDriver {
  const resolvedRoot = path.resolve(root);

  function fullPath(key: string): string {
    const target = path.resolve(resolvedRoot, ...key.split("/"));
    if (!target.startsWith(resolvedRoot + path.sep)) {
      throw new Error("Storage key escapes the storage root");
    }
    return target;
  }

  return {
    async put(key, data, contentType) {
      const target = fullPath(key);
      await fs.mkdir(path.dirname(target), { recursive: true });
      await fs.writeFile(target, data);
      await fs.writeFile(target + ".meta", JSON.stringify({ contentType }));
    },
    async get(key) {
      const target = fullPath(key);
      try {
        const [data, meta] = await Promise.all([
          fs.readFile(target),
          fs.readFile(target + ".meta", "utf8").catch(() => "{}"),
        ]);
        const contentType = (JSON.parse(meta).contentType as string) ?? "application/octet-stream";
        return { data, contentType };
      } catch {
        return null;
      }
    },
    async delete(key) {
      const target = fullPath(key);
      await fs.rm(target, { force: true });
      await fs.rm(target + ".meta", { force: true });
    },
  };
}
