export const APP_EVENTS = {
  SETTINGS_CHANGED: 'beefor:settings-changed',
  OPEN_KUDO: 'beefor:open-kudo',
  CODES_CHANGED: 'beefor:codes-changed',
  COIN2U_CHANGED: 'beefor:coin2u-changed',
} as const;

export type AppEventName = (typeof APP_EVENTS)[keyof typeof APP_EVENTS];

export function emitAppEvent(name: AppEventName): void {
  window.dispatchEvent(new Event(name));
}

export function onAppEvent(name: AppEventName, cb: () => void): () => void {
  window.addEventListener(name, cb);
  return () => window.removeEventListener(name, cb);
}
