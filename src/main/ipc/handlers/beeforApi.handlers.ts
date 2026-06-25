import { z } from 'zod';
import { IPC } from '../../../shared/ipc/index';
import { defineHandler } from '../defineHandler';
import { ok } from '../../../shared/result';
import {
  loginHttp,
  getCachedSession,
  clearCachedSession,
  clearCredentials,
  clearActiveOrg,
} from '../../services/beeforHttpClient';
import {
  getCurrentMood,
  addMood,
  editMood,
  getMoodStreakOrganizacao,
} from '../../services/beeforMoodService';
import {
  sendKudoCard,
  getKudoCounts,
  getKudoLists,
  getKudoDetail,
} from '../../services/beeforKudoService';
import {
  listKudoRecipients,
  searchPessoas,
  searchTimes,
  listTimesCombo,
  listOrganizacoes,
  selecionarOrganizacao,
  trocarOrganizacao,
  listTimesComboFavorito,
  listGruposCombo,
  favoritarTime,
  desfavoritarTime,
} from '../../services/beeforPessoaService';
import {
  getMonthPayload,
  postApontamento,
  autoLancarApontamentos,
  getTotaisMes,
} from '../../services/beeforTimesheetService';
import {
  listMinhasAtividades,
  getCardDetail,
  editarCard,
  listarComentarios,
  adicionarComentario,
  pegarCardResumoCompleto,
  listarResponsaveisDoTime,
  pegarProjetos,
  pegarIteracoesBacklog,
  pegarEtiquetas,
  pegarColunas,
  arquivarCard,
  listarLogsCard,
  listarAnexos,
  removerAnexo,
  adicionarAnexo,
} from '../../services/beeforAtividadesService';
import { BrowserWindow } from 'electron';
import { connectHub, disconnectHub, onHubEvent } from '../../services/beeforSignalR';
import {
  listNotificacoesNaoLidas,
  listAllNotificacoes,
  marcarComoLida,
  marcarTodasComoLidas,
  listNovidadesGoobee,
  listNovidadesUsuario,
  totalNovidadesNaoLidas,
  marcarNovidadeLida,
  marcarTodasNovidadesLidas,
} from '../../services/beeforNotificacaoService';
import {
  getPerfil,
  getHabilidades,
  getHabilidadesCombo,
  adicionarHabilidade,
  removerHabilidade,
  getMotivadores,
  adicionarMotivadores,
  editarMotivadores,
  getAcoesColaborador,
  getPersonalMapping,
  adicionarPersonalMapping,
  editarPersonalMapping,
  deletarPersonalMapping,
  getEditarPerfil,
  editarPerfil,
  getGestores,
} from '../../services/beeforPerfilService';
import { getBeeforEnv, setBeeforEnv } from '../../../shared/env';
import { loadSettings, saveSettings } from '../../sessionStore';
import { moodSchema } from '../schemas';
import { getCredentials as getStoredCredentials } from '../../secureStorage';

const loginSchema = z.object({
  usuario: z.string().min(1).max(254),
  senha: z.string().min(1).max(256),
});

const dateRangeSchema = z.object({
  dataInicio: z.string().optional(),
  dataFim: z.string().optional(),
  topN: z.number().int().min(1).max(200).optional(),
});

const monthArgs = z.tuple([z.number().int().min(2000).max(2100), z.number().int().min(1).max(12)]);

const sendKudoSchema = z.object({
  idDestinatario: z.string().min(1).max(64),
  tipoDestinatario: z.union([z.literal(1), z.literal(2)]),
  cardType: z.enum([
    'Forca_Prancheta_1',
    'Mestre_Prancheta_1',
    'Maravilha_Prancheta_1',
    'Incrivel_Prancheta_1',
    'Imbativel_Prancheta_1',
    'Super_Prancheta_1',
    'Time_Prancheta_1',
    'Parabens_Prancheta_1',
  ]),
  mensagem: z.string().min(1).max(1000),
  idTime: z.string().max(64).optional(),
});

