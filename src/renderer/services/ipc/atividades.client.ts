import type { ActionResult, BeeforAtividade } from '@shared/types/index';
import type { BeeforHttpApi } from '../../../main/preload';

function requireHttp(http?: BeeforHttpApi): BeeforHttpApi {
  if (!http) throw new Error('API HTTP indisponível — reinicie o app.');
  return http;
}

export function createAtividadesClient(http?: BeeforHttpApi) {
  return {
    fetch: async (): Promise<ActionResult<BeeforAtividade[]>> => {
      return requireHttp(http).atividades.minhas();
    },
  };
}

export const atividadesClient = createAtividadesClient(
  typeof window !== 'undefined' ? window.beeforHttp : undefined,
);
export type AtividadesClient = ReturnType<typeof createAtividadesClient>;
