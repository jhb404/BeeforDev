import type { BeeforApi, BeeforHttpApi } from '../main/preload';

declare global {
  interface Window {
    beefor: BeeforApi;
    beeforHttp: BeeforHttpApi;
  }
}

export {};