const editCardSchema = z.object({
  idCard: z.string().min(1).max(64),
  body: z.object({
    nome: z.string().optional(),
    descricao: z.string().optional(),
    idProjeto: z.string().nullable().optional(),
    idEpico: z.string().nullable().optional(),
    idIteracao: z.string().nullable().optional(),
    nomeIteracao: z.string().nullable().optional(),
    idColuna: z.string().nullable().optional(),
    pontuacao: z.union([z.number(), z.string()]).nullable().optional(),
    bloqueado: z.boolean().optional(),
    motivoBloqueio: z.string().nullable().optional(),
    idsResponsaveisCard: z.array(z.string()).optional(),
    cardEtiquetas: z
      .array(
        z.object({
          idEtiqueta: z.string(),
          nomeEtiqueta: z.string(),
          corEtiqueta: z.string(),
        }),
      )
      .optional(),
    esforco: z.string().nullable().optional(),
    quantidadeVagas: z.union([z.number(), z.string()]).nullable().optional(),
    dataPrevistaEntrega: z.string().nullable().optional(),
    tipo: z.number().int().optional(),
    idCardHistoria: z.string().nullable().optional(),
    dataInicio: z.string().nullable().optional(),
  }),
});

const arquivarCardSchema = z.object({
  idCard: z.string().min(1).max(64),
  arquivado: z.boolean(),
  idQuadro: z.string().max(64).optional(),
});

const anexoAddSchema = z.object({
  idCard: z.string().min(1).max(64),
  idTime: z.string().min(1).max(64),
  fileName: z.string().min(1).max(260),
  fileType: z.string().max(200),
  fileBytes: z.instanceof(ArrayBuffer),
});

const addCommentSchema = z.object({
  idCard: z.string().min(1).max(64),
  texto: z.string().min(1).max(2000),
});

const editMoodSchema = z.object({
  idSentimentoPessoa: z.string().min(1).max(64),
  mood: moodSchema,
});

const envSchema = z.enum(['local', 'prod']);

const stringIdSchema = z.string().min(1).max(64);

