import { useTranslation } from 'react-i18next';
import type { TodayAlert } from '@shared/types';

interface BellPanelProps {
  alerts: TodayAlert[];
  visibleAlerts: TodayAlert[];
  onDismiss: (index: number) => void;
  onSnooze: (index: number, minutes: number) => void;
  onOpenTeam: () => void;
  onGoToHome: () => void;
}

export function BellPanel({
  alerts,
  visibleAlerts,
  onDismiss,
  onSnooze,
  onOpenTeam,
  onGoToHome,
}: BellPanelProps) {
  const { t } = useTranslation();
  return (
    <div className="bell-panel" role="dialog" aria-label={t('alerts.header')}>
      <div className="bell-panel__header">{t('alerts.header')}</div>
      {visibleAlerts.length === 0 ? (
        <p className="bell-panel__empty">{t('alerts.empty')}</p>
      ) : (
        <ul className="bell-panel__list">
          {visibleAlerts.map((a, i) => {
            const realIdx = alerts.indexOf(a);
            return (
              <li key={i} className={`bell-item bell-item--${a.kind}`}>
                <div className="bell-item__main">
                  <span className="bell-item__title">{a.title}</span>
                  <span className="bell-item__meta">
                    {a.time && <span className="bell-item__time">{a.time}</span>}
                    <span className="bell-item__body">{a.body}</span>
                  </span>
                </div>
                <div className="bell-item__actions">
                  {a.kind !== 'birthday' && (
                    <>
                      <button
                        className="bell-action bell-action--snooze"
                        title="Adiar 5 min"
                        onClick={() => onSnooze(realIdx, 5)}
                      >
                        +5m
                      </button>
                      <button
                        className="bell-action bell-action--snooze"
                        title="Adiar 10 min"
                        onClick={() => onSnooze(realIdx, 10)}
                      >
                        +10m
                      </button>
                      <button
                        className="bell-action bell-action--snooze"
                        title="Adiar 15 min"
                        onClick={() => onSnooze(realIdx, 15)}
                      >
                        +15m
                      </button>
                    </>
                  )}
                  {a.kind === 'birthday' && (
                    <button className="bell-action bell-action--primary" onClick={onOpenTeam}>
                      Ver time
                    </button>
                  )}
                  {a.kind === 'mood' && (
                    <button className="bell-action bell-action--primary" onClick={onGoToHome}>
                      Marcar agora
                    </button>
                  )}
                  <button
                    className="bell-action bell-action--dismiss"
                    aria-label="Dispensar"
                    onClick={() => onDismiss(realIdx)}
                  >
                    ✕
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
