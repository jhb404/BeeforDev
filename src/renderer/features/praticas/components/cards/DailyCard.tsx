import { useState } from 'react';
import type { CerimoniaInfo } from '@shared/types/index';
import { usePraticaCard } from '../../hooks/usePraticasData';
import { CardShell } from '../CardShell';
import { CardActions } from '../CardActions';
import { ConfigModal } from '../ConfigModal';
import type { CardProps } from './registry';

function hojeISO(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Daily — relógio + dia/onde editáveis + Realizar (real) + Add/Detalhes/Editar (placeholder). */
export function DailyCard({ chave, idTime, nome }: CardProps) {
  const { data, loading, error } = usePraticaCard<CerimoniaInfo>(chave, idTime);
  const [dia, setDia] = useState(hojeISO());
  const [onde, setOnde] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [modal, setModal] = useState<string | null>(null);

  const ondeAtual = onde || data?.onde || '';

  async function realizar() {
    setBusy(true);
    setMsg(null);
    const res = await window.beeforHttp.praticas.realizarDaily(idTime, dia);
    setBusy(false);
    setMsg(res.ok ? 'Daily registrada ✓' : `Falha: ${res.error}`);
  }

  async function salvarConfig() {
    setBusy(true);
    const res = await window.beeforHttp.praticas.configurarDaily({ idTime, onde: ondeAtual });
    setBusy(false);
    setMsg(res.ok ? 'Configuração salva ✓' : `Falha: ${res.error}`);
  }

  return (
    <CardShell
      titulo={nome || 'Daily'}
      temperatura={data?.temperatura}
      loading={loading}
      error={error}
    >
      {data?.legendaPercent && (
        <div className="praticas-cerimonia-relogio">{data.legendaPercent}</div>
      )}

      <label className="praticas-field">
        <span>Dia</span>
        <input type="date" value={dia} onChange={(e) => setDia(e.target.value)} />
      </label>

      <label className="praticas-field">
        <span>Onde?</span>
        <input
          type="text"
          placeholder="ex: LARK, Discord…"
          value={ondeAtual}
          onChange={(e) => setOnde(e.target.value)}
          onBlur={() => ondeAtual !== data?.onde && void salvarConfig()}
        />
      </label>

      <button
        type="button"
        className="praticas-action-btn primary praticas-realizar-btn"
        onClick={realizar}
        disabled={busy}
      >
        {busy ? '…' : 'Realizar Daily ⏱'}
      </button>

      {msg && <p className="praticas-card-sub praticas-msg">{msg}</p>}

      <CardActions
        actions={[
          { label: 'Editar', onClick: () => setModal('Editar configuração da Daily') },
          { label: 'Detalhes', onClick: () => setModal('Histórico de Dailies') },
        ]}
      />

      {modal && <ConfigModal titulo={modal} valor="" onClose={() => setModal(null)} />}
    </CardShell>
  );
}
