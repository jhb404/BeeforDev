import type { AppSettings } from '@shared/types';
import { Switch } from '../Switch';
import { useGamification } from '../../../features/gamification';
import type { ThemePreset } from '../../../features/gamification';
import { BeeforLogo } from '../../../components/common/BeeforLogo';

interface AppearanceSectionProps {
  settings: AppSettings;
  onUpdate: <K extends keyof AppSettings>(k: K, v: AppSettings[K]) => void;
  onChangeViewMode: (mode: 'classic' | 'minimal') => void;
}

const _THEME_KEYS = [
  { key: 'accent', label: 'Cor de destaque', placeholder: '#7c5cbf' },
  { key: 'warm', label: 'Cor quente', placeholder: '#e6a817' },
  { key: 'ok', label: 'Cor de sucesso', placeholder: '#27b899' },
  { key: 'err', label: 'Cor de erro', placeholder: '#e05470' },
] as const;

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
        {/* ThemeEditorCard oculto — substituido por presets desbloqueáveis. Mantido no código para retomar depois.
        <ThemeEditorCard settings={settings} onUpdate={onUpdate} /> */}
        <LogoCard settings={settings} onUpdate={onUpdate} />
      </div>
    </section>
  );
}

function ThemePresetsCard({
  settings,
  onUpdate,
}: Pick<AppearanceSectionProps, 'settings' | 'onUpdate'>) {
  const { themePresets, isThemePresetUnlocked } = useGamification();

  const applyPreset = (preset: ThemePreset) => {
    if (!isThemePresetUnlocked(preset.id)) return;
    // Single update — second update would race against settings closure
    // and erase themePresetId. Overrides cleared by setting empty obj here.
    onUpdate('themePresetId', preset.id);
  };

  const activePresetId = settings.themePresetId ?? 'default';

  return (
    <div className="card">
      <h2>Temas</h2>
      <p style={{ color: 'var(--text-muted)', fontSize: 12, margin: '0 0 12px' }}>
        Presets prontos. Alguns são desbloqueados ao alcançar conquistas.{' '}
        <em style={{ color: 'var(--warm)' }}>Em desenvolvimento — persistência virá em breve.</em>
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
              disabled={!unlocked}
              title={
                unlocked ? preset.description : `Bloqueado — requer conquista "${preset.requires}"`
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
    </div>
  );
}

function ViewModeCard({ settings, onUpdate, onChangeViewMode }: AppearanceSectionProps) {
  return (
    <div className="card">
      <h2>Visualização</h2>
      <p style={{ color: 'var(--text-muted)', fontSize: 12, margin: '0 0 12px' }}>
        Troca aplica reiniciando o app automaticamente.
      </p>
      {settings.viewMode === 'minimal' && (
        <Switch
          id="calendarShowDiff"
          checked={settings.calendarShowDiff ?? false}
          onChange={(v) => onUpdate('calendarShowDiff', v)}
          label="Mostrar saldo diário nas células do calendário"
        />
      )}
      <div className="view-mode-row">
        <button
          type="button"
          className={`view-mode-opt ${(settings.viewMode ?? 'classic') === 'classic' ? 'active' : ''}`}
          onClick={() => onChangeViewMode('classic')}
        >
          <svg className="vm-preview" viewBox="0 0 120 70" aria-hidden="true">
            <rect x="4" y="4" width="112" height="10" rx="2" fill="var(--bg-3)" />
            <rect x="4" y="18" width="112" height="6" rx="1" fill="var(--accent-soft)" />
            <rect x="4" y="28" width="112" height="6" rx="1" fill="var(--bg-3)" />
            <rect x="4" y="38" width="112" height="6" rx="1" fill="var(--bg-3)" />
            <rect x="4" y="48" width="112" height="6" rx="1" fill="var(--bg-3)" />
            <rect x="4" y="58" width="112" height="6" rx="1" fill="var(--bg-3)" />
          </svg>
          <strong>Clássica</strong>
          <span>Tabela linha-a-linha com todos os dias</span>
        </button>
        <button
          type="button"
          className={`view-mode-opt ${settings.viewMode === 'minimal' ? 'active' : ''}`}
          onClick={() => onChangeViewMode('minimal')}
        >
          <svg className="vm-preview" viewBox="0 0 120 70" aria-hidden="true">
            <rect x="4" y="4" width="54" height="62" rx="3" fill="var(--bg-3)" />
            {[0, 1, 2, 3].map((row) =>
              [0, 1, 2, 3, 4].map((col) => (
                <rect
                  key={`${row}-${col}`}
                  x={7 + col * 10}
                  y={9 + row * 14}
                  width="8"
                  height="11"
                  rx="1.5"
                  fill={row === 1 && col === 2 ? 'var(--accent)' : 'var(--bg-2)'}
                />
              )),
            )}
            <rect x="62" y="4" width="54" height="62" rx="3" fill="var(--bg-3)" />
            <rect x="66" y="9" width="30" height="6" rx="1" fill="var(--accent-soft)" />
            <rect x="66" y="20" width="46" height="5" rx="1" fill="var(--bg-2)" />
            <rect x="66" y="28" width="46" height="5" rx="1" fill="var(--bg-2)" />
            <rect x="66" y="36" width="46" height="5" rx="1" fill="var(--bg-2)" />
            <rect x="66" y="50" width="20" height="10" rx="2" fill="var(--accent)" />
          </svg>
          <strong>Minimalista</strong>
          <span>Calendário + dia selecionado</span>
        </button>
      </div>
    </div>
  );
}

function DensityCard({
  settings,
  onUpdate,
}: Pick<AppearanceSectionProps, 'settings' | 'onUpdate'>) {
  return (
    <div className="card">
      <h2>Densidade da interface</h2>
      <div className="density-row">
        {(['compact', 'normal', 'comfortable'] as const).map((d) => (
          <button
            key={d}
            type="button"
            className={`density-opt ${(settings.uiDensity ?? 'normal') === d ? 'active' : ''}`}
            onClick={() => onUpdate('uiDensity', d)}
          >
            <span className="density-bars">
              {d === 'compact' && (
                <>
                  <i />
                  <i />
                  <i />
                  <i />
                  <i />
                </>
              )}
              {d === 'normal' && (
                <>
                  <i />
                  <i />
                  <i />
                </>
              )}
              {d === 'comfortable' && (
                <>
                  <i />
                  <i />
                </>
              )}
            </span>
            <strong>
              {d === 'compact' ? 'Compacto' : d === 'normal' ? 'Normal' : 'Confortável'}
            </strong>
          </button>
        ))}
      </div>
    </div>
  );
}

function _ThemeEditorCard({
  settings,
  onUpdate,
}: Pick<AppearanceSectionProps, 'settings' | 'onUpdate'>) {
  return (
    <div className="card">
      <h2>Editor de tema</h2>
      <p style={{ color: 'var(--text-muted)', fontSize: 12, margin: '0 0 14px' }}>
        Personaliza cores e visual. Deixe vazio para usar o padrão.
      </p>
      <div className="theme-editor-grid">
        {_THEME_KEYS.map(({ key, label, placeholder }) => (
          <div className="theme-editor-field" key={key}>
            <label className="label">{label}</label>
            <div className="theme-color-wrap">
              <input
                type="color"
                className="theme-color-picker"
                value={settings.themeOverrides?.[key] || placeholder}
                onChange={(e) =>
                  onUpdate('themeOverrides', {
                    ...settings.themeOverrides,
                    [key]: e.target.value,
                  })
                }
              />
              <input
                type="text"
                value={settings.themeOverrides?.[key] ?? ''}
                placeholder={placeholder}
                onChange={(e) =>
                  onUpdate('themeOverrides', {
                    ...settings.themeOverrides,
                    [key]: e.target.value || undefined,
                  })
                }
              />
            </div>
          </div>
        ))}
        <div className="theme-editor-field">
          <label className="label">Raio de borda</label>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <input
              type="range"
              min={0}
              max={20}
              step={1}
              value={parseInt(settings.themeOverrides?.radius ?? '10')}
              style={{ flex: 1, minHeight: 'auto', padding: 0 }}
              onChange={(e) =>
                onUpdate('themeOverrides', {
                  ...settings.themeOverrides,
                  radius: `${e.target.value}px`,
                })
              }
            />
            <span style={{ fontSize: 12, color: 'var(--text-muted)', minWidth: 32 }}>
              {settings.themeOverrides?.radius ?? '10px'}
            </span>
          </div>
        </div>
        <div className="theme-editor-field">
          <label className="label">Tamanho de fonte</label>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <input
              type="range"
              min={0.8}
              max={1.3}
              step={0.05}
              value={parseFloat(settings.themeOverrides?.fontScale ?? '1')}
              style={{ flex: 1, minHeight: 'auto', padding: 0 }}
              onChange={(e) =>
                onUpdate('themeOverrides', {
                  ...settings.themeOverrides,
                  fontScale: e.target.value,
                })
              }
            />
            <span style={{ fontSize: 12, color: 'var(--text-muted)', minWidth: 32 }}>
              {Math.round(parseFloat(settings.themeOverrides?.fontScale ?? '1') * 100)}%
            </span>
          </div>
        </div>
      </div>
      <button
        className="secondary compact"
        style={{ marginTop: 12 }}
        onClick={() => onUpdate('themeOverrides', {})}
      >
        Resetar tema
      </button>
    </div>
  );
}

/** Mystery/locked logo placeholders behind achievements. Real SVG variants land later. */
interface LogoVariantSpec {
  id: 'orange' | 'purple' | string;
  name: string;
  description: string;
  color: string;
  /** CSS extra class — applies filter/glow/overlay effects without new asset. */
  effectClass?: string;
  /** Optional emoji overlay rendered top-right of the logo. */
  overlay?: string;
  requires: string | null;
}

const LOGO_VARIANTS: LogoVariantSpec[] = [
  {
    id: 'orange',
    name: 'Abelha Clássica',
    description: 'Logo padrão laranja, sempre disponível.',
    color: '#e6a817',
    requires: null,
  },
  {
    id: 'purple',
    name: 'Abelha Real',
    description: 'Variante roxa, sempre disponível.',
    color: '#7c5cbf',
    requires: null,
  },
  {
    id: 'logo-flame',
    name: 'Abelha em Chamas',
    description: 'Mantenha streak de 30 dias para revelar.',
    color: '#dc2626',
    effectClass: 'logo-fx-flame',
    overlay: '🔥',
    requires: 'mood-month',
  },
  {
    id: 'logo-crowned',
    name: 'Rainha Coroada',
    description: 'Envie 50 KudoCards para desvendar.',
    color: '#fbbf24',
    effectClass: 'logo-fx-crown',
    overlay: '👑',
    requires: 'kudo-master',
  },
  {
    id: 'logo-galaxy',
    name: 'Abelha Estelar',
    description: 'Alcance o nível 10 para descobrir.',
    color: '#a855f7',
    effectClass: 'logo-fx-galaxy',
    overlay: '✨',
    requires: 'lvl-10',
  },
  {
    id: 'logo-diamond',
    name: 'Cristal Beefor',
    description: 'Conquista de nível 25.',
    color: '#60a5fa',
    effectClass: 'logo-fx-diamond',
    overlay: '💎',
    requires: 'lvl-25',
  },
  {
    id: 'logo-trophy',
    name: 'Lenda Dourada',
    description: '100 KudoCards enviados.',
    color: '#f59e0b',
    effectClass: 'logo-fx-trophy',
    overlay: '🏆',
    requires: 'kudo-legend',
  },
  {
    id: 'logo-master',
    name: 'Mestre Supremo',
    description: 'Complete todas as conquistas.',
    color: '#fbbf24',
    effectClass: 'logo-fx-master',
    overlay: '🌟',
    requires: 'beefor-master',
  },
];

function LogoCard({ settings, onUpdate }: Pick<AppearanceSectionProps, 'settings' | 'onUpdate'>) {
  const { isAchievementUnlocked } = useGamification();

  const apply = (v: LogoVariantSpec) => {
    if (v.requires && !isAchievementUnlocked(v.requires)) return;
    if (v.id === 'orange' || v.id === 'purple') {
      onUpdate('logoVariant', v.id);
    }
    // Outras variantes não persistem ainda — só visual. Implementação real virá com assets.
  };

  return (
    <div className="card">
      <h2>Logo do app</h2>
      <p style={{ color: 'var(--text-muted)', fontSize: 12, margin: '0 0 12px' }}>
        Variantes desbloqueadas via conquistas. As bloqueadas só revelam quando você completa o
        requisito.{' '}
        <em style={{ color: 'var(--warm)' }}>
          Em desenvolvimento — apenas Laranja/Roxo aplicam por enquanto.
        </em>
      </p>
      <div className="logo-variants-grid">
        {LOGO_VARIANTS.map((v) => {
          const unlocked = v.requires === null || isAchievementUnlocked(v.requires);
          const active = unlocked && (settings.logoVariant ?? 'orange') === v.id;
          return (
            <button
              key={v.id}
              type="button"
              className={`logo-variant-card ${active ? 'logo-variant-card--active' : ''} ${unlocked ? '' : 'logo-variant-card--locked'}`}
              onClick={() => apply(v)}
              disabled={!unlocked}
              title={unlocked ? v.description : `Bloqueado — conquista "${v.requires}"`}
              data-sound="click"
            >
              <span
                className={`logo-variant-card__preview ${unlocked ? (v.effectClass ?? '') : ''}`}
                aria-hidden="true"
              >
                {unlocked ? (
                  <>
                    <BeeforLogo size={40} style={{ color: v.color }} />
                    {v.overlay && <span className="logo-variant-card__overlay">{v.overlay}</span>}
                  </>
                ) : (
                  <BeeforLogo size={40} className="logo-variant-card__mystery-bee" />
                )}
              </span>
              <strong>{unlocked ? v.name : '???'}</strong>
              <small>{v.description}</small>
              {!unlocked && (
                <span className="logo-variant-card__lock" aria-hidden="true">
                  🔒
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
