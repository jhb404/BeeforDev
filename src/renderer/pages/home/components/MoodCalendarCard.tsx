import { useEffect, useMemo, useState } from 'react';
import type { Mood, MoodCalendarDia, MoodCalendarPessoa } from '@shared/types/index';
import { useIpc } from '../../../services/ipc';
import { getError } from '@shared/result';
import {
  CONTEXT_CHANGED_EVENT,
  contextFilter,
  readSelection,
  type Selection,
} from '../../../utils/teamContext';
import { buildNikoGrid, contarDiasMarcados } from '../utils/nikoGrid';

const WEEKDAYS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

const MOOD_EMOJI: Record<Mood, string> = {
  'Dia feliz': '😄',
  'Dia bom': '🙂',
  'Dia não tão bom': '😕',
  'Dia triste': '😢',
};

/** Reusa as classes das células — swatch e célula sempre com a mesma cor. */
const LEGENDA = [
  { classe: 'niko-cell--feliz', texto: 'Feliz' },
  { classe: 'niko-cell--bom', texto: 'Bom' },
  { classe: 'niko-cell--regular', texto: 'Não tão bom' },
  { classe: 'niko-cell--triste', texto: 'Triste' },
  { classe: 'niko-cell--ausencia', texto: 'Ausência' },
  { classe: 'niko-cell--empty', texto: 'Sem registro' },
] as const;

/** Classe do dia: usa o sentimento cru (5 = ausência não tem Mood). */
function diaClass(dia: MoodCalendarDia | undefined): string {
  if (!dia) return 'niko-cell--empty';
  if (dia.ausencia) return 'niko-cell--ausencia';
  switch (dia.sentimento) {
    case 1:
      return 'niko-cell--feliz';
    case 2:
      return 'niko-cell--bom';
    case 3:
      return 'niko-cell--regular';
    case 4:
      return 'niko-cell--triste';
    default:
      return 'niko-cell--empty';
  }
}

function monthLabel(ano: number, mes: number): string {
  return new Date(ano, mes - 1, 1).toLocaleDateString('pt-BR', {
    month: 'long',
    year: 'numeric',
  });
}

/** GUID da API pode vir em caixa diferente da sessão — compara sem caixa. */
function mesmoId(a: string | null | undefined, b: string | null | undefined): boolean {
  return !!a && !!b && a.toLowerCase() === b.toLowerCase();
}

type Alvo = { idTime?: string; idGrupo?: string };

/**
 * Alvos a tentar, em ordem de prioridade:
 *   1. contexto escolhido no OrgSwitcher (time ou grupo);
 *   2. meu time favoritado (`timeFavoritado` do /Token);
 *   3. os outros times de que eu faço parte (`idsTimes`).
 *
 * NÃO usa `/Pessoa/PegarTimesComboBox`: aquele lista os times da organização
 * inteira, então cair no "primeiro time" trazia um time em que eu não estou e o
 * calendário vinha sem a minha linha.
 */
function candidatos(
  selection: Selection,
  sessao: { idsTimes?: string[]; timeFavoritado?: string | null } | null,
): Alvo[] {
  const alvos: Alvo[] = [];
  const vistos = new Set<string>();

  const addTime = (id?: string | null) => {
    if (!id) return;
    const key = id.toLowerCase();
    if (vistos.has(key)) return;
    vistos.add(key);
    alvos.push({ idTime: id });
  };

  const filtro = contextFilter(selection);
  if (filtro.idGrupo) alvos.push({ idGrupo: filtro.idGrupo });
  addTime(filtro.idTime);
  addTime(sessao?.timeFavoritado ?? null);
  for (const id of sessao?.idsTimes ?? []) addTime(id);

  return alvos;
}

interface Props {
  ready: boolean;
  /**
   * Muda quando o mood do dia é marcado/alterado — força recarregar o mês, senão
   * o dia de hoje só apareceria no próximo boot ou ao trocar de mês.
   */
  refreshKey?: string | null;
}

/**
 * Calendário Niko na Home — meu mood dia a dia no mês.
 * Espelha `getCalendarioNiko` do goobeeteams
 * (`/PraticaAgil/PegarCalendarioNiko/{idTime}/{mes}/{ano}`), escolhendo time ou
 * grupo pelo contexto do OrgSwitcher. Ocupa o mesmo formato visual que o
 * calendário de ponto tinha na Home de quem usa TimeSheet.
 */
