import type { Category, Entry } from './entities';

const HEADER = ['date', 'kind', 'amount', 'category', 'note'] as const;

function escapeCell(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replaceAll('"', '""')}"`;
  }
  return value;
}

/** Produces an RFC 4180 compatible export that spreadsheets open without imports. */
export function entriesToCsv(entries: readonly Entry[], categories: readonly Category[]): string {
  const lookup = new Map(categories.map((category) => [category.id, category]));
  const rows = entries
    .filter((entry) => entry.deletedAt === null)
    .sort((a, b) => a.occurredOn.localeCompare(b.occurredOn))
    .map((entry) => {
      const category = lookup.get(entry.categoryId);
      const amount = (entry.amountCents / 100).toFixed(2);
      return [entry.occurredOn, entry.kind, amount, category?.name ?? 'Uncategorised', entry.note]
        .map((cell) => escapeCell(cell))
        .join(',');
    });

  return [HEADER.join(','), ...rows].join('\n');
}

export function csvFileName(period: string): string {
  return `ledgerflow-${period}.csv`;
}
