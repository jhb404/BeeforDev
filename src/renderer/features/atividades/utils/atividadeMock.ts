import type { BeeforAtividade } from '@shared/types/index';

// TODO: substituir por endpoint real quando Beefor expor os detalhes da atividade.
export function mockInfoFor(a: BeeforAtividade) {
  return {
    responsavel: 'Joao Henrique Batista',
    projeto: a.projeto !== 'Sem projeto' ? a.projeto : null,
    epico: null as string | null,
    historia: null as string | null,
    sprint: null as string | null,
    esforcoHoras: null as number | null,
    pontosEstimados: null as number | null,
    dataInicio: null as string | null,
    dataEntrega: null as string | null,
    dataPrevistaEntrega: null as string | null,
    descricao: null as string | null,
    bloqueado: false,
    motivoBloqueio: null as string | null,
    etiquetas: [] as string[],
    comentarios: [] as { autor: string; texto: string; data: string }[],
    anexos: [] as { nome: string; url: string; tipo: string }[],
    historico: [] as { acao: string; data: string; usuario: string }[],
  };
}
