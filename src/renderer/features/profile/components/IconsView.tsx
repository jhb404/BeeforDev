import { useState } from 'react';
import { BeeforLogo } from '../../../components/common/BeeforLogo';
import { ICON_VARIANTS, UnlockCodeModal, type IconVariant } from '../../gamification';

interface Props {
  isIconUnlocked: (id: string) => boolean;
  activeIconId: string;
}

/** Galeria de variantes de ícone; bloqueadas pedem código via duplo-clique. */
export function IconsView({ isIconUnlocked, activeIconId }: Props) {
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
