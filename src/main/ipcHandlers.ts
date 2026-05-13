/**
 * Compatibility shim. Handlers were split per-domain into `src/main/ipc/handlers/`.
 * `main/index.ts` keeps importing `registerIpcHandlers` from here.
 */
export { registerIpcHandlers } from './ipc';
