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

interface Props {
  open: boolean;
  onClose: () => void;
  userName?: string;
  userEmail?: string;
}

type View = 'home' | 'xp-info' | 'icons';

export function ProfileModal({ open, onClose, userName, userEmail }: Props) {
  const { stats, isAchievementUnlocked, isIconUnlocked } = useGamification();
  const [view, setView] = useState<View>('home');

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
      className="profile-modal"
      labelledBy="profile-modal-title"
    >
      <div className="modal-head">
        <div>
          <p className="eyebrow">Perfil</p>
          <h2 id="profile-modal-title">
            {view === 'home' && 'Meu perfil'}
            {view === 'xp-info' && 'Como funciona o XP'}
            {view === 'icons' && 'Variantes de ícone'}
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
            isAchievementUnlocked={isAchievementUnlocked}
            onOpenXpInfo={() => setView('xp-info')}
            onOpenIcons={() => setView('icons')}
          />
        )}

        {view === 'xp-info' && <XpInfoView />}

        {view === 'icons' && (
          <IconsView isIconUnlocked={isIconUnlocked} activeIconId={activeIconId} />
        )}
      </div>
    </ModalShell>
  );
}

interface ProfileHomeProps {
  userName?: string;
  userEmail?: string;
  xpPct: number;
  stats: ReturnType<typeof useGamification>['stats'];
  activeIcon: IconVariant;
  isAchievementUnlocked: (id: string) => boolean;
  onOpenXpInfo: () => void;
  onOpenIcons: () => void;
}

function ProfileHome({
  userName,
  userEmail,
  xpPct,
  stats,
  activeIcon,
  isAchievementUnlocked,
  onOpenXpInfo,
  onOpenIcons,
}: ProfileHomeProps) {
  return (
    <>
      <div className="profile-modal__header">
        <button
          type="button"
          className={`profile-modal__avatar profile-modal__avatar--button ${activeIcon.effectClass ?? ''}`}
          onClick={onOpenIcons}
          title="Trocar ícone"
          aria-label="Trocar variante de ícone"
        >
          <BeeforLogo size={48} style={{ color: activeIcon.color }} />
          {activeIcon.overlay && (
            <span className="profile-modal__avatar-overlay" aria-hidden="true">
              {activeIcon.overlay}
            </span>
          )}
          <div className="profile-modal__level-badge">Lv {stats.level}</div>
        </button>
        <div className="profile-modal__identity">
          <strong className="profile-modal__name">{userName ?? 'Beta Tester'}</strong>
          <span className="profile-modal__email">{userEmail ?? '—'}</span>
        </div>
      </div>

      <div className="profile-modal__xp">
        <div className="profile-modal__xp-info">
          <span>XP</span>
          <button
            type="button"
            className="profile-modal__xp-help"
            onClick={onOpenXpInfo}
            aria-label="Como funciona o XP"
            title="Como funciona o XP"
          >
            ?
          </button>
          <span className="profile-modal__xp-numbers">
            {stats.xp} / {stats.xpNext}
          </span>
        </div>
        <div className="profile-modal__xp-bar">
          <div className="profile-modal__xp-fill" style={{ width: `${xpPct}%` }} />
        </div>
      </div>

      <div className="profile-modal__stats">
        <div className="profile-stat">
          <span className="profile-stat__icon">🔥</span>
          <span className="profile-stat__value">{stats.moodStreak}</span>
          <span className="profile-stat__label">streak de mood</span>
        </div>
        <div className="profile-stat">
          <span className="profile-stat__icon">⚡</span>
          <span className="profile-stat__value">{stats.totalLancamentos}</span>
          <span className="profile-stat__label">lançamentos</span>
        </div>
        <div className="profile-stat">
          <span className="profile-stat__icon">🎁</span>
          <span className="profile-stat__value">{stats.totalKudos}</span>
          <span className="profile-stat__label">kudos enviados</span>
        </div>
        <div className="profile-stat">
          <span className="profile-stat__icon">💰</span>
          <span className="profile-stat__value">{stats.coinsGanhos}</span>
          <span className="profile-stat__label">coins ganhos</span>
        </div>
      </div>

      <div className="profile-modal__achievements">
        <h3 className="profile-modal__section-title">🏆 Conquistas</h3>
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
      </div>

      <p className="profile-modal__hint">
        💡 Sistema de gamificação em desenvolvimento. Dados reais (streak, XP, conquistas) virão em
        breve, conectados ao backend.
      </p>
    </>
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
      <p className="profile-modal__hint">
        💡 Em desenvolvimento. Os valores podem mudar conforme balanceamento do sistema.
      </p>
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
      <p className="profile-modal__hint">
        💡 Troca de ícone em tempo real está sendo desenvolvida. Por enquanto a seleção é só visual.
      </p>

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
