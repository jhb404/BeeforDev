import type {
  ActionResult,
  KudoCardCounts,
  KudoCardDetail,
  KudoCardLists,
  KudoCardRecipientType,
  KudoSearchResult,
  SendKudoCardRequest,
  SendKudoCardResult,
} from '@shared/types';
import type { BeeforApi } from '../../../main/preload';

export function createKudoClient(api: BeeforApi) {
  return {
    send: (req: SendKudoCardRequest): Promise<ActionResult<SendKudoCardResult>> =>
      api.sendKudoCard(req),
    searchRecipient: (
      type: KudoCardRecipientType,
      query: string,
    ): Promise<ActionResult<KudoSearchResult[]>> => api.searchKudoRecipient(type, query),
    getCounts: (): Promise<ActionResult<KudoCardCounts>> => api.getKudoCounts(),
    getLists: (): Promise<ActionResult<KudoCardLists>> => api.getKudoLists(),
    getDetail: (id: string): Promise<ActionResult<KudoCardDetail>> => api.getKudoDetail(id),
  };
}

export const kudoClient = createKudoClient(window.beefor);
export type KudoClient = ReturnType<typeof createKudoClient>;
