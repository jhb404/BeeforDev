import type {
  ActionResult,
  KudoCardCounts,
  KudoCardDetail,
  KudoCardLists,
  KudoCardRecipientType,
  KudoSearchResult,
  SendKudoCardRequest,
  SendKudoCardResult,
} from '@shared/types/index';
import type { BeeforHttpApi } from '../../../main/preload';

function requireHttp(http?: BeeforHttpApi): BeeforHttpApi {
  if (!http) throw new Error('API HTTP indisponível — reinicie o app.');
  return http;
}

export function createKudoClient(http?: BeeforHttpApi) {
  return {
    send: async (req: SendKudoCardRequest): Promise<ActionResult<SendKudoCardResult>> => {
      const h = requireHttp(http);
      // Resolve destinatário (nome → id). Pessoa → pessoa.search; Time → searchTimes.
      const isTeam = req.recipientType === 'team';
      const searchRes = isTeam
        ? await h.pessoa.searchTimes(req.recipientName)
        : await h.pessoa.search(req.recipientName);
      if (!searchRes.ok || !Array.isArray(searchRes.data)) {
        return { ok: false as const, error: 'Falha ao buscar destinatário.' };
      }
      const target = req.recipientName.toLowerCase().trim();
      const list = searchRes.data as Array<{ id: string; nome: string }>;
      const match = list.find((p) => p.nome?.toLowerCase().trim() === target) ?? list[0];
      if (!match?.id) {
        return {
          ok: false as const,
          error: `${isTeam ? 'Time' : 'Pessoa'} "${req.recipientName}" não encontrado.`,
        };
      }
      const sendRes = await h.kudo.send({
        idDestinatario: match.id,
        tipoDestinatario: isTeam ? 2 : 1,
        // Time → idTime no payload; Pessoa → idTime fica default
        idTime: isTeam ? match.id : undefined,
        cardType: req.cardType,
        mensagem: req.message,
      });
      if (!sendRes.ok) return sendRes as ActionResult<SendKudoCardResult>;
      return {
        ok: true as const,
        data: { success: true, message: 'KudoCard enviado.' },
      } as ActionResult<SendKudoCardResult>;
    },
    searchRecipient: async (
      type: KudoCardRecipientType,
      query: string,
    ): Promise<ActionResult<KudoSearchResult[]>> => {
      const h = requireHttp(http);
      // person → PegarPessoasUsuarioNaoInclusivo | team → PegarTimesComboBox (ambos cache disco)
      const res = type === 'team' ? await h.pessoa.searchTimes(query) : await h.pessoa.search(query);
      if (!res.ok || !Array.isArray(res.data)) {
        return res as ActionResult<KudoSearchResult[]>;
      }
      const mapped = (res.data as Array<{ id: string; nome: string; email?: string }>).map(
        (it) => ({ id: it.id, name: it.nome, subtitle: it.email }),
      );
      return { ok: true as const, data: mapped } as ActionResult<KudoSearchResult[]>;
    },
    getCounts: async (): Promise<ActionResult<KudoCardCounts>> => {
      return requireHttp(http).kudo.counts();
    },
    getLists: async (): Promise<ActionResult<KudoCardLists>> => {
      return requireHttp(http).kudo.lists();
    },
    getDetail: async (id: string): Promise<ActionResult<KudoCardDetail>> => {
      return requireHttp(http).kudo.detail(id);
    },
  };
}

export const kudoClient = createKudoClient(
  typeof window !== 'undefined' ? window.beeforHttp : undefined,
);
export type KudoClient = ReturnType<typeof createKudoClient>;
