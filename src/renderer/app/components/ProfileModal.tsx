import { useState } from 'react';
import { ModalShell } from '../../components/ui/ModalShell';
import { BeeforLogo } from '../../components/common/BeeforLogo';
import {
  ACHIEVEMENTS,
  ICON_VARIANTS,
  UnlockCodeModal,
  XP_REWARDS,
  useGamification,
  type IconVariant,
  type XpAction,
} from '../../features/gamification';
import { usePerfilData, type MotivadorItem } from '../../features/profile/hooks/usePerfilData';
import { FunnyLoader } from '../../components/common/FunnyLoader';

interface Props {
  open: boolean;
  onClose: () => void;
  userName?: string;
  userEmail?: string;
}

type View = 'home' | 'xp-info' | 'icons' | 'conquistas';

export function ProfileModal({ open, onClose, userName, userEmail }: Props) {
  const { stats, isAchievementUnlocked, isIconUnlocked } = useGamification();
  const [view, setView] = useState<View>('home');
  const data = usePerfilData(open);

  const xpPct = Math.min(100, Math.round((stats.xp / stats.xpNext) * 100));
  const activeIconId =
    stats.unlockedIconVariantIds[stats.unlockedIconVariantIds.length - 1] ?? 'orange';
  const activeIcon = ICON_VARIANTS.find((v) => v.id === activeIconId);

  const handleClose = () => {
    setView('home');
    onClose();
  };

  return (
    <ModalShell
      open={open}
      onClose={handleClose}
      className="profile-modal profile-modal--large"
      labelledBy="profile-modal-title"
    >
      <div className="modal-head">
        <div>
          <p className="eyebrow">Perfil</p>
          <h2 id="profile-modal-title">
            {view === 'home' && (data.perfil?.nome || userName || 'Meu perfil')}
            {view === 'xp-info' && 'Como funciona o XP'}
            {view === 'icons' && 'Variantes de ícone'}
            {view === 'conquistas' && '🏆 Conquistas'}
          </h2>
        </div>
        <div className="profile-modal__head-actions">
          {view !== 'home' && (
            <button
              type="button"
              className="secondary compact"
              onClick={() => setView('home')}
              data-sound="click"
            >
              ← Voltar
            </button>
          )}
          <button
            type="button"
            className="secondary compact"
            onClick={handleClose}
            data-sound="close"
          >
            Fechar
          </button>
        </div>
      </div>

      <div className="profile-modal__body">
        {view === 'home' && (
          <ProfileHome
            userName={userName}
            userEmail={userEmail}
            xpPct={xpPct}
            stats={stats}
            activeIcon={activeIcon ?? ICON_VARIANTS[0]}
            data={data}
            onOpenXpInfo={() => setView('xp-info')}
            onOpenIcons={() => setView('icons')}
            onOpenConquistas={() => setView('conquistas')}
          />
        )}
        {view === 'xp-info' && <XpInfoView />}
        {view === 'icons' && (
          <IconsView isIconUnlocked={isIconUnlocked} activeIconId={activeIconId} />
        )}
        {view === 'conquistas' && (
          <ConquistasView isAchievementUnlocked={isAchievementUnlocked} />
        )}
      </div>
    </ModalShell>
  );
}

