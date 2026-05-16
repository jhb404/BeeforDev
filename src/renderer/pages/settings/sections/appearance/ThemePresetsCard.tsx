import { useState } from 'react';
import { UnlockCodeModal, useGamification } from '../../../../features/gamification';
import type { ThemePreset } from '../../../../features/gamification';
import type { AppearanceCardProps } from './types';

export function ThemePresetsCard({ settings, onUpdate }: AppearanceCardProps) {
  const { themePresets, isThemePresetUnlocked } = useGamification();
  const [codeModalPreset, setCodeModalPreset] = useState<ThemePreset | null>(null);

  const applyPreset = (preset: ThemePreset) => {
    if (!isThemePresetUnlocked(preset.id)) return;
    onUpdate('themePresetId', preset.id);
  };

  const activePresetId = settings.themePresetId ?? 'default';

  return (
    <div className="card">
      <h2>Temas</h2>
      <p style={{ color: 'var(--text-muted)', fontSize: 12, margin: '0 0 12px' }}>
        Presets prontos. Alguns são desbloqueados por conquistas.{' '}
      </p>
      <div className="theme-presets-grid">
        {themePresets.map((preset) => {
          const unlocked = isThemePresetUnlocked(preset.id);
          const active = activePresetId === preset.id;
          return (
            <button
              key={preset.id}
              type="button"
              className={`theme-preset ${active ? 'theme-preset--active' : ''} ${unlocked ? '' : 'theme-preset--locked'}`}
              onClick={() => applyPreset(preset)}
              onDoubleClick={() => {
                if (!unlocked) setCodeModalPreset(preset);
              }}
              title={
                unlocked
                  ? preset.description
                  : `Bloqueado — clique 2x para usar código (conquista: ${preset.requires})`
              }
              data-sound="click"
            >
              <span className="theme-preset__swatches" aria-hidden="true">
                {preset.swatches.map((c, i) => (
                  <span key={i} className="theme-preset__swatch" style={{ background: c }} />
                ))}
              </span>
              <strong>{preset.name}</strong>
              <small>{preset.description}</small>
              {!unlocked && (
                <span className="theme-preset__lock" aria-hidden="true">
                  🔒
                </span>
              )}
            </button>
          );
        })}
      </div>

      <UnlockCodeModal
        open={!!codeModalPreset}
        onClose={() => setCodeModalPreset(null)}
        kind="theme"
        targetId={codeModalPreset?.id ?? ''}
        targetName={codeModalPreset?.name ?? ''}
        requiresAchievement={codeModalPreset?.requires}
        onUnlocked={() => {
          if (codeModalPreset) onUpdate('themePresetId', codeModalPreset.id);
        }}
      />
    </div>
  );
}
