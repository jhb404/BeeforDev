import { useState } from 'react';
import { UnlockCodeModal, useGamification } from '../../../../features/gamification';
import type { ThemePreset } from '../../../../features/gamification';
import { THEME_PREVIEW_DURATION_S, useSettings } from '../../../../app/providers/SettingsProvider';
import type { AppearanceCardProps } from './types';

export function ThemePresetsCard({ settings, onUpdate }: AppearanceCardProps) {
  const { themePresets, isThemePresetUnlocked } = useGamification();
  const { previewThemeId, startThemePreview, stopThemePreview } = useSettings();
  const [codeModalPreset, setCodeModalPreset] = useState<ThemePreset | null>(null);

  const handleCardClick = (preset: ThemePreset) => {
    if (isThemePresetUnlocked(preset.id)) {
      stopThemePreview();
      onUpdate('themePresetId', preset.id);
      return;
    }
    startThemePreview(preset.id, preset.name);
  };

  const activePresetId = settings.themePresetId ?? 'default';

  return (
    <div className="card">
      <h2>Temas</h2>

      <ul className="theme-presets-legend">
        <li>
          <kbd>1 clique</kbd> em desbloqueado → aplica
        </li>
        <li>
          <kbd>1 clique</kbd> em bloqueado → pré-visualiza por {THEME_PREVIEW_DURATION_S}s no app
          inteiro (pode navegar)
        </li>
        <li>
          <kbd>2 cliques</kbd> em bloqueado → inserir código de desbloqueio
        </li>
      </ul>

      <div className="theme-presets-grid">
        {themePresets.map((preset) => {
          const unlocked = isThemePresetUnlocked(preset.id);
          const active = activePresetId === preset.id;
          const previewing = previewThemeId === preset.id;
          return (
            <button
              key={preset.id}
              type="button"
              className={`theme-preset ${active ? 'theme-preset--active' : ''} ${unlocked ? '' : 'theme-preset--locked'} ${previewing ? 'theme-preset--previewing' : ''}`}
              onClick={() => handleCardClick(preset)}
              onDoubleClick={() => {
                if (!unlocked) {
                  stopThemePreview();
                  setCodeModalPreset(preset);
                }
              }}
              data-tooltip={
                unlocked
                  ? `Aplicar ${preset.name}`
                  : `Clique pra pré-visualizar · 2x pra inserir código (conquista: ${preset.requires})`
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
          if (codeModalPreset) {
            stopThemePreview();
            onUpdate('themePresetId', codeModalPreset.id);
          }
        }}
      />
    </div>
  );
}
