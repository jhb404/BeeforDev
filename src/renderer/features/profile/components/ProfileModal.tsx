import { useState } from 'react';
import { ModalShell } from '../../../components/ui/ModalShell';
import { ACHIEVEMENTS, ICON_VARIANTS, useGamification } from '../../gamification';
import { usePerfilData } from '../hooks/usePerfilData';
import { ProfileHome } from './ProfileHome';
import { XpInfoView } from './XpInfoView';
import { IconsView } from './IconsView';
import { ConquistasView } from './ConquistasView';

interface Props {
  open: boolean;
  onClose: () => void;
  userName?: string;
  userEmail?: string;
}

type View = 'home' | 'xp-info' | 'icons' | 'conquistas';

const TITLES: Record<Exclude<View, 'home'>, string> = {
  'xp-info': 'Como funciona o XP',
  icons: 'Variantes de ícone',
  conquistas: '🏆 Conquistas',
};

/** Modal de perfil: alterna entre home (dashboard) e telas de XP, ícones e conquistas. */
export function ProfileModal({ open, onClose, userName }: Props) {
  const { stats, isAchievementUnlocked, isIconUnlocked } = useGamification();
  const [view, setView] = useState<View>('home');
  const data = usePerfilData(open);

  const xpPct = Math.min(100, Math.round((stats.xp / stats.xpNext) * 100));
  const achTotal = ACHIEVEMENTS.length;
  const achUnlocked = ACHIEVEMENTS.filter((a) => isAchievementUnlocked(a.id)).length;
  const activeIconId =
    stats.unlockedIconVariantIds[stats.unlockedIconVariantIds.length - 1] ?? 'orange';
  const activeIcon = ICON_VARIANTS.find((v) => v.id === activeIconId) ?? ICON_VARIANTS[0];

  const handleClose = () => {
    setView('home');
    onClose();
  };

  return (
    <ModalShell
      open={open}
      onClose={handleClose}
      className="profile-modal profile-modal--large"
      labelledBy="profile-modal-title"
    >
      <div className="modal-head">
        <div>
          <p className="eyebrow">Perfil</p>
          <h2 id="profile-modal-title">
            {view === 'home' ? data.perfil?.nome || userName || 'Meu perfil' : TITLES[view]}
          </h2>
        </div>
        <div className="profile-modal__head-actions">
          {view !== 'home' && (
            <button
              type="button"
              className="secondary compact"
              onClick={() => setView('home')}
              data-sound="click"
            >
              ← Voltar
            </button>
          )}
          <button
            type="button"
            className="secondary compact"
            onClick={handleClose}
            data-sound="close"
          >
            Fechar
          </button>
        </div>
      </div>

      <div className="profile-modal__body">
        {view === 'home' && (
          <ProfileHome
            userName={userName}
            xpPct={xpPct}
            level={stats.level}
            xp={stats.xp}
            xpNext={stats.xpNext}
            activeIcon={activeIcon}
            data={data}
            achUnlocked={achUnlocked}
            achTotal={achTotal}
            onOpenXpInfo={() => setView('xp-info')}
            onOpenIcons={() => setView('icons')}
            onOpenConquistas={() => setView('conquistas')}
          />
        )}
        {view === 'xp-info' && <XpInfoView />}
        {view === 'icons' && (
          <IconsView isIconUnlocked={isIconUnlocked} activeIconId={activeIconId} />
        )}
        {view === 'conquistas' && <ConquistasView isAchievementUnlocked={isAchievementUnlocked} />}
      </div>
    </ModalShell>
  );
}
