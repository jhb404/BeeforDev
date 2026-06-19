/**
 * Versão dos assets de poker (cães/mesa/cartas). Bumpe este número
 * sempre que trocar os PNG em public/poker — força o app a rebaixar
 * a imagem nova (cache-busting), sem precisar limpar cache na mão.
 */
export const ART_VERSION = 2;

/** Caminho de um asset de poker com cache-busting. Ex: pokerAsset('dog-8.png'). */
export function pokerAsset(file: string): string {
  return `./poker/${file}?v=${ART_VERSION}`;
}

/** Cartas de voto disponíveis. */
export const CARDS = ['0', '1', '2', '3', '5', '8', '13', '21', '?', '☕'];

/** Classe de dificuldade por carta — verde (fácil) → vermelho (difícil). */
export function cardTier(card: string | null): string {
  switch (card) {
    case '0':
    case '1':
    case '2':
      return 'tier-1';
    case '3':
    case '5':
      return 'tier-2';
    case '8':
    case '13':
      return 'tier-3';
    case '21':
      return 'tier-4';
    default:
      return 'tier-neutral'; // ? e ☕ e null
  }
}
