import { describe, expect, it } from 'vitest';
import { createSyncStatusSummary } from '../utils/syncStatus';

describe('syncStatus helpers', () => {
  it('summarizes device-only storage honestly when cloud sync is off', () => {
    const summary = createSyncStatusSummary({
      localTransactionCount: 3,
      lastCsvExport: null,
      iCloudBackup: false,
      backupStatus: {
        exists: false,
        label: '尚無本機復原點',
        detail: '更新前若需要 migration，系統會先建立本機復原點。',
      },
    });

    expect(summary.headline).toBe('目前資料只儲存在此裝置');
    expect(summary.items.find((item) => item.id === 'local')?.value).toBe('本機交易：3 筆');
    expect(summary.items.find((item) => item.id === 'export')?.tone).toBe('warn');
    expect(summary.copyText).toContain('Cloud sync: 未啟用雲端同步');
    expect(summary.copyText).toContain('no cloud upload');
  });

  it('includes latest CSV export and clarifies iCloud switch is not real upload', () => {
    const summary = createSyncStatusSummary({
      localTransactionCount: 8,
      lastCsvExport: {
        summary: '全部交易 8 筆',
        filename: 'expense-tracker-all-2026-05-10.csv',
        count: 8,
        exportedAt: '2026/05/10 00:30',
      },
      iCloudBackup: true,
      backupStatus: {
        exists: true,
        label: '更新前本機復原點',
        detail: '已保存 v4 → v5 更新前資料。',
      },
    });

    expect(summary.headline).toContain('資料仍只在本機');
    expect(summary.items.find((item) => item.id === 'export')?.value).toBe('最近匯出 8 筆');
    expect(summary.items.find((item) => item.id === 'cloud')?.detail).toContain('不代表資料已經上傳');
    expect(summary.copyText).toContain('expense-tracker-all-2026-05-10.csv');
  });
});
