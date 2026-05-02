import type { Transaction } from '../domain/types';
import type { CsvExportFeedback, CsvExportOptions } from '../pages/pageTypes';
import { buildCsv, filterTransactionsForCsv, getCsvFilename } from '../utils/csv';

export type CsvExportPayload = CsvExportFeedback & {
  csv: string;
  transactions: Transaction[];
};

export function getCsvExportCategories(txns: Transaction[]): Transaction['cat'][] {
  return [...new Set(txns.map((x) => x.cat))];
}

export function getCsvExportSummary(options: CsvExportOptions, count: number): string {
  if (options.scope === 'all') return `全部交易 ${count} 筆`;
  if (options.scope === 'month') return `當月全部交易 ${count} 筆`;
  return `當月 ${options.category ?? '指定分類'} ${count} 筆`;
}

export function buildCsvExportPayload(
  txns: Transaction[],
  month: number,
  options: CsvExportOptions,
  now: Date = new Date(),
): CsvExportPayload | null {
  const exportedTxns = filterTransactionsForCsv(txns, month, options);
  if (exportedTxns.length === 0) return null;

  const filename = getCsvFilename(options, now);
  return {
    filename,
    count: exportedTxns.length,
    summary: getCsvExportSummary(options, exportedTxns.length),
    exportedAt: now.toLocaleString('zh-TW', { hour12: false }),
    options,
    csv: buildCsv(exportedTxns),
    transactions: exportedTxns,
  };
}

export function downloadCsvFile(csv: string, filename: string) {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

export function toCsvExportFeedback(payload: CsvExportPayload): CsvExportFeedback {
  const { filename, count, summary, exportedAt, options } = payload;
  return { filename, count, summary, exportedAt, options };
}