export function MoodCalendarCard({ ready, refreshKey }: Props) {
  const { mood: moodClient } = useIpc();
  const now = new Date();
  const [ano, setAno] = useState(now.getFullYear());
  const [mes, setMes] = useState(now.getMonth() + 1);
  const [selection, setSelection] = useState<Selection>(() => readSelection());
  const [pessoas, setPessoas] = useState<MoodCalendarPessoa[]>([]);
  const [minhaLinha, setMinhaLinha] = useState<MoodCalendarPessoa | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // OrgSwitcher troca time/grupo sem reload — reage ao evento.
  useEffect(() => {
    const handler = () => setSelection(readSelection());
    window.addEventListener(CONTEXT_CHANGED_EVENT, handler);
    return () => window.removeEventListener(CONTEXT_CHANGED_EVENT, handler);
  }, []);

  useEffect(() => {
    if (!ready) return;
    let cancelled = false;
    setLoading(true);
    setError(null);

    void (async () => {
      try {
        const sessionRes = await (window.beeforHttp?.sessionInfo() ?? Promise.resolve(null));
        if (cancelled) return;
        const sessao = sessionRes?.ok ? sessionRes.data : null;
        const myId = sessao?.idPessoa ?? null;

        const alvos = candidatos(selection, sessao);
        if (alvos.length === 0) {
          setError('Sem time — favorite um time no seletor de organização.');
          return;
        }

        // Tenta os alvos em ordem até achar a MINHA linha: o endpoint só devolve
        // quem está no time, então um time em que eu não estou volta sem mim.
        let ultimaResposta: MoodCalendarPessoa[] = [];
        for (const alvo of alvos) {
          const res = await moodClient.getCalendar({ ...alvo, mes, ano });
          if (cancelled) return;
          if (!res.ok || !res.data) {
            setError(getError(res) || 'Erro ao buscar o calendário de mood.');
            return;
          }
          ultimaResposta = res.data;
          const eu = res.data.find((p) => mesmoId(p.idPessoa, myId));
          if (eu) {
            setPessoas(res.data);
            setMinhaLinha(eu);
            return;
          }
        }

        // Nenhum alvo tinha minha linha — mostra o último para não sumir o card.
        setPessoas(ultimaResposta);
        setMinhaLinha(null);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Erro no calendário.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [ano, mes, moodClient, ready, refreshKey, selection]);

  const grid = useMemo(
    () => buildNikoGrid(ano, mes, minhaLinha?.dias ?? []),
    [ano, mes, minhaLinha],
  );

  const marcados = contarDiasMarcados(minhaLinha?.dias ?? []);

  const shiftMonth = (delta: number) => {
    const next = new Date(ano, mes - 1 + delta, 1);
    setAno(next.getFullYear());
    setMes(next.getMonth() + 1);
  };

  return (
    <section className="home-card home-card--niko">
      <header className="home-card__head">
        <span className="label">Meu mood no mês</span>
        <div className="home-card__actions">
          <button
            type="button"
            className="secondary compact"
            onClick={() => shiftMonth(-1)}
            aria-label="Mês anterior"
            data-sound="click"
          >
            ‹
          </button>
          <span className="niko__month">{monthLabel(ano, mes)}</span>
          <button
            type="button"
            className="secondary compact"
            onClick={() => shiftMonth(1)}
            aria-label="Próximo mês"
            data-sound="click"
          >
            ›
          </button>
        </div>
      </header>

      {loading && !minhaLinha ? (
        <p className="home-card__hint">Carregando calendário…</p>
      ) : error ? (
        <div className="home-card__empty">
          <strong>Não deu pra carregar</strong>
          <span>{error}</span>
        </div>
      ) : (
        <div className="niko-body">
          <div className="niko-grid" role="grid" aria-label={`Mood de ${monthLabel(ano, mes)}`}>
            {WEEKDAYS.map((w, i) => (
              <span key={`wd-${i}`} className="niko-grid__weekday" aria-hidden="true">
                {w}
              </span>
            ))}
            {grid.map((cell, idx) =>
              cell.dia === null ? (
                <span key={`pad-${idx}`} className="niko-cell niko-cell--pad" aria-hidden="true" />
              ) : (
                <span
                  key={cell.dia}
                  className={`niko-cell ${diaClass(cell.info)}`}
                  title={
                    cell.info?.ausencia
                      ? `Dia ${cell.dia}: ausência`
                      : cell.info?.mood
                        ? `Dia ${cell.dia}: ${cell.info.mood}${cell.info.comentario ? ` — ${cell.info.comentario}` : ''}`
                        : `Dia ${cell.dia}: sem mood`
                  }
                >
                  <span className="niko-cell__day">{cell.dia}</span>
                  {cell.info?.mood && (
                    <span className="niko-cell__emoji" aria-hidden="true">
                      {MOOD_EMOJI[cell.info.mood]}
                    </span>
                  )}
                </span>
              ),
            )}
          </div>

          <div className="niko-side">
            <div className="niko-side__stats">
              <div className="niko-side__stat">
                <strong>{marcados}</strong>
                <span className="label">{marcados === 1 ? 'dia marcado' : 'dias marcados'}</span>
              </div>
              <div className="niko-side__stat">
                <strong>{pessoas.length}</strong>
                <span className="label">no time</span>
              </div>
            </div>

            <ul className="niko-legend">
              {LEGENDA.map((item) => (
                <li key={item.classe}>
                  <span className={`niko-legend__swatch ${item.classe}`} aria-hidden="true" />
                  {item.texto}
                </li>
              ))}
            </ul>

            {!minhaLinha && (
              <p className="home-card__hint">
                Você não aparece no calendário deste time/mês. Marque seu mood do dia acima.
              </p>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
