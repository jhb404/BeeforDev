import { useMemo } from 'react';
import { ACHIEVEMENTS, ICON_VARIANTS, THEME_PRESETS, TIERS } from '../../gamification';
import type { Achievement } from '../../gamification';

interface Props {
  isAchievementUnlocked: (id: string) => boolean;
}

const themeName = (id: string) => THEME_PRESETS.find((t) => t.id === id)?.name ?? id;
const iconName = (id: string) => ICON_VARIANTS.find((v) => v.id === id)?.name ?? id;

/** Chips de recompensa: tema, ícone, XP bônus. */
function RewardChips({ rewards }: { rewards: Achievement['rewards'] }) {
  if (!rewards) return null;
  return (
    <div className="ach-card__rewards">
      {rewards.themePreset && (
        <span
          className="ach-reward ach-reward--theme"
          title={`Tema: ${themeName(rewards.themePreset)}`}
        >
          🎨 {themeName(rewards.themePreset)}
        </span>
      )}
      {rewards.iconVariant && (
        <span
          className="ach-reward ach-reward--icon"
          title={`Ícone: ${iconName(rewards.iconVariant)}`}
        >
          ✨ {iconName(rewards.iconVariant)}
        </span>
      )}
      {rewards.xpBonus && (
        <span className="ach-reward ach-reward--xp" title={`+${rewards.xpBonus} XP no desbloqueio`}>
          +{rewards.xpBonus} XP
        </span>
      )}
    </div>
  );
}

/**
 * Grade de conquistas agrupada por tier (raridade), com barra de progresso,
 * chips de recompensa e estados claros desbloqueado / bloqueado.
 */
export function ConquistasView({ isAchievementUnlocked }: Props) {
  const unlockedCount = useMemo(
    () => ACHIEVEMENTS.filter((a) => isAchievementUnlocked(a.id)).length,
    [isAchievementUnlocked],
  );
  const total = ACHIEVEMENTS.length;
  const pct = Math.round((unlockedCount / total) * 100);

  return (
    <div className="ach-view">
      {/* ── Cabeçalho de progresso ───────────────────────── */}
      <div className="ach-summary">
        <div className="ach-summary__top">
          <span className="ach-summary__count">
            <strong>{unlockedCount}</strong> de {total} desbloqueadas
          </span>
          <span className="ach-summary__pct">{pct}%</span>
        </div>
        <div className="ach-summary__bar">
          <div className="ach-summary__fill" style={{ width: `${pct}%` }} />
        </div>
      </div>

      {/* ── Seções por tier ──────────────────────────────── */}
      {TIERS.map((t) => {
        const items = ACHIEVEMENTS.filter((a) => a.tier === t.tier);
        if (items.length === 0) return null;
        const doneInTier = items.filter((a) => isAchievementUnlocked(a.id)).length;
        return (
          <section key={t.tier} className="ach-tier" data-tier={t.tier}>
            <header className="ach-tier__head">
              <span className="ach-tier__dot" />
              <h3 className="ach-tier__name">{t.name}</h3>
              <span className="ach-tier__rarity">{t.rarity}</span>
              <span className="ach-tier__progress">
                {doneInTier}/{items.length}
              </span>
            </header>

            <div className="ach-tier__grid">
              {items.map((a) => {
                const unlocked = isAchievementUnlocked(a.id);
                return (
                  <div
                    key={a.id}
                    className={`ach-card ${unlocked ? 'ach-card--unlocked' : 'ach-card--locked'}`}
                    data-tier={a.tier}
                  >
                    <div className="ach-card__icon-wrap">
                      <span className="ach-card__icon">{unlocked ? a.icon : '🔒'}</span>
                    </div>
                    <div className="ach-card__body">
                      <strong className="ach-card__label">{a.label}</strong>
                      <small className="ach-card__desc">{a.description}</small>
                      <RewardChips rewards={a.rewards} />
                    </div>
                    {unlocked && (
                      <span className="ach-card__check" aria-hidden="true">
                        ✓
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
