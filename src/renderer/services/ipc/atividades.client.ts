import type { ActionResult, BeeforAtividade } from '@shared/types';
import type { BeeforApi } from '../../../main/preload';

export function createAtividadesClient(api: BeeforApi) {
  return {
    fetch: (): Promise<ActionResult<BeeforAtividade[]>> => api.fetchAtividades(),
  };
}

export const atividadesClient = createAtividadesClient(window.beefor);
export type AtividadesClient = ReturnType<typeof createAtividadesClient>;
