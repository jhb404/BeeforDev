import { ACHIEVEMENTS } from '../../gamification';

interface Props {
  isAchievementUnlocked: (id: string) => boolean;
}

/** Grade de conquistas, com itens bloqueados em cinza. */
export function ConquistasView({ isAchievementUnlocked }: Props) {
  return (
    <div className="profile-modal__achievement-grid">
      {ACHIEVEMENTS.map((a) => {
        const unlocked = isAchievementUnlocked(a.id);
        return (
          <div
            key={a.id}
            className={`profile-achievement ${unlocked ? '' : 'profile-achievement--locked'}`}
            title={a.description}
          >
            <span className="profile-achievement__icon">{a.icon}</span>
            <span className="profile-achievement__label">{a.label}</span>
            {!unlocked && (
              <span className="profile-achievement__lock" aria-hidden="true">
                🔒
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
