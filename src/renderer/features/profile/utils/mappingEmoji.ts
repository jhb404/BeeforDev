/** Deriva um emoji para o card de personal mapping a partir do título. */
export function mappingEmoji(titulo: string): string {
  const t = titulo.toLowerCase();
  if (/fam[ií]lia|filho|esposa|marido|pais|m[ãa]e|pai/.test(t)) return '👨‍👩‍👧';
  if (/hobby|hobbies|lazer|divers|passatempo/.test(t)) return '🎮';
  if (/curiosidade|fato|sobre mim/.test(t)) return '💡';
  if (/m[uú]sica|banda|cantor|playlist/.test(t)) return '🎵';
  if (/filme|s[ée]rie|cinema|anime/.test(t)) return '🎬';
  if (/livro|leitura|ler/.test(t)) return '📚';
  if (/jogo|game|gamer/.test(t)) return '🎮';
  if (/viagem|viajar|lugar|pa[íi]s/.test(t)) return '✈️';
  if (/comida|cozinh|gastronom|prato/.test(t)) return '🍕';
  if (/esporte|treino|academia|futebol|corrida/.test(t)) return '⚽';
  if (/pet|cachorro|gato|animal/.test(t)) return '🐾';
  if (/objetivo|meta|sonho|futuro/.test(t)) return '🎯';
  if (/trabalho|carreira|profiss/.test(t)) return '💼';
  if (/estudo|faculdade|curso/.test(t)) return '🎓';
  if (/contato|social|rede/.test(t)) return '📱';
  return '🗺️';
}
