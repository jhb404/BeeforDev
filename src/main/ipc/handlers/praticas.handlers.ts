import { z } from 'zod';
import { IPC } from '../../../shared/ipc/index';
import { ok, fail } from '../../../shared/result';
import * as svc from '../../services/beeforPraticasService';
import { defineHandler } from '../defineHandler';

const configArgs = z.object({ idTime: z.string().min(1) });

const cardArgs = z.object({
  chave: z.string().min(1),
  idTime: z.string().min(1),
});

/** chave → getter. Espelha o ngSwitch da web. */
const CARD: Record<string, (idTime: string) => Promise<unknown>> = {
  THRGHPUT: svc.getThroughput,
  THRGHPUT3MESES: svc.getThroughput,
  THRGHPUTGRA: svc.getThroughput,
  CCTM: svc.getCycleTime,
  LDTM: svc.getLeadTime,
  PGS_SPT: svc.getBurndown,
  G_CFD: svc.getCfd,
  CPCTY: svc.getCapacity,
  MVMT: svc.getMovimento,
  DLGTN_BRD: svc.getDelegationBox,
  DICA_AC: svc.getRecomendacoes,
  GB: svc.getBacklogBox,
  TX_SCSS_PLNNNG: svc.getTaxaSucesso,
  MLR_CTN: svc.getMelhoriaContinua,
  INDCDR: svc.getIndicador,
  DAILY: svc.getDaily,
  PLNNNG: svc.getPlanning,
  REVIEW: svc.getReview,
  RTSPCTV: svc.getRetrospectiva,
  TM_NC: svc.getTeamMood,
  TRMTR_AGL: svc.getTermometro,
  ASSMNT: svc.getAssessmentRadar,
};

export function registerPraticasHandlers() {
  defineHandler({
    channel: IPC.API_PRATICAS_CONFIG,
    schema: configArgs,
    errorMessage: 'Práticas: config failed',
    run: async ({ data }) => ok(await svc.getPraticasConfig(data.idTime)),
  });

  defineHandler({
    channel: IPC.API_PRATICAS_CARD,
    schema: cardArgs,
    errorMessage: 'Práticas: card failed',
    run: async ({ data }) => {
      const getter = CARD[data.chave];
      if (!getter) return fail(`Chave não mapeada: ${data.chave}`);
      return ok(await getter(data.idTime));
    },
  });

  defineHandler({
    channel: IPC.API_PRATICAS_DAILY_REALIZAR,
    schema: z.object({ idTime: z.string().min(1), dia: z.string().optional() }),
    errorMessage: 'Práticas: realizar daily failed',
    run: async ({ data }) => ok(await svc.realizarDaily(data.idTime, data.dia ?? '')),
  });

  defineHandler({
    channel: IPC.API_PRATICAS_DAILY_CONFIG,
    schema: z.object({
      idTime: z.string().min(1),
      horarioDaily: z.string().optional(),
      onde: z.string().optional(),
      periodicidade: z.number().optional(),
    }),
    errorMessage: 'Práticas: configurar daily failed',
    run: async ({ data }) => ok(await svc.configurarDaily(data)),
  });

  defineHandler({
    channel: IPC.API_PRATICAS_TERMOMETRO,
    schema: z.object({
      idTime: z.string().min(1),
      praticas: z.boolean(),
      assessments: z.boolean(),
    }),
    errorMessage: 'Práticas: termômetro failed',
    run: async ({ data }) =>
      ok(await svc.getTermometro(data.idTime, data.praticas, data.assessments)),
  });
}
