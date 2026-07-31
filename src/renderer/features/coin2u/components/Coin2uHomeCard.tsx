import { useEffect, useState } from 'react';
import type { AppSettings, Coin2uDashboard, Coin2uTransaction } from '@shared/types/index';
import { loadCoin2uCache, saveCoin2uCache, transactionSignature } from '../../../utils/coin2uCache';
import { useIpc } from '../../../services/ipc';
import { getError } from '@shared/result';
import { CoinIcon } from './Coin2uCoinIcon';
import { Coin2uModal } from './Coin2uModal';
import { formatDate, formatReal } from '../utils/coin2uFormat';

const REFRESH_INTERVAL_MS = 5 * 60 * 1000;
const RECENT_LIMIT = 4;

interface Props {
  settings?: AppSettings | null;
}

/**
 * Card de Coin2U pra Home — saldo, cotação, validade e últimos lançamentos.
 * Existe pra preencher a Home de quem não usa TimeSheet Beefor (sem a grade de ponto
 * a tela ficava vazia). Reaproveita o mesmo cache do badge da topbar
 * (`coin2uCache`), então abrir a Home não gera request a mais quando o badge
 * acabou de atualizar.
 */
export function Coin2uHomeCard({ settings }: Props) {
  const { coin2u: coin2uClient } = useIpc();
  const cached = loadCoin2uCache();
  const [dashboard, setDashboard] = useState<Coin2uDashboard | null>(cached.dashboard);
  const [log, setLog] = useState<Coin2uTransaction[]>(cached.log);
  const [loading, setLoading] = useState(false);
  const [errMsg, setErrMsg] = useState<string | null>(null);
  /** null = ainda checando credenciais; false = sem conta configurada. */
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const disabled = settings?.coin2uEnabled === false;

  useEffect(() => {
    if (disabled) {
      setConfigured(false);
      return;
    }
    let timer: ReturnType<typeof setInterval> | null = null;
    let cancelled = false;

    const refresh = async () => {
      setLoading(true);
      setErrMsg(null);
      try {
        const [dashRes, logRes] = await Promise.all([
          coin2uClient.getDashboard(),
          coin2uClient.getLog(),
        ]);
        if (cancelled) return;
        if (!dashRes.ok || !dashRes.data) {
          setErrMsg(getError(dashRes) || 'Falha ao carregar Coin2U.');
          return;
        }
        const nextLog = logRes.ok && logRes.data ? logRes.data.Log : [];
        setDashboard(dashRes.data);
        setLog(nextLog);
        saveCoin2uCache({
          dashboard: dashRes.data,
          log: nextLog,
          updatedAt: new Date().toISOString(),
          lastSeenSignature: transactionSignature(nextLog),
        });
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void (async () => {
      const creds = await coin2uClient.getCreds();
      if (cancelled) return;
      const hasCreds = !!creds?.email;
      setConfigured(hasCreds);
      if (!hasCreds) return;
      void refresh();
      timer = setInterval(() => void refresh(), REFRESH_INTERVAL_MS);
    })();

    return () => {
      cancelled = true;
      if (timer) clearInterval(timer);
    };
  }, [coin2uClient, disabled]);

  // Coin2U desligado no onboarding → o card nem aparece.
  if (disabled) return null;

  const recent = log.slice(0, RECENT_LIMIT);
  const showSkeleton = configured === null || (loading && !dashboard);

  return (
    <>
      <section className="home-card home-card--coin2u">
        <header className="home-card__head">
          <span className="label">Coin2U</span>
          {configured && (
            <button
              type="button"
              className="secondary compact"
              onClick={() => setModalOpen(true)}
              data-sound="coin"
            >
              Abrir
            </button>
          )}
        </header>

        {configured === false ? (
          <div className="home-card__empty">
            <strong>Coin2U não conectado</strong>
            <span>Conecte sua conta para ver saldo, cotação e enviar coins.</span>
            <button
              type="button"
              className="secondary compact"
              onClick={() => setModalOpen(true)}
              data-sound="click"
            >
              Conectar agora
            </button>
          </div>
        ) : showSkeleton ? (
          <p className="home-card__hint">Carregando saldo…</p>
        ) : errMsg ? (
          <div className="home-card__empty">
            <strong>Não deu pra carregar</strong>
            <span>{errMsg}</span>
          </div>
        ) : (
          <div className="home-card__split">
            <div className="coin2u-home__summary">
              <div className="coin2u-home__balances">
                <div className="coin2u-home__balance">
                  <CoinIcon variant="gold" />
                  <strong>{dashboard?.Coins ?? 0}</strong>
                  <span className="label">Minhas coins</span>
                </div>
                <div className="coin2u-home__balance">
                  <CoinIcon variant="purple" />
                  <strong>{dashboard?.ExchangeCoins ?? 0}</strong>
                  <span className="label">Pra doar</span>
                </div>
              </div>
              <div className="coin2u-home__meta">
                <span>
                  Cotação <strong>{formatReal(dashboard?.CurrentQuotation ?? 0)}</strong>
                </span>
                <span>
                  Expira em <strong>{dashboard?.DaysToExpire ?? 0}d</strong>
                </span>
              </div>
            </div>

            {recent.length > 0 ? (
              <ul className="coin2u-home__log">
                {recent.map((t) => (
                  <li key={t.TransactionId}>
                    <span className="coin2u-home__log-amount">{t.Amount}</span>
                    <span className="coin2u-home__log-who">
                      {t.FromName} → {t.ToName}
                    </span>
                    <span className="coin2u-home__log-when">{formatDate(t.Date)}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="home-card__hint">Sem lançamentos recentes.</p>
            )}
          </div>
        )}
      </section>

      <Coin2uModal
        open={modalOpen}
        settings={settings}
        onClose={() => setModalOpen(false)}
        onDataChanged={(nextDashboard, nextLog) => {
          setDashboard(nextDashboard);
          setLog(nextLog);
          if (nextDashboard) setConfigured(true);
        }}
      />
    </>
  );
}
