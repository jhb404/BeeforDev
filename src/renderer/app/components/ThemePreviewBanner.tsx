import { THEME_PREVIEW_DURATION_S, useSettings } from '../providers/SettingsProvider';
import { useGamification } from '../../features/gamification';

export function ThemePreviewBanner() {
  const { previewThemeId, previewName, previewSecondsLeft, stopThemePreview } = useSettings();
  const { themePresets } = useGamification();

  if (!previewThemeId || !previewName) return null;

  const preset = themePresets.find((p) => p.id === previewThemeId);
  if (!preset) return null;

  const progressPct = (previewSecondsLeft / THEME_PREVIEW_DURATION_S) * 100;

  return (
    <div className="theme-preview-banner theme-preview-banner--floating locked" role="status">
      <div className="theme-preview-banner__info">
        <span className="theme-preview-banner__swatches" aria-hidden="true">
          {preset.swatches.map((c, i) => (
            <span key={i} style={{ background: c }} />
          ))}
        </span>
        <div className="theme-preview-banner__text">
          <strong>
            Pré-visualizando: {previewName}
            <span className="theme-preview-banner__timer"> · {previewSecondsLeft}s</span>
          </strong>
          <small>🔒 Conquista necessária: {preset.requires}</small>
        </div>
      </div>
      <div className="theme-preview-banner__actions">
        <button
          type="button"
          className="secondary"
          onClick={() => stopThemePreview()}
          data-sound="close"
        >
          Cancelar
        </button>
      </div>
      <div className="theme-preview-banner__progress" aria-hidden="true">
        <div className="theme-preview-banner__progress-fill" style={{ width: `${progressPct}%` }} />
      </div>
    </div>
  );
}
