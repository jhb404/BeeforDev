import { ModalShell } from '../../components/ui/ModalShell';

interface Props {
  open: boolean;
  onClose: () => void;
  userName?: string;
  userEmail?: string;
}

// Mock stats — will come from real data later
const MOCK_STATS = {
  level: 7,
  xp: 1240,
  xpNext: 2000,
  streak: 12,
  totalLancamentos: 87,
  totalKudos: 14,
  coinsGanhos: 3200,
};

const ACHIEVEMENTS = [
  { id: 'first-lancar', icon: '⚡', label: 'Primeiro lançamento', unlocked: true },
  { id: 'mood-week', icon: '😄', label: '7 dias de mood', unlocked: true },
  { id: 'kudo-giver', icon: '🎁', label: 'Enviou 10 kudos', unlocked: true },
  { id: 'streak-month', icon: '🔥', label: '30 dias de streak', unlocked: false },
  { id: 'coin-collector', icon: '💰', label: '5000 coins', unlocked: false },
  { id: 'beefor-master', icon: '🐝', label: 'Beefor Master', unlocked: false },
];

export function ProfileModal({ open, onClose, userName, userEmail }: Props) {
  const xpPct = Math.min(100, Math.round((MOCK_STATS.xp / MOCK_STATS.xpNext) * 100));

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      className="profile-modal"
      labelledBy="profile-modal-title"
    >
      <div className="modal-head">
        <div>
          <p className="eyebrow">Perfil</p>
          <h2 id="profile-modal-title">Meu perfil</h2>
        </div>
        <button type="button" className="secondary compact" onClick={onClose} data-sound="close">
          Fechar
        </button>
      </div>

      <div className="profile-modal__body">
        <div className="profile-modal__header">
          <div className="profile-modal__avatar">
            <span>{(userName ?? 'JB').slice(0, 2).toUpperCase()}</span>
            <div className="profile-modal__level-badge">Lv {MOCK_STATS.level}</div>
          </div>
          <div className="profile-modal__identity">
            <strong className="profile-modal__name">{userName ?? 'Beta Tester'}</strong>
            <span className="profile-modal__email">{userEmail ?? '—'}</span>
          </div>
        </div>

        <div className="profile-modal__xp">
          <div className="profile-modal__xp-info">
            <span>XP</span>
            <span>
              {MOCK_STATS.xp} / {MOCK_STATS.xpNext}
            </span>
          </div>
          <div className="profile-modal__xp-bar">
            <div className="profile-modal__xp-fill" style={{ width: `${xpPct}%` }} />
          </div>
        </div>

        <div className="profile-modal__stats">
          <div className="profile-stat">
            <span className="profile-stat__icon">🔥</span>
            <span className="profile-stat__value">{MOCK_STATS.streak}</span>
            <span className="profile-stat__label">streak</span>
          </div>
          <div className="profile-stat">
            <span className="profile-stat__icon">⚡</span>
            <span className="profile-stat__value">{MOCK_STATS.totalLancamentos}</span>
            <span className="profile-stat__label">lançamentos</span>
          </div>
          <div className="profile-stat">
            <span className="profile-stat__icon">🎁</span>
            <span className="profile-stat__value">{MOCK_STATS.totalKudos}</span>
            <span className="profile-stat__label">kudos enviados</span>
          </div>
          <div className="profile-stat">
            <span className="profile-stat__icon">💰</span>
            <span className="profile-stat__value">{MOCK_STATS.coinsGanhos}</span>
            <span className="profile-stat__label">coins ganhos</span>
          </div>
        </div>

        <div className="profile-modal__achievements">
          <h3 className="profile-modal__section-title">🏆 Conquistas</h3>
          <div className="profile-modal__achievement-grid">
            {ACHIEVEMENTS.map((a) => (
              <div
                key={a.id}
                className={`profile-achievement ${a.unlocked ? '' : 'profile-achievement--locked'}`}
                title={a.label}
              >
                <span className="profile-achievement__icon">{a.icon}</span>
                <span className="profile-achievement__label">{a.label}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="profile-modal__hint">
          💡 Sistema de gamificação em desenvolvimento. Dados reais virão em breve!
        </p>
      </div>
    </ModalShell>
  );
}
