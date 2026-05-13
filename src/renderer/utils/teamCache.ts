import type { TeamMember } from '@shared/types';

const MEMBERS_KEY = 'beefor-team-members';
const BIRTHDAY_KEY = 'beefor-team-birthdays';

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

export function loadMembersCache(): TeamMembersCache | null {
  try {
    const raw = window.localStorage.getItem(MEMBERS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;
    if (!Array.isArray(parsed.members)) return null;
    return parsed as TeamMembersCache;
  } catch {
    return null;
  }
}

export function saveMembersCache(members: TeamMember[]): void {
  try {
    const payload: TeamMembersCache = {
      members,
      updatedAt: new Date().toISOString(),
    };
    window.localStorage.setItem(MEMBERS_KEY, JSON.stringify(payload));
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

export function mergeMembers(
  apiList: TeamMember[],
  cached: TeamMember[],
): TeamMember[] {
  if (apiList.length === 0) return cached;
  return apiList;
}
