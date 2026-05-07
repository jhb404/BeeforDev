import { Fragment, type ReactNode } from 'react';

const ROADMAP: string[] = [
  'Melhoria de UI/UX',
  'Melhorar desempenho e reduzir consumo de CPU e RAM',
  'Refatorar código para melhor manutenção',
  'Implementar cache para melhorar tempo de resposta',
  'Melhorar Tempo de loadings, etc...',
  'Atualizar o app sem a pessoa se preocupar com isso (Animação de atualização, etc...)',
  'Melhorar tempo do Auto Lançamento',
  'Ajustar sistema de notificação - Puxar do Beefor',
  'Retry automático caso erro',
  'Auto lançamento para preguiçosos de plantão',
  'Backup automático das configs',
  'Melhorias visuais e mais opções de customização',
  'PT-PT / EN-GB / EN-US',
];

const URL_RE = /(https?:\/\/[^\s)]+)/g;
const IMG_EXT = /\.(gif|png|jpe?g|webp|svg)(\?.*)?$/i;

function renderTokens(text: string): ReactNode[] {
  const out: ReactNode[] = [];
  let lastIdx = 0;
  let key = 0;
  for (const match of text.matchAll(URL_RE)) {
    const url = match[0];
    const idx = match.index ?? 0;
    if (idx > lastIdx) out.push(text.slice(lastIdx, idx));
    if (IMG_EXT.test(url)) {
      out.push(
        <img
          key={`img-${key++}`}
          src={url}
          alt=""
          className="patch-journal-img"
          loading="lazy"
        />,
      );
    } else {
      out.push(
        <a key={`a-${key++}`} href={url} target="_blank" rel="noreferrer">
          {url}
        </a>,
      );
    }
    lastIdx = idx + url.length;
  }
  if (lastIdx < text.length) out.push(text.slice(lastIdx));
  return out;
}

function renderJournal(raw: string): ReactNode {
  const lines = raw.split('\n');
  return lines.map((line, i) => (
    <Fragment key={i}>
      {renderTokens(line)}
      {i < lines.length - 1 && <br />}
    </Fragment>
  ));
}

export function PatchJournal({ text }: { text: string }) {
  return (
    <div className="patch-journal-wrap">
      <section className="roadmap">
        <h3 className="roadmap-title">Próximos passos</h3>
        <ol className="roadmap-list">
          {ROADMAP.map((step, i) => (
            <li key={i} className="roadmap-item">
              <span className="roadmap-dot" aria-hidden="true" />
              <span className="roadmap-label">{step}</span>
            </li>
          ))}
        </ol>
      </section>
      <div className="patch-journal-copy">{renderJournal(text)}</div>
    </div>
  );
}
