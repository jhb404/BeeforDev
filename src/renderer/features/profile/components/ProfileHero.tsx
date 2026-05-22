import { BeeforLogo } from '../../../components/common/BeeforLogo';
import type { IconVariant } from '../../gamification';
import type { PerfilData } from '../hooks/usePerfilData';
import { XPBar } from './XPBar';
import { SocialLinks } from './SocialLinks';
import { StatsCard } from './StatsCard';
import { BioCard } from './BioCard';
import { PfxCard } from './PfxCard';
import { HabilidadesBlock } from './HabilidadesBlock';

interface Props {
  nome: string;
  meta: string;
  foto?: string;
  level: number;
  xp: number;
  xpNext: number;
  xpPct: number;
  activeIcon: IconVariant;
  checkpoints: number;
  acoesCount: number;
  achUnlocked: number;
  achTotal: number;
  miniBio?: string;
  habilidades: PerfilData['habilidades'];
  habilidadesCombo: PerfilData['habilidadesCombo'];
  onAddHabilidade: PerfilData['addHabilidade'];
  onRemoveHabilidade: PerfilData['removeHabilidade'];
  onOpenIcons: () => void;
  onOpenXpInfo: () => void;
  onOpenConquistas: () => void;
}

/** Card-dashboard do topo: avatar hexagonal, identidade, XP, sociais, stats, bio e habilidades. */
export function ProfileHero({
  nome,
  meta,
  foto,
  level,
  xp,
  xpNext,
  xpPct,
  activeIcon,
  checkpoints,
  acoesCount,
  achUnlocked,
  achTotal,
  miniBio,
  habilidades,
  habilidadesCombo,
  onAddHabilidade,
  onRemoveHabilidade,
  onOpenIcons,
  onOpenXpInfo,
  onOpenConquistas,
}: Props) {
  return (
    <div className="pfx-hero">
      <button
        type="button"
        className="pfx-hex"
        onClick={onOpenIcons}
        title="Trocar moldura/ícone"
        aria-label="Trocar variante de ícone"
      >
        <span className="pfx-hex__shape">
          {foto ? (
            <img className="pfx-hex__img" src={foto} alt={nome} />
          ) : (
            <BeeforLogo size={72} style={{ color: activeIcon.color }} />
          )}
        </span>
        <span className="pfx-hex__lv">LVL {level}</span>
      </button>

      {/* Linha superior: identidade + sociais + stats */}
      <div className="pfx-hero__top">
        <div className="pfx-hero__left">
          {/* identidade (barra vertical vai só até o XP) + sociais */}
          <div className="pfx-hero__id">
            <div className="pfx-hero__main">
              <strong className="pfx-hero__name">{nome}</strong>
              {meta && <span className="pfx-hero__meta">{meta}</span>}

              <div className="pfx-hero__chips">
                <span className="pfx-tag">Beta tester</span>
              </div>

              <XPBar xp={xp} xpNext={xpNext} pct={xpPct} onHelp={onOpenXpInfo} />
            </div>

            <SocialLinks />
          </div>

          {/* mini bio: começa no padrão (sob o hexágono) e termina no ícone */}
          <div className="pfx-hero__bio">
            <BioCard bio={miniBio} />
          </div>
        </div>

        {/* coluna direita: stats no topo + habilidades logo abaixo */}
        <div className="pfx-hero__right">
          <div className="pfx-hero__stats">
            <StatsCard
              iconKind="trophy"
              value={`${achUnlocked}/${achTotal}`}
              label="Conquistas"
              onClick={onOpenConquistas}
            />
            <StatsCard iconKind="check" value={checkpoints} label="Checkpoints" />
            <StatsCard iconKind="action" value={acoesCount} label="Ações" />
          </div>

          <div className="pfx-hero__skills">
            <PfxCard title="🛠️ Habilidades">
              <HabilidadesBlock
                habilidades={habilidades}
                combo={habilidadesCombo}
                onAdd={onAddHabilidade}
                onRemove={onRemoveHabilidade}
              />
            </PfxCard>
          </div>
        </div>
      </div>
    </div>
  );
}
