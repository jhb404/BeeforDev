/**
 * Compatibility shim. Channels now live in `src/shared/ipc/channels.ts`.
 * Existing imports `from '../shared/ipc'` continue to work via this re-export.
 */
export * from './ipc/index';
