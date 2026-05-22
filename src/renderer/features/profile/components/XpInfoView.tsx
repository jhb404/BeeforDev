import { XP_REWARDS, type XpAction } from '../../gamification';

/** Explica como o XP é ganho, listando cada ação e sua recompensa. */
export function XpInfoView() {
  const actions = Object.entries(XP_REWARDS) as Array<[XpAction, (typeof XP_REWARDS)[XpAction]]>;
  return (
    <div className="xp-info">
      <p className="xp-info__intro">
        Cada ação no Beefor te dá <strong>XP</strong>. Ao acumular XP suficiente, você sobe de nível
        e desbloqueia conquistas, temas e variantes de ícone.
      </p>
      <ul className="xp-info__list">
        {actions.map(([action, info]) => (
          <li key={action} className="xp-info__row">
            <span className="xp-info__xp">+{info.xp} XP</span>
            <span className="xp-info__body">
              <strong>{info.label}</strong>
              <small>{info.hint}</small>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
