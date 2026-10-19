import type { Category } from './entities';

export type SeedCategory = Omit<Category, 'archivedAt'>;

/** Default palette keeps adjacent categories distinguishable on the cream canvas. */
export const DEFAULT_CATEGORIES: readonly SeedCategory[] = [
  { id: 'cat-food', name: 'Food', emoji: '🍜', color: '#FF7F50', kind: 'expense', sort: 0 },
  { id: 'cat-transit', name: 'Transit', emoji: '🚇', color: '#019B98', kind: 'expense', sort: 1 },
  { id: 'cat-grocery', name: 'Grocery', emoji: '🥬', color: '#4DA3FF', kind: 'expense', sort: 2 },
  { id: 'cat-coffee', name: 'Coffee', emoji: '☕', color: '#B18CFF', kind: 'expense', sort: 3 },
  { id: 'cat-home', name: 'Home', emoji: '🏠', color: '#FFD700', kind: 'expense', sort: 4 },
  { id: 'cat-fun', name: 'Fun', emoji: '🎮', color: '#FF8FB1', kind: 'expense', sort: 5 },
  { id: 'cat-health', name: 'Health', emoji: '💊', color: '#7ED957', kind: 'expense', sort: 6 },
  { id: 'cat-other', name: 'Other', emoji: '🧾', color: '#8A7361', kind: 'expense', sort: 7 },
  { id: 'cat-salary', name: 'Salary', emoji: '💼', color: '#019B98', kind: 'income', sort: 8 },
  { id: 'cat-gift', name: 'Gift', emoji: '🎁', color: '#FF7F50', kind: 'income', sort: 9 },
];
