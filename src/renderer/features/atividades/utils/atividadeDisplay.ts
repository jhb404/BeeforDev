export const TIPO_LABEL: Record<number, string> = {
  0: 'Outro',
  1: 'Tarefa',
  2: 'Bug',
  3: 'História',
  4: 'Epic',
  5: 'Melhoria',
  6: 'Suporte',
};

export const TIPO_ICON: Record<number, string> = {
  0: '📌',
  1: '✅',
  2: '🐛',
  3: '📖',
  4: '🗂️',
  5: '⬆️',
  6: '🎧',
};

const FIBONACCI = [1, 2, 3, 5, 8, 13, 20, 40, 100];

export function getMomentoClass(momento: string): string {
  const m = momento.toLowerCase();
  if (m.includes('backlog')) return 'momento--backlog';
  if (m.includes('andamento') || m.includes('progress')) return 'momento--progress';
  if (m.includes('conclu') || m.includes('done')) return 'momento--done';
  if (m.includes('fazer') || m.includes('to do') || m.includes('todo')) return 'momento--todo';
  return 'momento--default';
}

export function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export function formatDateLong(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

export function formatEsforco(horas: number | null): string | null {
  if (horas == null) return null;
  const h = Math.floor(horas);
  const m = Math.round((horas - h) * 60);
  if (h === 0) return `${m}min`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}min`;
}

export function fibLabel(n: number): string {
  if (FIBONACCI.includes(n)) return String(n);
  return `${n} (custom)`;
}
