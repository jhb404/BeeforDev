import { Fragment, type ReactNode } from 'react';

interface RoadmapSection {
  title: string;
  items: string[];
}

const RELEASED: RoadmapSection[] = [
  {
    title: '✨ Novidades recentes',
    items: [
      '🚀 Melhorias de perrformance',
      '💰 Cards de "Valor extras" e "Total estimado" opcionais (Settings → Jornada)',
      '📐 Layout responsivo dos cards de resumo',
      '🌗 Hover do mood btn corrigido no light mode',
    ],
  },
  {
    title: '🏗️ Bastidores (arquitetura)',
    items: [
      'Refactor pra feature-sliced (coin2u, kudo, team isolados)',
      'Dependency Injection nos IPC clients (testável + mobile-ready)',
      'Typed Result com discriminated union — menos bugs de tipo',
      '55+ testes automatizados (hooks puros + utils)',
      'ErrorBoundary por aba — crash em uma área não derruba app',
      'ESLint + Prettier + Husky — código sempre consistente',
      'i18n setup (pt-BR + en) — preparado pra internacional',
    ],
  },
];

const UPCOMING: RoadmapSection[] = [
  {
    title: '🔮 Próxima release',
    items: [
      '🔔 Notificações',
      '📊 Dashboard mensal com gráficos',
      '📅 Agendamento de auto-lançamento em horário fixo',
      '🐛 Logger unificado (menos console.log perdido)',
      'Tem mais coisas mas to planejando ainda...',
    ],
  },
  {
    title: '🛣️ Em breve',
    items: [
      '🌐 Migrar Beefor 100% pra API REST (sem Playwright = mais rápido)',
      '📱 Versão mobile (iOS + Android) — code share via Capacitor',
      '🍎 Suporte completo macOS (build + signing + notarization)',
      '🔐 Code signing Windows (sem warning "Unknown publisher")',
      'Tem mais coisas mas to planejando ainda...',
    ],
  },
  {
    title: '💭 Wishlist',
    items: [
      '🔗 Sincronização cross-device (configs entre PCs)',
      '📆 Integração com Google Calendar / Outlook',
      '🧩 Plugin system pra extensões custom',
      '📈 Telemetria local opt-in (saber padrões pessoais)',
      'Tem mais coisas mas to planejando ainda...',
    ],
  },
];

const HISTORY: RoadmapSection[] = [
  {
    title: '📦 v0.1.2 — Discord installer',
    items: ['One-click installer', 'Auto-update agressivo', 'CI/CD release automatizado no merge'],
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
        <h3 className="roadmap-title">🆕 v0.1.x — Em produção</h3>
        {RELEASED.map((s, i) => (
          <RoadmapBlock key={`r-${i}`} section={s} />
        ))}

        <h3 className="roadmap-title">🔮 O que tá vindo</h3>
        {UPCOMING.map((s, i) => (
          <RoadmapBlock key={`u-${i}`} section={s} />
        ))}

        <h3 className="roadmap-title">📜 Histórico</h3>
        {HISTORY.map((s, i) => (
          <RoadmapBlock key={`h-${i}`} section={s} />
        ))}
      </section>
      <div className="patch-journal-copy">{renderJournal(text)}</div>
    </div>
  );
}
