/** Mapeia o nome de um motivador para um emoji representativo. */
export function motivadorEmoji(nome: string): string {
  const n = nome.toLowerCase();
  if (n.includes('maestria')) return '♟️';
  if (n.includes('relaç') || n.includes('relac')) return '💬';
  if (n.includes('meta')) return '⛰️';
  if (n.includes('honra')) return '🎖️';
  if (n.includes('liberdade')) return '🕊️';
  if (n.includes('ordem')) return '🧱';
  if (n.includes('curiosidade')) return '🔍';
  if (n.includes('aceita')) return '🧑‍🤝‍🧑';
  if (n.includes('poder')) return '👑';
  if (n.includes('status')) return '🏆';
  return '✨';
}
