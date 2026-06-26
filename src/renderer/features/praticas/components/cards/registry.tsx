import type { ComponentType } from 'react';
import { PraticaChave } from '@shared/types/index';
import { ThroughputCard } from './ThroughputCard';
import { CycleTimeCard } from './CycleTimeCard';
import { BurndownCard } from './BurndownCard';
import { CfdCard } from './CfdCard';
import { BoxCard } from './BoxCard';
import { TaxaSucessoCard } from './TaxaSucessoCard';
import { MelhoriaContinuaCard } from './MelhoriaContinuaCard';
import { RecomendacoesCard } from './RecomendacoesCard';
import { CerimoniaCard } from './CerimoniaCard';
import { DailyCard } from './DailyCard';
import { DelegationCard } from './DelegationCard';
import { RetrospectivaCard } from './RetrospectivaCard';
import { TermometroCard } from './TermometroCard';
import { AssessmentCard } from './AssessmentCard';

export interface CardProps {
  chave: string;
  idTime: string;
  nome: string;
}

/**
 * chave canônica → componente do card. Espelha o ngSwitch da web.
 * Capacity / Niko (TeamMood) / Indicador NÃO estão aqui — viram chips no topo.
 */
export const CARD_REGISTRY: Record<string, ComponentType<CardProps>> = {
  [PraticaChave.Throughput]: ThroughputCard,
  [PraticaChave.Throughput3Meses]: ThroughputCard,
  [PraticaChave.ThroughputGrafico]: ThroughputCard,
  [PraticaChave.CycleTime]: CycleTimeCard,
  [PraticaChave.LeadTime]: CycleTimeCard,
  [PraticaChave.ProgressoSprint]: BurndownCard,
  [PraticaChave.GraficoCFD]: CfdCard,
  [PraticaChave.DelegationBoard]: DelegationCard,
  [PraticaChave.GestaoDeBacklog]: BoxCard,
  [PraticaChave.DicasAgileCoach]: RecomendacoesCard,
  [PraticaChave.TaxaSucessoPlanning]: TaxaSucessoCard,
  [PraticaChave.MelhoriaContinua]: MelhoriaContinuaCard,
  [PraticaChave.Daily]: DailyCard,
  [PraticaChave.Planning]: CerimoniaCard,
  [PraticaChave.Review]: CerimoniaCard,
  [PraticaChave.Retrospectiva]: RetrospectivaCard,
  [PraticaChave.TermometroAgil]: TermometroCard,
  [PraticaChave.Assessment]: AssessmentCard,
};

/** Chaves que viram chip compacto no topo (não card grande). */
export const CHIP_CHAVES = new Set<string>([
  PraticaChave.Capacity,
  PraticaChave.TeamMood,
  PraticaChave.Indicador,
]);

/** Chaves fixas que sempre aparecem (mesmo fora da config). */
export const FIXOS: Array<{ chave: string; nome: string }> = [
  { chave: PraticaChave.TermometroAgil, nome: 'Termômetro de Práticas' },
  { chave: PraticaChave.Assessment, nome: 'Assessment' },
];
