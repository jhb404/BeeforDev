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

export const kudoClient = {
  send: (req: SendKudoCardRequest): Promise<ActionResult<SendKudoCardResult>> =>
    window.beefor.sendKudoCard(req),
  searchRecipient: (
    type: KudoCardRecipientType,
    query: string,
  ): Promise<ActionResult<KudoSearchResult[]>> =>
    window.beefor.searchKudoRecipient(type, query),
  getCounts: (): Promise<ActionResult<KudoCardCounts>> =>
    window.beefor.getKudoCounts(),
  getLists: (): Promise<ActionResult<KudoCardLists>> =>
    window.beefor.getKudoLists(),
  getDetail: (id: string): Promise<ActionResult<KudoCardDetail>> =>
    window.beefor.getKudoDetail(id),
};
