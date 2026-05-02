import type { Transaction } from '../domain/types';
import type { CsvExportOptions } from '../pages/pageTypes';

function sanitizeFilenamePart(value: string): string {
  return value.trim().replace(/[\\/:*?"<>|]+/g, '-').replace(/\s+/g, '-').replace(/-+/g, '-');
}

export function getCsvFilename(options: CsvExportOptions, now: Date = new Date()): string {
  const scopePart = options.scope === 'all'
    ? 'all'
    : options.scope === 'category'
      ? `category-${sanitizeFilenamePart(options.category ?? 'all')}`
      : 'month';
  const datePart = now.toISOString().slice(0, 10);
  return `expense-tracker-${scopePart}-${datePart}.csv`;
}

export function filterTransactionsForCsv(txns: Transaction[], month: number, options: CsvExportOptions): Transaction[] {
  if (options.scope === 'all') return txns;
  if (options.scope === 'category') {
    if (!options.category) return [];
    return txns.filter((x) => x.cat === options.category && new Date(x.date).getMonth() === month);
  }
  return txns.filter((x) => new Date(x.date).getMonth() === month);
}

export function buildCsv(txns: Transaction[]): string {
  const rows = [['日期', '時間', '名稱', '分類', '金額'], ...txns.map((x) => [x.date, x.time, x.name, x.cat, String(x.amount)])];
  return `\uFEFF${rows.map((r) => r.map((c) => `"${String(c).replaceAll('"', '""')}"`).join(',')).join('\n')}`;
}
