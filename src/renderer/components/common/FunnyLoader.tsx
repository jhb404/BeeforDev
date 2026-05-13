import { useEffect, useState } from 'react';

interface Item {
  emoji: string;
  text: string;
}

const DEFAULT_ITEMS: Item[] = [
  { emoji: '💧', text: 'Já bebeu água hoje!?' },
  { emoji: '☕', text: 'Vai preparar um café...' },
  { emoji: '💻', text: 'O JB tá trabalhando, calma...' },
  { emoji: '🧘', text: 'Respira fundo, já tá quase...' },
  { emoji: '🍪', text: 'Hora do snack? Bora.' },
  { emoji: '🐝', text: 'Beefor tá pensando...' },
  { emoji: '🧃', text: 'Pausa técnica para hidratar o cérebro.' },
  { emoji: '🦆', text: 'Pato de borracha revisando os horários...' },
  { emoji: '🧯', text: 'Apagando incêndio imaginário do Angular...' },
  { emoji: '🥷', text: 'Digitando como ninja para o Beefor aceitar.' },
  { emoji: '🕰️', text: 'Convencendo o relógio a colaborar...' },
  { emoji: '🌮', text: 'Se demorar mais, vira horário de lanche.' },
  { emoji: '🛠️', text: 'Ajustando parafuso que ninguém vê.' },
  { emoji: '📡', text: 'Sintonizando com os servidores da colmeia...' },
];

interface Props {
  items?: Item[];
  /** Rotate every N ms. Default 5200. */
  intervalMs?: number;
  title?: string;
}

export function FunnyLoader({ items = DEFAULT_ITEMS, intervalMs = 5200, title }: Props) {
  const [idx, setIdx] = useState(() => Math.floor(Math.random() * items.length));

  useEffect(() => {
    const id = setInterval(
      () => setIdx((i) => (i + 1) % items.length),
      intervalMs,
    );
    return () => clearInterval(id);
  }, [items.length, intervalMs]);

  const item = items[idx];

  return (
    <div className="funny-loader">
      <div className="funny-loader__spinner" />
      {title && <div className="funny-loader__title">{title}</div>}
      <div className="funny-loader__row" key={idx}>
        <span className="funny-loader__emoji">{item.emoji}</span>
        <span className="funny-loader__text">{item.text}</span>
      </div>
    </div>
  );
}
