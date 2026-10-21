import { Icon, type IconName, palette } from '@ledgerflow/ui';

const CATEGORY_ICONS: Record<string, IconName> = {
  'cat-food': 'utensils',
  'cat-transit': 'bus',
  'cat-grocery': 'shopping-basket',
  'cat-coffee': 'coffee',
  'cat-home': 'house',
  'cat-fun': 'gamepad-2',
  'cat-health': 'pill',
  'cat-other': 'receipt',
  'cat-salary': 'briefcase',
  'cat-gift': 'gift',
};

export function categoryIconName(id: string): IconName {
  return CATEGORY_ICONS[id] ?? 'tag';
}

export function CategoryIcon({ id, size = 16 }: { id: string; size?: number }) {
  return <Icon name={categoryIconName(id)} size={size} color={palette.ink} strokeWidth={2.2} />;
}
