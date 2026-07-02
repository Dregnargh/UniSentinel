// Pluggable file storage. Phase 3 ships the local-filesystem driver (works in
// Docker volumes and on Windows NTFS paths alike); an S3 driver lands with
// cloud GA behind this same interface. Framework-free (worker bundles it).
import path from "node:path";
import { createLocalStorage } from "./local";

export interface StorageDriver {
  put(key: string, data: Buffer, contentType: string): Promise<void>;
  get(key: string): Promise<{ data: Buffer; contentType: string } | null>;
  delete(key: string): Promise<void>;
}

const globalCache = globalThis as unknown as { __usStorage?: StorageDriver };

export function getStorage(): StorageDriver {
  if (!globalCache.__usStorage) {
    const driver = process.env.FILE_STORAGE ?? "local";
    if (driver !== "local") {
      throw new Error(`Unknown FILE_STORAGE driver: ${driver} (supported: local)`);
    }
    const root = process.env.FILE_STORAGE_PATH ?? path.join(process.cwd(), "data", "files");
    globalCache.__usStorage = createLocalStorage(root);
  }
  return globalCache.__usStorage;
}

/** Storage keys are always forward-slash form: "<workspaceId>/<area>/<name>". */
export function storageKey(...parts: string[]): string {
  const clean = parts.map((p) => p.replace(/[^a-zA-Z0-9._-]/g, "_"));
  return clean.join("/");
}
