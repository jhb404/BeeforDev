import { BeeforLogo } from '../../../components/common/BeeforLogo';
import { useGamification } from '../../gamification';
import type { AppearanceCardProps } from '../types';

interface LogoVariantSpec {
  id: 'orange' | 'purple' | string;
  name: string;
  description: string;
  color: string;
  effectClass?: string;
  overlay?: string;
  requires: string | null;
}

const LOGO_VARIANTS: LogoVariantSpec[] = [
  {
    id: 'orange',
    name: 'Abelha Classica',
    description: 'Logo padrao laranja, sempre disponivel.',
    color: '#e6a817',
    requires: null,
  },
  {
    id: 'purple',
    name: 'Abelha Real',
    description: 'Variante roxa bloqueada por enquanto.',
    color: '#7c5cbf',
    requires: 'logo-purple-locked',
  },
  {
    id: 'logo-flame',
    name: 'Abelha em Chamas',
    description: 'Mantenha streak de 30 dias para revelar.',
    color: '#dc2626',
    effectClass: 'logo-fx-flame',
    overlay: '!',
    requires: 'mood-month',
  },
  {
    id: 'logo-crowned',
    name: 'Rainha Coroada',
    description: 'Envie 50 KudoCards para desvendar.',
    color: '#fbbf24',
    effectClass: 'logo-fx-crown',
    overlay: '^',
    requires: 'kudo-master',
  },
  {
    id: 'logo-galaxy',
    name: 'Abelha Estelar',
    description: 'Alcance o nivel 10 para descobrir.',
    color: '#a855f7',
    effectClass: 'logo-fx-galaxy',
    overlay: '*',
    requires: 'lvl-10',
  },
  {
    id: 'logo-diamond',
    name: 'Cristal Beefor',
    description: 'Conquista de nivel 25.',
    color: '#60a5fa',
    effectClass: 'logo-fx-diamond',
    overlay: '<>',
    requires: 'lvl-25',
  },
  {
    id: 'logo-trophy',
    name: 'Lenda Dourada',
    description: '100 KudoCards enviados.',
    color: '#f59e0b',
    effectClass: 'logo-fx-trophy',
    overlay: '#',
    requires: 'kudo-legend',
  },
  {
    id: 'logo-master',
    name: 'Mestre Supremo',
    description: 'Complete todas as conquistas.',
    color: '#fbbf24',
    effectClass: 'logo-fx-master',
    overlay: '+',
    requires: 'beefor-master',
  },
];

export function LogoCard({ settings, onUpdate }: AppearanceCardProps) {
  const { isAchievementUnlocked } = useGamification();

  const apply = (v: LogoVariantSpec) => {
    if (v.requires && !isAchievementUnlocked(v.requires)) return;
    if (v.id === 'orange' || v.id === 'purple') {
      onUpdate('logoVariant', v.id);
    }
  };

  return (
    <div className="card">
      <h2>Logo do app</h2>
      <p style={{ color: 'var(--text-muted)', fontSize: 12, margin: '0 0 12px' }}>
        Variantes desbloqueadas via conquistas. As bloqueadas so revelam quando voce completa o
        requisito.{' '}
        <em style={{ color: 'var(--warm)' }}>
          Em desenvolvimento: apenas Laranja aplica por enquanto.
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
              title={unlocked ? v.description : `Bloqueado - conquista "${v.requires}"`}
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
                  locked
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
