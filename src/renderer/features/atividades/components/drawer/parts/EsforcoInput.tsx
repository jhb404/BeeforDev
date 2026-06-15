/** Input de esforço no formato h:m, serializado como "H:MM". */
export function EsforcoInput({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (v: string | null) => void;
}) {
  const [h, m] = (value ?? '').split(':');
  const horas = h ?? '';
  const minutos = m ?? '';

  const emit = (nh: string, nm: string) => {
    const hh = nh.trim();
    const mm = nm.trim();
    if (!hh && !mm) {
      onChange(null);
      return;
    }
    onChange(`${hh || '0'}:${(mm || '0').padStart(2, '0')}`);
  };

  return (
    <span className="ativ-drawer__esforco">
      <input
        className="ativ-drawer__input ativ-drawer__input--xs"
        type="number"
        min={0}
        max={999}
        placeholder="h"
        value={horas}
        onChange={(e) => emit(e.target.value, minutos)}
      />
      <span>:</span>
      <input
        className="ativ-drawer__input ativ-drawer__input--xs"
        type="number"
        min={0}
        max={59}
        placeholder="m"
        value={minutos}
        onChange={(e) => emit(horas, e.target.value)}
      />
    </span>
  );
}
