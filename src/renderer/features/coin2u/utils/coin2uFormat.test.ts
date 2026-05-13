import { describe, it, expect } from 'vitest';
import { matchesMember, matchesShopItem, itemCategory } from './coin2uFormat';
import type { Coin2uMember, Coin2uShopItem } from '@shared/types';

function member(text: string): Coin2uMember {
  return { Value: 1, Text: text } as Coin2uMember;
}

function shopItem(name: string, desc = '', category?: string): Coin2uShopItem {
  return {
    Name: name,
    Description: desc,
    category: category ? { Decription: category } : undefined,
  } as unknown as Coin2uShopItem;
}

describe('matchesMember', () => {
  it('returns true for empty query', () => expect(matchesMember(member('João'), '')).toBe(true));
  it('matches case-insensitive', () =>
    expect(matchesMember(member('João Silva'), 'silva')).toBe(true));
  it('returns false for no match', () => expect(matchesMember(member('Ana'), 'pedro')).toBe(false));
});

describe('itemCategory', () => {
  it('C&A items map to Lojas virtuais', () =>
    expect(itemCategory(shopItem('C&A Gift Card'))).toBe('Lojas virtuais'));
  it('uses category description when present', () =>
    expect(itemCategory(shopItem('X', '', 'Alimentação'))).toBe('Alimentação'));
  it('falls back to Outros', () =>
    expect(itemCategory(shopItem('Produto sem categoria'))).toBe('Outros'));
});

describe('matchesShopItem', () => {
  it('matches by name', () =>
    expect(matchesShopItem(shopItem('Pizza'), 'pizza', 'all')).toBe(true));
  it('filters by category', () =>
    expect(matchesShopItem(shopItem('X', '', 'Tech'), '', 'Tech')).toBe(true));
  it('excluded by category mismatch', () =>
    expect(matchesShopItem(shopItem('X', '', 'Tech'), '', 'Food')).toBe(false));
});