export function registerBeeforApiHandlers(): void {
  // ─── Auth ───────────────────────────────────────────────
  defineHandler({
    channel: IPC.API_LOGIN,
    schema: loginSchema,
    errorMessage: 'API login failed',
    run: async ({ data }) => {
      const session = await loginHttp(data.usuario, data.senha);
      return ok({
        idPessoa: session.idPessoa,
        idOrganizacao: session.idOrganizacao,
        nome: session.nome,
        email: session.email,
      });
    },
  });

  defineHandler({
    channel: IPC.API_LOGOUT,
    errorMessage: 'API logout failed',
    run: () => {
      clearCachedSession();
      clearCredentials();
      clearActiveOrg();
      return ok();
    },
  });

  defineHandler({
    channel: IPC.API_SESSION_INFO,
    errorMessage: 'API session info failed',
    run: () => {
      const s = getCachedSession();
      if (!s) return ok(null);
      return ok({
        idPessoa: s.idPessoa,
        idOrganizacao: s.idOrganizacao,
        nome: s.nome,
        email: s.email,
      });
    },
  });

  // ─── Mood ───────────────────────────────────────────────
  defineHandler({
    channel: IPC.API_MOOD_GET,
    errorMessage: 'Mood get failed',
    run: async () => ok(await getCurrentMood()),
  });

  defineHandler({
    channel: IPC.API_MOOD_ADD,
    schema: moodSchema,
    errorMessage: 'Mood add failed',
    run: async ({ data }) => ok(await addMood(data)),
  });

  defineHandler({
    channel: IPC.API_MOOD_EDIT,
    schema: editMoodSchema,
    errorMessage: 'Mood edit failed',
    run: async ({ data }) => ok(await editMood(data.idSentimentoPessoa, data.mood)),
  });

  defineHandler({
    channel: IPC.API_MOOD_STREAK_ORG,
    schema: dateRangeSchema,
    errorMessage: 'Mood streak org failed',
    run: async ({ data }) =>
      ok(await getMoodStreakOrganizacao(data.dataInicio, data.dataFim, data.topN ?? 30)),
  });

  // ─── KudoCard ───────────────────────────────────────────
  defineHandler({
    channel: IPC.API_KUDO_SEND,
    schema: sendKudoSchema,
    errorMessage: 'Kudo send failed',
    run: async ({ data }) => ok(await sendKudoCard(data)),
  });

  defineHandler({
    channel: IPC.API_KUDO_COUNTS,
    errorMessage: 'Kudo counts failed',
    run: async () => ok(await getKudoCounts()),
  });

  defineHandler({
    channel: IPC.API_KUDO_LISTS,
    errorMessage: 'Kudo lists failed',
    run: async () => ok(await getKudoLists()),
  });

  defineHandler({
    channel: IPC.API_KUDO_DETAIL,
    schema: stringIdSchema,
    errorMessage: 'Kudo detail failed',
    run: async ({ data }) => ok(await getKudoDetail(data)),
  });

  defineHandler({
    channel: IPC.API_KUDO_RECIPIENTS,
    errorMessage: 'Kudo recipients failed',
    run: async () => {
      // Aquece pessoas + times juntos (ambos cacheados disco/SWR)
      const [pessoas] = await Promise.all([listKudoRecipients(), listTimesCombo()]);
      return ok(pessoas);
    },
  });

  // ─── Pessoa / Organização ──────────────────────────────
  defineHandler({
    channel: IPC.API_PESSOA_SEARCH,
    schema: z.string().max(120),
    errorMessage: 'Pessoa search failed',
    run: async ({ data }) => ok(await searchPessoas(data ?? '')),
  });

  defineHandler({
    channel: IPC.API_TIME_SEARCH,
    schema: z.string().max(120),
    errorMessage: 'Time search failed',
    run: async ({ data }) => ok(await searchTimes(data ?? '')),
  });

  defineHandler({
    channel: IPC.API_ORG_LIST,
    errorMessage: 'Org list failed',
    run: async () => ok(await listOrganizacoes()),
  });

  defineHandler({
    channel: IPC.API_ORG_SELECT,
    schema: stringIdSchema,
    errorMessage: 'Org select failed',
    run: async ({ data }) => ok(await selecionarOrganizacao(data)),
  });

  defineHandler({
    channel: IPC.API_ORG_SWITCH,
    schema: stringIdSchema,
    errorMessage: 'Org switch failed',
    run: async ({ data }) => ok(await trocarOrganizacao(data)),
  });

  defineHandler({
    channel: IPC.API_TIME_LIST,
    errorMessage: 'Time list failed',
    run: async () => ok(await listTimesComboFavorito()),
  });

  defineHandler({
    channel: IPC.API_TIME_FAVORITE,
    schema: stringIdSchema,
    errorMessage: 'Time favorite failed',
    run: async ({ data }) => ok(await favoritarTime(data)),
  });

  defineHandler({
    channel: IPC.API_TIME_UNFAVORITE,
    errorMessage: 'Time unfavorite failed',
    run: async () => ok(await desfavoritarTime()),
  });

  defineHandler({
    channel: IPC.API_GRUPO_LIST,
    errorMessage: 'Grupo list failed',
    run: async () => ok(await listGruposCombo()),
  });

  // ─── Timesheet (ProjectPro API) ────────────────────────
  defineHandler({
    channel: IPC.API_TS_MONTH,
    schema: monthArgs,
    payload: (args) => args,
    errorMessage: 'Timesheet month failed',
    run: async ({ data }) => ok(await getMonthPayload(data[0], data[1])),
  });

  defineHandler({
    channel: IPC.API_TS_POST,
    errorMessage: 'Timesheet post failed',
    run: async ({ args }) => ok(await postApontamento(args[0] as any)),
  });

  defineHandler({
    channel: IPC.API_TS_AUTO,
    errorMessage: 'Timesheet auto failed',
    run: async () => ok(await autoLancarApontamentos()),
  });

  defineHandler({
    channel: IPC.API_TS_TOTAIS,
    schema: monthArgs,
    payload: (args) => args,
    errorMessage: 'Timesheet totais failed',
    run: async ({ data }) => ok(await getTotaisMes(data[0], data[1])),
  });

  // ─── Atividades (Quadro) ───────────────────────────────
  defineHandler({
    channel: IPC.API_ATIV_MINHAS,
    errorMessage: 'Atividades minhas failed',
    run: async () => ok(await listMinhasAtividades()),
  });

  defineHandler({
    channel: IPC.API_ATIV_DETAIL,
    schema: z.object({
      idCard: stringIdSchema,
      idTime: stringIdSchema,
      idOrganizacao: stringIdSchema.optional(),
    }),
    errorMessage: 'Atividade detail failed',
    run: async ({ data }) => ok(await getCardDetail(data.idCard, data.idTime, data.idOrganizacao)),
  });

  defineHandler({
    channel: IPC.API_ATIV_EDIT,
    schema: editCardSchema,
    errorMessage: 'Atividade edit failed',
    run: async ({ data }) => ok(await editarCard(data.idCard, data.body)),
  });

  defineHandler({
    channel: IPC.API_ATIV_COMMENTS,
    schema: stringIdSchema,
    errorMessage: 'Atividade comments failed',
    run: async ({ data }) => ok(await listarComentarios(data)),
  });

  defineHandler({
    channel: IPC.API_ATIV_ADD_COMMENT,
    schema: addCommentSchema,
    errorMessage: 'Atividade add comment failed',
    run: async ({ data }) => ok(await adicionarComentario(data.idCard, data.texto)),
  });

  defineHandler({
    channel: IPC.API_ATIV_RESUMO,
    schema: stringIdSchema,
    errorMessage: 'Atividade resumo failed',
    run: async ({ data }) => ok(await pegarCardResumoCompleto(data)),
  });

  defineHandler({
    channel: IPC.API_ATIV_RESPONSAVEIS,
    schema: stringIdSchema,
    errorMessage: 'Atividade responsaveis failed',
    run: async ({ data }) => ok(await listarResponsaveisDoTime(data)),
  });

  defineHandler({
    channel: IPC.API_ATIV_PROJETOS,
    schema: z.string().max(64).optional(),
    errorMessage: 'Atividade projetos failed',
    run: async ({ data }) => ok(await pegarProjetos(data)),
  });

  defineHandler({
    channel: IPC.API_ATIV_ITERACOES,
    schema: stringIdSchema,
    errorMessage: 'Atividade iteracoes failed',
    run: async ({ data }) => ok(await pegarIteracoesBacklog(data)),
  });

  defineHandler({
    channel: IPC.API_ATIV_ETIQUETAS,
    schema: stringIdSchema,
    errorMessage: 'Atividade etiquetas failed',
    run: async ({ data }) => ok(await pegarEtiquetas(data)),
  });

  defineHandler({
    channel: IPC.API_ATIV_COLUNAS,
    schema: stringIdSchema,
    errorMessage: 'Atividade colunas failed',
    run: async ({ data }) => ok(await pegarColunas(data)),
  });

  defineHandler({
    channel: IPC.API_ATIV_ARQUIVAR,
    schema: arquivarCardSchema,
    errorMessage: 'Atividade arquivar failed',
    run: async ({ data }) => ok(await arquivarCard(data.idCard, data.arquivado, data.idQuadro)),
  });

  defineHandler({
    channel: IPC.API_ATIV_LOGS,
    schema: stringIdSchema,
    errorMessage: 'Atividade logs failed',
    run: async ({ data }) => ok(await listarLogsCard(data)),
  });

  defineHandler({
    channel: IPC.API_ATIV_ANEXOS,
    schema: stringIdSchema,
    errorMessage: 'Atividade anexos failed',
    run: async ({ data }) => ok(await listarAnexos(data)),
  });

  defineHandler({
    channel: IPC.API_ATIV_ANEXO_DEL,
    schema: stringIdSchema,
    errorMessage: 'Atividade anexo del failed',
    run: async ({ data }) => ok(await removerAnexo(data)),
  });

  defineHandler({
    channel: IPC.API_ATIV_ANEXO_ADD,
    schema: anexoAddSchema,
    errorMessage: 'Atividade anexo add failed',
    run: async ({ data }) => ok(await adicionarAnexo(data)),
  });

  // ─── Env toggle ────────────────────────────────────────
  defineHandler({
    channel: IPC.API_ENV_GET,
    errorMessage: 'Env get failed',
    run: () => ok(getBeeforEnv()),
  });

  defineHandler({
    channel: IPC.API_ENV_SET,
    schema: envSchema,
    errorMessage: 'Env set failed',
    run: async ({ data }) => {
      setBeeforEnv(data);
      clearCachedSession();
      // env diferente = backend diferente = dados diferentes; limpa caches disco
      const { invalidateRecipientCache } = await import('../../services/beeforPessoaService');
      await invalidateRecipientCache().catch(() => null);
      const settings = await loadSettings();
      settings.beeforEnv = data;
      await saveSettings(settings);

      const creds = await getStoredCredentials();
      if (creds) {
        try {
          await loginHttp(creds.email, creds.password);
        } catch {
          // silencioso — usuário pode logar manualmente
        }
      }
      return ok({ env: data });
    },
  });

  // ─── Notificações ──────────────────────────────────────
  defineHandler({
    channel: IPC.API_NOTIF_UNREAD,
    errorMessage: 'Notif unread failed',
    run: async () => ok(await listNotificacoesNaoLidas()),
  });

  defineHandler({
    channel: IPC.API_NOTIF_ALL,
    errorMessage: 'Notif all failed',
    run: async () => ok(await listAllNotificacoes()),
  });

  defineHandler({
    channel: IPC.API_NOTIF_READ,
    schema: stringIdSchema,
    errorMessage: 'Notif read failed',
    run: async ({ data }) => ok(await marcarComoLida(data)),
  });

  defineHandler({
    channel: IPC.API_NOTIF_READ_ALL,
    errorMessage: 'Notif read all failed',
    run: async () => ok(await marcarTodasComoLidas()),
  });

  defineHandler({
    channel: IPC.API_NOTIF_NOVIDADES,
    errorMessage: 'Notif novidades failed',
    run: async () => ok(await listNovidadesGoobee()),
  });

  defineHandler({
    channel: IPC.API_NOTIF_NOVIDADES_USER,
    errorMessage: 'Notif novidades user failed',
    run: async () => ok(await listNovidadesUsuario()),
  });

  defineHandler({
    channel: IPC.API_NOTIF_NOVIDADES_TOTAL,
    errorMessage: 'Notif novidades total failed',
    run: async () => ok(await totalNovidadesNaoLidas()),
  });

  defineHandler({
    channel: IPC.API_NOTIF_NOVIDADE_READ,
    schema: stringIdSchema,
    errorMessage: 'Notif novidade read failed',
    run: async ({ data }) => ok(await marcarNovidadeLida(data)),
  });

  defineHandler({
    channel: IPC.API_NOTIF_NOVIDADES_READ_ALL,
    errorMessage: 'Notif novidades read all failed',
    run: async () => ok(await marcarTodasNovidadesLidas()),
  });

  // ─── Perfil ─────────────────────────────────────────────
  const optionalId = z.string().max(64).optional();

  defineHandler({
    channel: IPC.API_PERFIL_GET,
    schema: optionalId,
    errorMessage: 'Perfil get failed',
    run: async ({ data }) => ok(await getPerfil(data || undefined)),
  });

  defineHandler({
    channel: IPC.API_PERFIL_HABILIDADES,
    schema: optionalId,
    errorMessage: 'Perfil habilidades failed',
    run: async ({ data }) => ok(await getHabilidades(data || undefined)),
  });

  defineHandler({
    channel: IPC.API_PERFIL_HABILIDADES_COMBO,
    schema: optionalId,
    errorMessage: 'Perfil habilidades combo failed',
    run: async ({ data }) => ok(await getHabilidadesCombo(data || undefined)),
  });

  defineHandler({
    channel: IPC.API_PERFIL_ADD_HABILIDADE,
    schema: z.string().min(1).max(120),
    errorMessage: 'Perfil add habilidade failed',
    run: async ({ data }) => ok(await adicionarHabilidade(data)),
  });

  defineHandler({
    channel: IPC.API_PERFIL_MOTIVADORES,
    schema: optionalId,
    errorMessage: 'Perfil motivadores failed',
    run: async ({ data }) => ok(await getMotivadores(data || undefined)),
  });

  defineHandler({
    channel: IPC.API_PERFIL_ACOES,
    schema: optionalId,
    errorMessage: 'Perfil acoes failed',
    run: async ({ data }) => ok(await getAcoesColaborador(data || undefined)),
  });

  defineHandler({
    channel: IPC.API_PERFIL_MAPPING,
    schema: optionalId,
    errorMessage: 'Perfil mapping failed',
    run: async ({ data }) => ok(await getPersonalMapping(data || undefined)),
  });

  defineHandler({
    channel: IPC.API_PERFIL_REMOVE_HABILIDADE,
    schema: z.string().min(1).max(64),
    errorMessage: 'Perfil remove habilidade failed',
    run: async ({ data }) => ok(await removerHabilidade(data)),
  });

  defineHandler({
    channel: IPC.API_PERFIL_MOTIVADORES_ADD,
    errorMessage: 'Perfil motivadores add failed',
    run: async () => ok(await adicionarMotivadores()),
  });

  defineHandler({
    channel: IPC.API_PERFIL_MOTIVADORES_EDIT,
    schema: z.array(z.object({ idMotivador: z.string() })),
    errorMessage: 'Perfil motivadores edit failed',
    run: async ({ data }) => ok(await editarMotivadores(data)),
  });

  defineHandler({
    channel: IPC.API_PERFIL_MAPPING_ADD,
    schema: z.object({ titulo: z.string().min(1).max(120), itens: z.array(z.string()) }),
    errorMessage: 'Perfil mapping add failed',
    run: async ({ data }) => ok(await adicionarPersonalMapping(data.titulo, data.itens)),
  });

  defineHandler({
    channel: IPC.API_PERFIL_MAPPING_EDIT,
    schema: z.object({
      idTitulo: z.string(),
      titulo: z.string().min(1).max(120),
      itens: z.array(z.object({ IdItem: z.string().optional(), NomeItem: z.string() })),
    }),
    errorMessage: 'Perfil mapping edit failed',
    run: async ({ data }) =>
      ok(await editarPersonalMapping(data.idTitulo, data.titulo, data.itens)),
  });

  defineHandler({
    channel: IPC.API_PERFIL_MAPPING_DEL,
    schema: z.string().min(1).max(64),
    errorMessage: 'Perfil mapping del failed',
    run: async ({ data }) => ok(await deletarPersonalMapping(data)),
  });

  defineHandler({
    channel: IPC.API_PERFIL_EDIT_GET,
    schema: optionalId,
    errorMessage: 'Perfil edit get failed',
    run: async ({ data }) => ok(await getEditarPerfil(data || undefined)),
  });

  const editPerfilSchema = z.object({
    nome: z.string().max(200).optional(),
    email: z.string().max(254).optional(),
    miniBio: z.string().max(1000).optional(),
    funcaoPrincipal: z.string().max(200).optional(),
    telefone: z.string().max(20).optional(),
    idGestor: z.string().max(64).nullable().optional(),
    idioma: z.number().int().min(1).max(3).optional(),
    // data URI base64 ou URL — limite alto p/ acomodar imagem inline.
    foto: z.string().max(10_000_000).optional(),
  });

  defineHandler({
    channel: IPC.API_PERFIL_EDIT_SAVE,
    schema: editPerfilSchema,
    errorMessage: 'Perfil edit save failed',
    run: async ({ data }) => ok(await editarPerfil(data)),
  });

  defineHandler({
    channel: IPC.API_PERFIL_GESTORES,
    errorMessage: 'Perfil gestores failed',
    run: async () => ok(await getGestores()),
  });

  // ─── SignalR Hub ───────────────────────────────────────
  const hubEventTypes = [
    'mood:changed',
    'kudo:received',
    'kudo:sent',
    'card:moved',
    'card:created',
    'notif:new',
  ] as const;
  let hubUnsubs: Array<() => void> = [];

  function broadcastHub(type: string, payload: unknown) {
    for (const w of BrowserWindow.getAllWindows()) {
      try {
        w.webContents.send(IPC.EVT_HUB, { type, payload });
      } catch {
        // window closed
      }
    }
  }

  defineHandler({
    channel: IPC.API_HUB_CONNECT,
    errorMessage: 'Hub connect failed',
    run: async () => {
      const success = await connectHub();
      if (success && hubUnsubs.length === 0) {
        for (const t of hubEventTypes) {
          hubUnsubs.push(onHubEvent(t, (payload) => broadcastHub(t, payload)));
        }
      }
      return ok({ connected: success });
    },
  });

  defineHandler({
    channel: IPC.API_HUB_DISCONNECT,
    errorMessage: 'Hub disconnect failed',
    run: async () => {
      for (const off of hubUnsubs) off();
      hubUnsubs = [];
      await disconnectHub();
      return ok();
    },
  });
}
