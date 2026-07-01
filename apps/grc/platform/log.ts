// Structured JSON logging for every UniSentinel process (web, worker, migrate).
// One line per event so log collectors (CloudWatch, journald, Windows Event
// Log forwarders, `docker logs`) can parse without configuration.

export type LogLevel = "debug" | "info" | "warn" | "error";

const LEVEL_ORDER: Record<LogLevel, number> = { debug: 10, info: 20, warn: 30, error: 40 };

function threshold(): number {
  const configured = (process.env.LOG_LEVEL ?? "info").toLowerCase() as LogLevel;
  return LEVEL_ORDER[configured] ?? LEVEL_ORDER.info;
}

export interface Logger {
  debug(msg: string, ctx?: Record<string, unknown>): void;
  info(msg: string, ctx?: Record<string, unknown>): void;
  warn(msg: string, ctx?: Record<string, unknown>): void;
  error(msg: string, ctx?: Record<string, unknown>): void;
}

export function formatLine(
  component: string,
  level: LogLevel,
  msg: string,
  ctx?: Record<string, unknown>,
  now: Date = new Date(),
): string {
  return JSON.stringify({ ts: now.toISOString(), level, component, msg, ...ctx });
}

export function createLogger(component: string): Logger {
  const emit = (level: LogLevel, msg: string, ctx?: Record<string, unknown>) => {
    if (LEVEL_ORDER[level] < threshold()) return;
    const line = formatLine(component, level, msg, ctx);
    if (level === "error") console.error(line);
    else if (level === "warn") console.warn(line);
    else console.log(line);
  };
  return {
    debug: (msg, ctx) => emit("debug", msg, ctx),
    info: (msg, ctx) => emit("info", msg, ctx),
    warn: (msg, ctx) => emit("warn", msg, ctx),
    error: (msg, ctx) => emit("error", msg, ctx),
  };
}
