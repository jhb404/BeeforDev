import type { TeamMember } from '@shared/types/index';
import type { TeamClient } from './ipc/team.client';
import { getError } from '@shared/result';

function asString(v: unknown): string {
  return typeof v === 'string' ? v : v == null ? '' : String(v);
}

function asBool(v: unknown): boolean {
  if (typeof v === 'boolean') return v;
  if (typeof v === 'number') return v !== 0;
  if (typeof v === 'string') return v.toLowerCase() === 'true' || v === '1';
  return false;
}

function asNullableString(v: unknown): string | null {
  if (v == null) return null;
  const s = asString(v).trim();
  return s ? s : null;
}

function normalizeMember(raw: unknown): TeamMember | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  const email = asString(o.email ?? o.Email ?? o.mail ?? '')
    .trim()
    .toLowerCase();
  const nome = asString(o.nome ?? o.Nome ?? o.name ?? '').trim();
  if (!email && !nome) return null;
  const respostas = Array.isArray(o.respostasUltimoChecklist)
    ? (o.respostasUltimoChecklist as unknown[])
        .map((it) => {
          if (!it || typeof it !== 'object') return null;
          const r = it as Record<string, unknown>;
          return {
            titulo: asString(r.titulo ?? r.Titulo ?? r.pergunta ?? ''),
            resposta: asString(r.resposta ?? r.Resposta ?? r.valor ?? ''),
          };
        })
        .filter((x): x is { titulo: string; resposta: string } => !!x)
    : [];
  const idsTimes = Array.isArray(o.idsTimes)
    ? (o.idsTimes as unknown[]).map((id) => asString(id)).filter(Boolean)
    : Array.isArray(o.times)
      ? (o.times as unknown[])
          .map((t) => asString((t as Record<string, unknown>)?.id))
          .filter(Boolean)
      : [];
  return {
    nome,
    foto: asString(o.foto ?? o.Foto ?? o.fotoPerfil ?? ''),
    funcaoPrincipal: asString(o.funcaoPrincipal ?? o.FuncaoPrincipal ?? o.cargo ?? ''),
    email,
    status: asBool(o.status ?? o.Status ?? o.ativo),
    ultimoCliente: asNullableString(o.ultimoCliente ?? o.UltimoCliente),
    ultimoCheckpoint: asNullableString(o.ultimoCheckpoint ?? o.UltimoCheckpoint),
    respostasUltimoChecklist: respostas,
    idsTimes,
  };
}

export async function fetchTeamMembers(
  teamClient: TeamClient,
  filter?: { idTime?: string; idGrupo?: string },
): Promise<TeamMember[]> {
  // Backend filtra por idTime/idGrupo no body e já vem paginado completo do main.
  const res = await teamClient.fetchMembers(filter);
  if (!res.ok) throw new Error(getError(res) || 'Falha ao buscar time.');
  const list = Array.isArray(res.data) ? res.data : [];
  const out: TeamMember[] = [];
  const seen = new Set<string>();
  for (const raw of list) {
    const m = normalizeMember(raw);
    if (!m) continue;
    const key = m.email || m.nome.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(m);
  }
  // Recorte por time via idsTimes de cada pessoa. Defensivo: se NENHUMA pessoa
  // trouxe idsTimes (campo ausente — ex.: main desatualizado), não filtra (mostra
  // todos) em vez de zerar a lista. Grupo não vem por pessoa → não recorta aqui.
  const idTime = filter?.idTime;
  const hasTeamData = out.some((m) => m.idsTimes.length > 0);
  const scoped = idTime && hasTeamData ? out.filter((m) => m.idsTimes.includes(idTime)) : out;
  scoped.sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
  return scoped;
}
