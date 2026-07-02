// Server-side module wiring: every module's event listeners register here.
// Imported once from instrumentation.ts at server start. Listeners for a
// module run regardless of licensing state, but they only ever REACT to
// events, and unlicensed modules can't emit — so they stay inert.
import { registerRiskListeners } from "./risk/server";

registerRiskListeners();
