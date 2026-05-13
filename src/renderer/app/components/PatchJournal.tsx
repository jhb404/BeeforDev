import { Fragment, type ReactNode } from 'react';

const ROADMAP: string[] = [
'Sistema de notificações reformulado',
'Melhorias gerais de UI/UX',
'Redução de consumo de CPU e RAM',
'Refatoração de código',
'Implementação de cache',
'Melhorias de loading e inicialização',
'Atualizações automáticas do app',
'Retry automático configurável',
'Backup automático de configurações',
'Novas opções de customização',
'Suporte multi-idioma (PT-BR / EN-US / EN-GB)',
'Envio de coins direto pelo app',
'Porte para MacBook em andamento 🍎',

// 🎨 Customização
'Escolha da cor do ícone do Beefor',
'Tema totalmente dinâmico',
'Customização de dark/light mode',
'Layouts Minimalista e Padrão',
'Atalhos de teclado configuráveis',
'Home customizável via drag-and-drop',
'Menu da bandeja editável',
'Sons personalizados para ações',

// 🚀 Performance
'Nova animação de loading',
'Splash screen animada',
'Asas animadas na inicialização 🪽',
'Som especial ao abrir o app 🎮',
'Inicialização mais rápida e inteligente',

// 🫂 Social
'Meme Center™',
'Envio de memes entre amigos',
'Mensagens internas divertidas',
'Urso pidão pedindo coin2u 🐻💸',
'Meu Timão Lindo 💛',

// ⚙️ Melhorias úteis
'Auto lançamento mais rápido',
'Atualização automática do calendário',
'Integração com notificações do Niko',
'Melhorias no Kudocard e histórico',
'Integração com coin2u',
'Correções nas notificações do Kudocard',

// 🔮 Futuro
'App extremamente otimizado',
'Uso mínimo de memória RAM',
'Integração com Lark/Teams/LocalWeb',
'Automação de batida de ponto',
'Histórico salarial',
'Armazenamento de documentos importantes',
'Integração com assessments/cards',
'Exportar/importar configurações em JSON',
'API local para automações externas',
'Backup automático de sessão/config',

// 🎨 White Mode
'Revamp completo do White Mode',
'Melhor contraste e legibilidade',
'Visual mais moderno e premium ✨',
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
