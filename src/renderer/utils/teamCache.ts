import type { TeamMember } from '@shared/types/index';

const MEMBERS_KEY = 'beefor-team-members';
const BIRTHDAY_KEY = 'beefor-team-birthdays';

/** Cache de membros é por contexto (org/time/grupo) — sem sufixo = legado/org-wide. */
function membersKey(contextKey?: string): string {
  return contextKey ? `${MEMBERS_KEY}:${contextKey}` : MEMBERS_KEY;
}

export interface TeamMembersCache {
  members: TeamMember[];
  updatedAt: string;
}

export interface BirthdayEntry {
  birthday?: string;
  nickname?: string;
  notes?: string;
  updatedAt: string;
}

export type TeamBirthdayCache = Record<string, BirthdayEntry>;

export function loadMembersCache(contextKey?: string): TeamMembersCache | null {
  try {
    const raw = window.localStorage.getItem(membersKey(contextKey));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;
    if (!Array.isArray(parsed.members)) return null;
    return parsed as TeamMembersCache;
  } catch {
    return null;
  }
}

export function saveMembersCache(members: TeamMember[], contextKey?: string): void {
  try {
    const payload: TeamMembersCache = {
      members,
      updatedAt: new Date().toISOString(),
    };
    window.localStorage.setItem(membersKey(contextKey), JSON.stringify(payload));
  } catch {
    // storage full / unavailable: ignore
  }
}

export function loadBirthdayCache(): TeamBirthdayCache {
  try {
    const raw = window.localStorage.getItem(BIRTHDAY_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return {};
    return parsed as TeamBirthdayCache;
  } catch {
    return {};
  }
}

export function saveBirthdayCache(cache: TeamBirthdayCache): void {
  try {
    window.localStorage.setItem(BIRTHDAY_KEY, JSON.stringify(cache));
  } catch {
    // ignore
  }
}

export function birthdayKey(member: Pick<TeamMember, 'email' | 'nome'>): string {
  const email = member.email?.trim().toLowerCase();
  if (email) return email;
  return `name:${member.nome.trim().toLowerCase()}`;
}

export function mergeMembers(apiList: TeamMember[], cached: TeamMember[]): TeamMember[] {
  if (apiList.length === 0) return cached;
  return apiList;
}
