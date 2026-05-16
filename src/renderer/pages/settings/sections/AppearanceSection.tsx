import type { AppSettings } from '@shared/types/index';
import { DensityCard } from './appearance/DensityCard';
import { LogoCard } from './appearance/LogoCard';
import { ThemePresetsCard } from './appearance/ThemePresetsCard';
import { ViewModeCard } from './appearance/ViewModeCard';

interface AppearanceSectionProps {
  settings: AppSettings;
  onUpdate: <K extends keyof AppSettings>(k: K, v: AppSettings[K]) => void;
  onChangeViewMode: (mode: 'classic' | 'minimal') => void;
}

export function AppearanceSection({
  settings,
  onUpdate,
  onChangeViewMode,
}: AppearanceSectionProps) {
  return (
    <section className="settings-section">
      <h3 className="settings-section__title">PERSONALIZAÇÃO / APARÊNCIA</h3>
      <p className="settings-section__hint">VISUALIZAÇÃO | DENSIDADE | TEMAS | LOGO</p>
      <div className="settings-grid grid-1">
        <ViewModeCard settings={settings} onUpdate={onUpdate} onChangeViewMode={onChangeViewMode} />
        <DensityCard settings={settings} onUpdate={onUpdate} />
        <ThemePresetsCard settings={settings} onUpdate={onUpdate} />
        {/* ThemeEditorCard segue oculto: presets desbloqueáveis são o fluxo atual. */}
        <LogoCard settings={settings} onUpdate={onUpdate} />
      </div>
    </section>
  );
}