function motivadorEmoji(nome: string): string {
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

interface ProfileHomeProps {
  userName?: string;
  userEmail?: string;
  xpPct: number;
  stats: ReturnType<typeof useGamification>['stats'];
  activeIcon: IconVariant;
  data: ReturnType<typeof usePerfilData>;
  onOpenXpInfo: () => void;
  onOpenIcons: () => void;
  onOpenConquistas: () => void;
}

function ProfileHome({
  userName,
  userEmail,
  xpPct,
  stats,
  activeIcon,
  data,
  onOpenXpInfo,
  onOpenIcons,
  onOpenConquistas,
}: ProfileHomeProps) {
  const {
    perfil,
    habilidades,
    habilidadesCombo,
    motivadores,
    acoes,
    mapping,
    loading,
    error,
    addHabilidade,
    removeHabilidade,
    reorderMotivadores,
    addMapping,
    delMapping,
  } = data;

  const nome = perfil?.nome || userName || 'Beta Tester';
  const foto = perfil?.foto;

  return (
    <>
      {/* Banner identidade — estilo Steam */}
      <div className="pfx-banner">
        <button
          type="button"
          className={`pfx-avatar ${activeIcon.effectClass ?? ''}`}
          onClick={onOpenIcons}
          title="Trocar moldura/ícone"
          aria-label="Trocar variante de ícone"
        >
          {foto ? (
            <img className="pfx-avatar__img" src={foto} alt={nome} />
          ) : (
            <BeeforLogo size={56} style={{ color: activeIcon.color }} />
          )}
          <span className="pfx-avatar__lv">Lv {stats.level}</span>
        </button>
        <div className="pfx-banner__id">
          <strong className="pfx-banner__name">{nome}</strong>
          {perfil?.funcaoPrincipal && (
            <span className="pfx-banner__role">{perfil.funcaoPrincipal}</span>
          )}
          <span className="pfx-banner__email">{userEmail ?? '—'}</span>
          <div className="pfx-xp">
            <div className="pfx-xp__bar">
              <div className="pfx-xp__fill" style={{ width: `${xpPct}%` }} />
            </div>
            <span className="pfx-xp__txt">
              {stats.xp}/{stats.xpNext} XP
              <button
                type="button"
                className="pfx-xp__help"
                onClick={onOpenXpInfo}
                aria-label="Como funciona o XP"
                title="Como funciona o XP"
              >
                ?
              </button>
            </span>
          </div>
        </div>
        <button
          type="button"
          className="pfx-trophy"
          onClick={onOpenConquistas}
          title="Conquistas"
          aria-label="Ver conquistas"
          data-sound="click"
        >
          🏆
          <span className="pfx-trophy__count">
            {ACHIEVEMENTS.filter((a) => data.loading === false).length ? '' : ''}
          </span>
        </button>
      </div>

      {loading && <FunnyLoader title="Carregando perfil" />}
      {error && !loading && <p className="pfx-hint">⚠️ {error}</p>}

      {!loading && (
        <div className="pfx-grid">
          {/* Mini bio */}
          <PfxCard title="📝 Mini bio" wide>
            <p className="pfx-bio">
              {perfil?.miniBio?.trim() || 'Sem bio ainda. Conte um pouco sobre você!'}
            </p>
          </PfxCard>

          {/* Checkpoints — só quantidade */}
          <PfxCard title="📍 Checkpoints">
            <div className="pfx-bignum">{perfil?.quantidadeVisitas ?? 0}</div>
            <span className="pfx-card__sub">checkpoints realizados</span>
          </PfxCard>

          {/* Habilidades */}
          <PfxCard title="🛠️ Habilidades" wide>
            <HabilidadesBlock
              habilidades={habilidades}
              combo={habilidadesCombo}
              onAdd={addHabilidade}
              onRemove={removeHabilidade}
            />
          </PfxCard>

          {/* Motivadores ranqueáveis */}
          <PfxCard title="⚡ Motivadores" wide>
            <MotivadoresBlock
              motivadores={motivadores}
              onReorder={reorderMotivadores}
            />
          </PfxCard>

          {/* Ações de desenvolvimento */}
          <PfxCard title="🚀 Ações de desenvolvimento" wide>
            {acoes.length === 0 ? (
              <span className="pfx-empty">Nenhuma ação registrada.</span>
            ) : (
              <ul className="pfx-acoes">
                {acoes.map((a) => (
                  <li key={a.id || a.titulo} className="pfx-acao">
                    <span className="pfx-acao__dot" />
                    <div>
                      <strong>{a.titulo}</strong>
                      {a.descricao && <p>{a.descricao}</p>}
                      {a.status && <span className="pfx-acao__status">{a.status}</span>}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </PfxCard>

          {/* Personal mapping CRUD */}
          <PfxCard title="🗺️ Personal mapping" wide>
            <MappingBlock mapping={mapping} onAdd={addMapping} onDel={delMapping} />
          </PfxCard>
        </div>
      )}
    </>
  );
}

function PfxCard({
  title,
  children,
  wide,
}: {
  title: string;
  children: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <section className={`pfx-card ${wide ? 'pfx-card--wide' : ''}`}>
      <h3 className="pfx-card__title">{title}</h3>
      <div className="pfx-card__body">{children}</div>
    </section>
  );
}

function HabilidadesBlock({
  habilidades,
  combo,
  onAdd,
  onRemove,
}: {
  habilidades: ReturnType<typeof usePerfilData>['habilidades'];
  combo: ReturnType<typeof usePerfilData>['habilidadesCombo'];
  onAdd: (nome: string) => Promise<boolean>;
  onRemove: (id: string) => Promise<boolean>;
}) {
  const [novaHab, setNovaHab] = useState('');
  const [busy, setBusy] = useState(false);

  const sugestoes = combo
    .filter((c) => !habilidades.some((h) => h.nome.toLowerCase() === c.nome.toLowerCase()))
    .filter((c) => !novaHab || c.nome.toLowerCase().includes(novaHab.toLowerCase()))
    .slice(0, 6);

  async function add(nome: string) {
    const n = nome.trim();
    if (!n || busy) return;
    setBusy(true);
    const ok = await onAdd(n);
    if (ok) setNovaHab('');
    setBusy(false);
  }

  return (
    <>
      <div className="pfx-chips">
        {habilidades.length === 0 && <span className="pfx-empty">Nenhuma habilidade.</span>}
        {habilidades.map((h) => (
          <span key={h.id || h.nome} className="pfx-chip">
            {h.nome}
            <button
              type="button"
              className="pfx-chip__x"
              onClick={() => void onRemove(h.id)}
              aria-label={`Remover ${h.nome}`}
              title="Remover"
              data-sound="click"
            >
              ×
            </button>
          </span>
        ))}
      </div>
      <div className="pfx-add">
        <input
          type="text"
          value={novaHab}
          placeholder="Adicionar habilidade…"
          onChange={(e) => setNovaHab(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') void add(novaHab);
          }}
          maxLength={80}
        />
        <button
          type="button"
          className="warm compact"
          disabled={busy || !novaHab.trim()}
          onClick={() => void add(novaHab)}
          data-sound="click"
        >
          {busy ? '…' : '+'}
        </button>
      </div>
      {sugestoes.length > 0 && (
        <div className="pfx-suggest">
          {sugestoes.map((s) => (
            <button
              key={s.id || s.nome}
              type="button"
              className="pfx-suggest__chip"
              onClick={() => void add(s.nome)}
              data-sound="click"
            >
              + {s.nome}
            </button>
          ))}
        </div>
      )}
    </>
  );
}

function MotivadoresBlock({
  motivadores,
  onReorder,
}: {
  motivadores: MotivadorItem[];
  onReorder: (ordenados: MotivadorItem[]) => Promise<boolean>;
}) {
  if (motivadores.length === 0) {
    return <span className="pfx-empty">Sem motivadores definidos no Beefor.</span>;
  }

  function move(idx: number, dir: -1 | 1) {
    const next = [...motivadores];
    const j = idx + dir;
    if (j < 0 || j >= next.length) return;
    [next[idx], next[j]] = [next[j], next[idx]];
    void onReorder(next);
  }

  return (
    <ol className="pfx-motiv">
      {motivadores.map((m, idx) => (
        <li key={m.idMotivador || m.nome} className="pfx-motiv__row">
          <span className="pfx-motiv__rank">{idx + 1}</span>
          <span className="pfx-motiv__emoji">{motivadorEmoji(m.nome)}</span>
          <span className="pfx-motiv__nome">{m.nome}</span>
          <span className="pfx-motiv__arrows">
            <button
              type="button"
              disabled={idx === 0}
              onClick={() => move(idx, -1)}
              aria-label="Subir"
              data-sound="click"
            >
              ▲
            </button>
            <button
              type="button"
              disabled={idx === motivadores.length - 1}
              onClick={() => move(idx, 1)}
              aria-label="Descer"
              data-sound="click"
            >
              ▼
            </button>
          </span>
        </li>
      ))}
    </ol>
  );
}

function MappingBlock({
  mapping,
  onAdd,
  onDel,
}: {
  mapping: ReturnType<typeof usePerfilData>['mapping'];
  onAdd: (titulo: string, itens: string[]) => Promise<boolean>;
  onDel: (idTitulo: string) => Promise<boolean>;
}) {
  const [adding, setAdding] = useState(false);
  const [titulo, setTitulo] = useState('');
  const [itensTxt, setItensTxt] = useState('');
  const [busy, setBusy] = useState(false);

  async function salvar() {
    const t = titulo.trim();
    if (!t || busy) return;
    const itens = itensTxt
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);
    setBusy(true);
    const ok = await onAdd(t, itens);
    setBusy(false);
    if (ok) {
      setTitulo('');
      setItensTxt('');
      setAdding(false);
    }
  }

  return (
    <>
      <div className="pfx-mapping">
        {mapping.length === 0 && <span className="pfx-empty">Sem personal mapping ainda.</span>}
        {mapping.map((m) => (
          <div key={m.idTitulo || m.titulo} className="pfx-mapping__card">
            <div className="pfx-mapping__head">
              <strong>{m.titulo}</strong>
              <button
                type="button"
                className="pfx-mapping__del"
                onClick={() => void onDel(m.idTitulo)}
                aria-label={`Remover ${m.titulo}`}
                title="Remover"
                data-sound="click"
              >
                ×
              </button>
            </div>
            <ul>
              {m.itens.map((it, i) => (
                <li key={i}>{it.nomeItem}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {adding ? (
        <div className="pfx-mapping__form">
          <input
            type="text"
            placeholder="Título (ex.: Curiosidades, Família…)"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            maxLength={80}
          />
          <textarea
            placeholder="Um item por linha…"
            value={itensTxt}
            onChange={(e) => setItensTxt(e.target.value)}
            rows={4}
          />
          <div className="pfx-mapping__form-actions">
            <button
              type="button"
              className="secondary compact"
              onClick={() => setAdding(false)}
              data-sound="click"
            >
              Cancelar
            </button>
            <button
              type="button"
              className="warm compact"
              disabled={busy || !titulo.trim()}
              onClick={() => void salvar()}
              data-sound="success"
            >
              {busy ? 'Salvando…' : 'Salvar'}
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          className="secondary compact pfx-mapping__addbtn"
          onClick={() => setAdding(true)}
          data-sound="click"
        >
          + Adicionar mapping
        </button>
      )}
    </>
  );
}

function ConquistasView({
  isAchievementUnlocked,
}: {
  isAchievementUnlocked: (id: string) => boolean;
}) {
  return (
    <div className="profile-modal__achievement-grid">
      {ACHIEVEMENTS.map((a) => {
        const unlocked = isAchievementUnlocked(a.id);
        return (
          <div
            key={a.id}
            className={`profile-achievement ${unlocked ? '' : 'profile-achievement--locked'}`}
            title={a.description}
          >
            <span className="profile-achievement__icon">{a.icon}</span>
            <span className="profile-achievement__label">{a.label}</span>
            {!unlocked && (
              <span className="profile-achievement__lock" aria-hidden="true">
                🔒
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

function XpInfoView() {
  const actions = Object.entries(XP_REWARDS) as Array<[XpAction, (typeof XP_REWARDS)[XpAction]]>;
  return (
    <div className="xp-info">
      <p className="xp-info__intro">
        Cada ação no Beefor te dá <strong>XP</strong>. Ao acumular XP suficiente, você sobe de nível
        e desbloqueia conquistas, temas e variantes de ícone.
      </p>
      <ul className="xp-info__list">
        {actions.map(([action, info]) => (
          <li key={action} className="xp-info__row">
            <span className="xp-info__xp">+{info.xp} XP</span>
            <span className="xp-info__body">
              <strong>{info.label}</strong>
              <small>{info.hint}</small>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

interface IconsViewProps {
  isIconUnlocked: (id: string) => boolean;
  activeIconId: string;
}

function IconsView({ isIconUnlocked, activeIconId }: IconsViewProps) {
  const [codeModalIcon, setCodeModalIcon] = useState<IconVariant | null>(null);

  return (
    <div className="icon-variants">
      <p className="icon-variants__intro">
        Escolha sua variante de ícone. Bloqueado? <strong>Clique 2x</strong> pra inserir código.
      </p>
      <div className="icon-variants__grid">
        {ICON_VARIANTS.map((v) => {
          const unlocked = isIconUnlocked(v.id);
          const active = activeIconId === v.id;
          return (
            <button
              key={v.id}
              type="button"
              className={`icon-variant ${active ? 'icon-variant--active' : ''} ${unlocked ? '' : 'icon-variant--locked'}`}
              onDoubleClick={() => {
                if (!unlocked) setCodeModalIcon(v);
              }}
              title={
                unlocked
                  ? v.description
                  : `Bloqueado — clique 2x para código (conquista: ${v.requires})`
              }
              data-sound="click"
            >
              <span
                className={`icon-variant__preview ${unlocked ? (v.effectClass ?? '') : ''}`}
                aria-hidden="true"
              >
                {unlocked ? (
                  <>
                    <BeeforLogo size={40} style={{ color: v.color }} />
                    {v.overlay && <span className="icon-variant__overlay">{v.overlay}</span>}
                  </>
                ) : (
                  <BeeforLogo size={40} className="icon-variant__mystery-bee" />
                )}
              </span>
              <strong>{v.name}</strong>
              <small>{v.description}</small>
              {!unlocked && (
                <span className="icon-variant__lock" aria-hidden="true">
                  🔒
                </span>
              )}
            </button>
          );
        })}
      </div>

      <UnlockCodeModal
        open={!!codeModalIcon}
        onClose={() => setCodeModalIcon(null)}
        kind="icon"
        targetId={codeModalIcon?.id ?? ''}
        targetName={codeModalIcon?.name ?? ''}
        requiresAchievement={codeModalIcon?.requires}
      />
    </div>
  );
}
