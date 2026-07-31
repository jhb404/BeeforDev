import { useEffect, useState } from 'react';
import type { AppSettings } from '@shared/types/index';
import { useIpc } from '../../../services/ipc';
import { useToast } from '../../../app/providers/ToastProvider';
import { mergeSettings } from '../../../pages/settings/defaults';
import { DensityCard, LogoCard, ThemePresetsCard, ViewModeCard } from '../../appearance';
import { APP_EVENTS, emitAppEvent } from '../../../app/events';
import { FunnyLoader } from '../../../components/common/FunnyLoader';
import { useAccess } from '../../../app/providers/AccessProvider';

/** Aparência dentro do Perfil: tema, logo, densidade e modo de visualização. */
export function AppearanceView() {
  const { settings: settingsClient, system: systemClient } = useIpc();
  const showToast = useToast();
  const [settings, setSettings] = useState<AppSettings | null>(null);
  // ViewMode escolhe o layout da grade de ponto — sem TimeSheet não há o que escolher.
  const { semTimesheet } = useAccess();

  useEffect(() => {
    void settingsClient.get().then((s) => {
      setSettings(mergeSettings(s));
    });
  }, [settingsClient]);

  const update = async <K extends keyof AppSettings>(k: K, v: AppSettings[K]) => {
    if (!settings) return;
    const next = { ...settings, [k]: v };
    setSettings(next);
    await settingsClient.set(next);
    emitAppEvent(APP_EVENTS.SETTINGS_CHANGED);
  };

  const changeViewMode = async (mode: 'classic' | 'minimal') => {
    if (!settings) return;
    if ((settings.viewMode ?? 'classic') === mode) return;
    const next = { ...settings, viewMode: mode };
    setSettings(next);
    await settingsClient.set(next);
    showToast({ kind: 'ok', msg: 'Reiniciando para aplicar...' });
    await systemClient.relaunchApp();
  };

  if (!settings) {
    return <FunnyLoader title="Carregando aparência" />;
  }

  return (
    <section className="settings-section appearance-view">
      <p className="settings-section__hint">
        {semTimesheet ? 'DENSIDADE | TEMAS | LOGO' : 'VISUALIZAÇÃO | DENSIDADE | TEMAS | LOGO'}
      </p>
      <div className="settings-grid grid-1">
        {!semTimesheet && (
          <ViewModeCard settings={settings} onUpdate={update} onChangeViewMode={changeViewMode} />
        )}
        <DensityCard settings={settings} onUpdate={update} />
        <ThemePresetsCard settings={settings} onUpdate={update} />
        <LogoCard settings={settings} onUpdate={update} />
      </div>
    </section>
  );
}
