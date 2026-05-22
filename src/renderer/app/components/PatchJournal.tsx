import { Fragment, type ReactNode } from 'react';

interface RoadmapSection {
  title: string;
  items: string[];
}

const UPCOMING: RoadmapSection[] = [
  {
    title: '🛣️ Em breve',
    items: [
      '📐 RESPONSIVIDADE PRA TELAS MENORES',
      '🧊 Streak freeze — escudo pra não perder streak por esquecimento',
      '📱 Versão mobile (iOS + Android) — code share via Capacitor',
      '🍎 Instalação sem erros no mac...(Precisa de certificado)',
      '🔐 Code signing Windows (sem warning "Unknown publisher")',
      '🗄️ Backend de gamificação — XP/conquistas persistem entre PCs',
      '🏆 Ranking de streak REAL entre coleguinhas',
    ],
  },
  {
    title: '💭 Wishlist',
    items: [
      '🎲 Loot box semanal (Honeycomb da semana)...talvez?',
      '🎄 Eventos sazonais (Natal, Halloween, etc)',
      '🔗 Sincronização cross-device (configs entre PCs)',
      '📆 Integração com Google Calendar / Outlook',
      '🧩 Plugin system pra extensões custom',
      '📈 Telemetria local opt-in (saber padrões pessoais)',
    ],
  },
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
        <img key={`img-${key++}`} src={url} alt="" className="patch-journal-img" loading="lazy" />,
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
  // Split into version cards by `---` separator
  const blocks = raw
    .split(/\n\s*---\s*\n/)
    .map((b) => b.trim())
    .filter(Boolean);

  if (blocks.length === 0) return null;

  return blocks.map((block, idx) => {
    const lines = block.split('\n');
    let title = '';
    let body = lines;
    const first = lines[0]?.trim() ?? '';
    // Match "- vX.Y.Z: rest"
    const versionMatch = first.match(/^-?\s*(v[\d.]+):\s*(.*)$/i);
    if (versionMatch) {
      const [, version, rest] = versionMatch;
      title = rest ? `${version} — ${rest}` : version;
      body = lines.slice(1);
    }
    return (
      <article key={idx} className="patch-card">
        {title && <h3 className="patch-card__version">{title}</h3>}
        <div className="patch-card__body">
          {body.map((line, i) => (
            <Fragment key={i}>
              {renderTokens(line)}
              {i < body.length - 1 && <br />}
            </Fragment>
          ))}
        </div>
      </article>
    );
  });
}

function RoadmapBlock({ section }: { section: RoadmapSection }) {
  return (
    <div className="roadmap-block">
      <h4 className="roadmap-subtitle">{section.title}</h4>
      <ol className="roadmap-list">
        {section.items.map((step, i) => (
          <li key={i} className="roadmap-item">
            <span className="roadmap-dot" aria-hidden="true" />
            <span className="roadmap-label">{step}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

export function PatchJournal({ text }: { text: string }) {
  return (
    <div className="patch-journal-wrap">
      <section className="roadmap">
        <h3 className="roadmap-title">🔮 O que tá vindo</h3>
        {UPCOMING.map((s, i) => (
          <RoadmapBlock key={`u-${i}`} section={s} />
        ))}
      </section>
      <div className="patch-journal-copy">{renderJournal(text)}</div>
    </div>
  );
}
