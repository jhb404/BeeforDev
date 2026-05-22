/** Descrição curta do que cada motivador significa (mostrada em tooltip). */
export function motivadorDesc(nome: string): string {
  const n = nome.toLowerCase();
  if (n.includes('maestria')) return 'Buscar domínio e excelência numa habilidade ou área.';
  if (n.includes('relaç') || n.includes('relac'))
    return 'Valorizar conexões, amizade e convívio com pessoas.';
  if (n.includes('meta')) return 'Mover-se por objetivos claros e resultados a alcançar.';
  if (n.includes('honra')) return 'Agir por princípios, lealdade e integridade.';
  if (n.includes('liberdade')) return 'Preferir autonomia e independência para decidir.';
  if (n.includes('ordem')) return 'Gostar de estrutura, organização e previsibilidade.';
  if (n.includes('curiosidade')) return 'Sede de aprender, explorar e entender o porquê.';
  if (n.includes('aceita')) return 'Necessidade de pertencer e ser aceito pelo grupo.';
  if (n.includes('poder')) return 'Influenciar, liderar e causar impacto.';
  if (n.includes('status')) return 'Reconhecimento, prestígio e destaque social.';
  return 'Motivador pessoal.';
}
