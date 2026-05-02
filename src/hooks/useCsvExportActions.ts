import { useState } from 'react';
import type { Transaction } from '../domain/types';
import type { CsvExportFeedback, CsvExportOptions } from '../pages/pageTypes';
import { filterTransactionsForCsv } from '../utils/csv';
import {
  buildCsvExportPayload,
  downloadCsvFile,
  getCsvExportCategories,
  toCsvExportFeedback,
} from '../app/exportActions';

type UseCsvExportActionsArgs = {
  transactions: Transaction[];
  month: number;
  resetAllData: () => void;
  resetRecentUsage: () => void;
  toast: (msg: string, type?: 'ok' | 'warn') => void;
};

export function useCsvExportActions({
  transactions,
  month,
  resetAllData,
  resetRecentUsage,
  toast,
}: UseCsvExportActionsArgs) {
  const [lastCsvExport, setLastCsvExport] = useState<CsvExportFeedback | null>(null);

  function getCsvExportCount(options: CsvExportOptions) {
    return filterTransactionsForCsv(transactions, month, options).length;
  }

  function exportCsv(options: CsvExportOptions) {
    toast('開始準備 CSV 匯出…');
    const payload = buildCsvExportPayload(transactions, month, options);
    if (!payload) {
      toast('此匯出範圍沒有資料', 'warn');
      return;
    }

    downloadCsvFile(payload.csv, payload.filename);
    setLastCsvExport(toCsvExportFeedback(payload));
    toast(`CSV 匯出完成，已觸發下載（${payload.summary}）`);
  }

  function clearAllData() {
    resetAllData();
    resetRecentUsage();
    setLastCsvExport(null);
    toast('已清除所有記帳資料', 'warn');
  }

  return {
    exportCategories: getCsvExportCategories(transactions),
    getCsvExportCount,
    exportCsv,
    lastCsvExport,
    clearAllData,
  };
}
