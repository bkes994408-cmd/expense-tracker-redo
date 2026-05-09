import type { MigrationBackupStatus } from '../store/migrationBackupStorage';

type LastCsvExportLike = {
  summary: string;
  filename: string;
  count: number;
  exportedAt: string;
} | null | undefined;

export type SyncStatusTone = 'ok' | 'warn' | 'neutral';

export type SyncStatusItem = {
  id: 'local' | 'export' | 'recovery' | 'cloud';
  label: string;
  value: string;
  detail: string;
  tone: SyncStatusTone;
};

export type SyncStatusSummary = {
  headline: string;
  detail: string;
  items: SyncStatusItem[];
  copyText: string;
};

export function createSyncStatusSummary(input: {
  localTransactionCount: number;
  lastCsvExport?: LastCsvExportLike;
  iCloudBackup: boolean;
  backupStatus: Pick<MigrationBackupStatus, 'exists' | 'label' | 'detail'>;
}): SyncStatusSummary {
  const { localTransactionCount, lastCsvExport, iCloudBackup, backupStatus } = input;
  const cloudValue = iCloudBackup ? '開關已開啟（尚未上傳）' : '未啟用雲端同步';
  const exportValue = lastCsvExport ? `最近匯出 ${lastCsvExport.count} 筆` : '尚未匯出 CSV';
  const exportDetail = lastCsvExport
    ? `${lastCsvExport.summary}｜${lastCsvExport.filename}｜${lastCsvExport.exportedAt}`
    : '建議在上架或換機前先匯出 CSV，作為本機資料的額外安全出口。';

  const items: SyncStatusItem[] = [
    {
      id: 'local',
      label: '本機資料',
      value: `本機交易：${localTransactionCount} 筆`,
      detail: '目前資料只儲存在此裝置；未啟用任何雲端上傳。',
      tone: 'neutral',
    },
    {
      id: 'export',
      label: 'CSV 匯出',
      value: exportValue,
      detail: exportDetail,
      tone: lastCsvExport ? 'ok' : 'warn',
    },
    {
      id: 'recovery',
      label: '本機復原點',
      value: backupStatus.label,
      detail: backupStatus.detail,
      tone: backupStatus.exists ? 'ok' : 'neutral',
    },
    {
      id: 'cloud',
      label: '雲端同步',
      value: cloudValue,
      detail: 'iCloud 備份目前只記錄開關狀態，不代表資料已經上傳或可跨裝置同步。',
      tone: 'warn',
    },
  ];

  const headline = iCloudBackup ? 'iCloud 開關已開啟，但資料仍只在本機' : '目前資料只儲存在此裝置';
  const detail = '這裡集中顯示本機資料、CSV 匯出、本機復原點與雲端同步狀態，避免誤判備份能力。';
  const copyText = [
    'Expense Tracker Redo 同步狀態',
    `Local transactions: ${localTransactionCount}`,
    `CSV export: ${lastCsvExport ? `${lastCsvExport.summary} / ${lastCsvExport.filename} / ${lastCsvExport.exportedAt}` : 'not exported'}`,
    `Recovery point: ${backupStatus.label} — ${backupStatus.detail}`,
    `Cloud sync: ${cloudValue}`,
    'Cloud note: iCloud switch is local status only; no cloud upload or cross-device sync is active.',
  ].join('\n');

  return { headline, detail, items, copyText };
}
