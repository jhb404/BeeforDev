import type { BrowserWindow } from 'electron';
import { IPC } from '../../../shared/ipc/index';
import { ok } from '../../../shared/result';
import {
  getKudoCounts,
  getKudoDetail,
  getKudoLists,
} from '../../services/beeforKudoService';
import { searchPessoas } from '../../services/beeforPessoaService';
import { kudoDetailIdSchema, kudoSearchArgsSchema } from '../schemas';
import { defineHandler } from '../defineHandler';

export function registerKudoHandlers(_getWindow: () => BrowserWindow | null) {
  defineHandler({
    channel: IPC.ACTION_KUDO_COUNTS,
    errorMessage: 'Kudo counts failed',
    run: async () => ok(await getKudoCounts()),
  });

  defineHandler({
    channel: IPC.ACTION_KUDO_LISTS,
    errorMessage: 'Kudo lists failed',
    run: async () => ok(await getKudoLists()),
  });

  defineHandler({
    channel: IPC.ACTION_KUDO_DETAIL,
    schema: kudoDetailIdSchema,
    errorMessage: 'Kudo detail failed',
    run: async ({ data }) => ok(await getKudoDetail(data)),
  });

  defineHandler({
    channel: IPC.ACTION_SEARCH_KUDO_RECIPIENT,
    schema: kudoSearchArgsSchema,
    payload: (args) => args,
    errorMessage: 'Search kudo recipient failed',
    run: async ({ data }) => {
      const [type, query] = data;
      if (type !== 'person') return ok([]);
      const pessoas = await searchPessoas(query);
      const mapped = pessoas.map((p) => ({ id: p.id, name: p.nome, subtitle: p.email }));
      return ok(mapped);
    },
  });

  // ACTION_SEND_KUDO_CARD legado: renderer agora usa window.beeforHttp.kudo.send.
  // Mantém handler como no-op-redirect para não quebrar callers antigos.
  defineHandler({
    channel: IPC.ACTION_SEND_KUDO_CARD,
    errorMessage: 'Send KudoCard failed',
    run: async () =>
      ok({
        success: false,
        message: 'Use window.beeforHttp.kudo.send (HTTP).',
      }),
  });
}
