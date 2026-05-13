import type { Coin2uMember, Coin2uShopItem } from '@shared/types';

export function formatDate(value: string): string {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value || '-';
  return d.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatReal(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function matchesMember(member: Coin2uMember, query: string): boolean {
  if (!query.trim()) return true;
  return member.Text.toLowerCase().includes(query.trim().toLowerCase());
}

export function itemCategory(item: Coin2uShopItem): string {
  if (/^C&A\b/i.test(item.Name.trim())) return 'Lojas virtuais';
  return item.category?.Decription || 'Outros';
}

export function matchesShopItem(item: Coin2uShopItem, query: string, category: string): boolean {
  const q = query.trim().toLowerCase();
  const byCategory = category === 'all' || itemCategory(item) === category;
  if (!q) return byCategory;
  return byCategory && `${item.Name} ${item.Description} ${itemCategory(item)}`.toLowerCase().includes(q);
}
