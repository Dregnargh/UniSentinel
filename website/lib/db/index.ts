import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import * as schema from "./schema";

// libSQL: local file in dev (file:./dev.db, zero setup), Turso in production
// (libsql://… + auth token). The client is lazy — no connection at import, so
// builds succeed even when env vars are absent.
const url = process.env.DATABASE_URL ?? "file:./dev.db";
const authToken = process.env.DATABASE_AUTH_TOKEN;

const client = createClient(authToken ? { url, authToken } : { url });

export const db = drizzle(client, { schema });
