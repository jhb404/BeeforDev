import { useState } from 'react';
import type { AppSettings, TrayMenuItem, TrayMenuItemType } from '@shared/types';
import { DEFAULT_TRAY_MENU } from '@shared/types';

interface TrayMenuCardProps {
  settings: AppSettings;
  onUpdate: <K extends keyof AppSettings>(k: K, v: AppSettings[K]) => void;
}

const LABELS: Record<TrayMenuItemType, string> = {
  open: '🪟 Abrir app',
  autoLancamento: '⚡ Auto lançamento',
  mood: '😄 Escolher mood',
  openBeefor: '🌐 Abrir Beefor',
  logout: '🚪 Logout',
  separator: '— Divisor —',
  quit: '❌ Sair',
  lunchTimer: '🍽️ Timer de almoço (1h)',
  sendKudo: '🏆 Enviar KudoCard',
  sendCoins: '🪙 Enviar coins',
};

const AVAILABLE_TYPES: TrayMenuItemType[] = [
  'open',
  'autoLancamento',
  'mood',
  'lunchTimer',
  'sendKudo',
  'sendCoins',
  'openBeefor',
  'logout',
  'separator',
  'quit',
];

let nextId = 1000;
function genId(): string {
  return String(++nextId);
}

export function TrayMenuCard({ settings, onUpdate }: TrayMenuCardProps) {
  const current =
    settings.trayMenu && settings.trayMenu.length > 0 ? settings.trayMenu : DEFAULT_TRAY_MENU;
  const [dragIdx, setDragIdx] = useState<number | null>(null);

  const update = (next: TrayMenuItem[]) => onUpdate('trayMenu', next);

  const move = (from: number, to: number) => {
    if (from === to || from < 0 || to < 0) return;
    const next = [...current];
    const [it] = next.splice(from, 1);
    next.splice(to, 0, it);
    update(next);
  };

  const remove = (idx: number) => update(current.filter((_, i) => i !== idx));

  const add = (type: TrayMenuItemType) => update([...current, { id: genId(), type }]);

  const reset = () => update(DEFAULT_TRAY_MENU);

  return (
    <div className="card">
      <h2>Menu da bandeja (tray)</h2>
      <p className="label" style={{ marginBottom: 10 }}>
        Personalize o menu que abre ao clicar com o botão direito no ícone da bandeja. Arraste para
        reordenar.
      </p>

      <ul className="tray-menu-list">
        {current.map((item, idx) => (
          <li
            key={item.id}
            className={`tray-menu-item ${dragIdx === idx ? 'tray-menu-item--dragging' : ''}`}
            draggable
            onDragStart={() => setDragIdx(idx)}
            onDragEnd={() => setDragIdx(null)}
            onDragOver={(e) => {
              e.preventDefault();
              if (dragIdx !== null && dragIdx !== idx) move(dragIdx, idx);
              setDragIdx(idx);
            }}
          >
            <span className="tray-menu-item__handle" aria-hidden="true">
              ⋮⋮
            </span>
            <span className="tray-menu-item__label">{LABELS[item.type]}</span>
            <button
              type="button"
              className="tray-menu-item__remove"
              onClick={() => remove(idx)}
              aria-label="Remover"
              title="Remover"
              data-sound="close"
            >
              ✕
            </button>
          </li>
        ))}
      </ul>

      <div className="tray-menu-actions">
        <select
          className="tray-menu-add"
          value=""
          onChange={(e) => {
            if (e.target.value) {
              add(e.target.value as TrayMenuItemType);
              e.target.value = '';
            }
          }}
        >
          <option value="">+ Adicionar item...</option>
          {AVAILABLE_TYPES.map((t) => (
            <option key={t} value={t}>
              {LABELS[t]}
            </option>
          ))}
        </select>
        <button type="button" className="secondary compact" onClick={reset} data-sound="click">
          Restaurar padrão
        </button>
      </div>
    </div>
  );
}
