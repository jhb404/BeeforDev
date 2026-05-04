import type { BeeforApi } from '../main/preload';

declare global {
  interface Window {
    beefor: BeeforApi;
  }
}

export {};
