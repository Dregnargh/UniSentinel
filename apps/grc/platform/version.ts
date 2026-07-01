// Platform version reported by /healthz, the shell UI and log lines.
// Injected at image build time (APP_VERSION build arg); falls back to the
// package version for local dev.
import pkg from "../package.json";

export const APP_VERSION: string = process.env.APP_VERSION ?? pkg.version;
