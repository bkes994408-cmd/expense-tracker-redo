export type UpdateLevel = 'current' | 'optional' | 'recommended' | 'required';

export type ReleaseNote = {
  version: string;
  date: string;
  level: Exclude<UpdateLevel, 'current'>;
  highlights: string[];
  fixes: string[];
  migrationNote?: string;
};

export type VersionInfo = {
  appVersion: string;
  buildNumber: string;
  schemaVersion: number;
  releaseChannel: 'Internal' | 'TestFlight' | 'Production';
  lastDataUpdateLabel: string;
};

export type StoreTarget = 'appStore' | 'playStore';

export type StoreLink = {
  target: StoreTarget;
  label: string;
  status: 'placeholder' | 'ready';
  url?: string;
};

export type UpdatePolicy = {
  level: UpdateLevel;
  title: string;
  primaryAction: string;
  secondaryAction?: string;
  canPostpone: boolean;
  canUseCoreApp: boolean;
  mustKeepExportAvailable: boolean;
  message: string;
};

export const DATA_SCHEMA_VERSION = 5;

export const STORE_LINKS: StoreLink[] = [
  { target: 'appStore', label: 'App Store', status: 'placeholder' },
  { target: 'playStore', label: 'Play Store', status: 'placeholder' },
];

export const RELEASE_NOTES: ReleaseNote[] = [
  {
    version: '1.0.0',
    date: '2026-05-08',
    level: 'optional',
    highlights: ['版本資訊中心', '更新內容檢視', '本機資料 schema 顯示'],
    fixes: ['明確標示 iCloud 備份尚未啟用雲端上傳', '保留資料匯出作為更新前安全出口'],
    migrationNote: '目前 schema v5，既有 demo seed migration 與 originalCurrency fallback 已納入基準。',
  },
  {
    version: '0.9.0',
    date: '2026-04-24',
    level: 'recommended',
    highlights: ['顯示層多幣別 baseline', 'Recurring confirm 批次處理', 'Reports 決策摘要快捷導流'],
    fixes: ['強化 CSV 匯出摘要', '補齊跨頁整合測試與 Playwright smoke'],
  },
  {
    version: '0.8.0',
    date: '2026-04-21',
    level: 'optional',
    highlights: ['版本管理 baseline', 'Android/iOS build number 同步', 'Release check 流程整理'],
    fixes: ['文件入口與上架前 runbook 收斂'],
  },
];

export function getAppVersion(): string {
  return import.meta.env.VITE_APP_VERSION || '1.0.0';
}

export function getBuildNumber(): string {
  return import.meta.env.VITE_BUILD_NUMBER || '2';
}

export function getReleaseChannel(): VersionInfo['releaseChannel'] {
  const channel = import.meta.env.VITE_RELEASE_CHANNEL;
  if (channel === 'Production' || channel === 'TestFlight' || channel === 'Internal') return channel;
  return 'Internal';
}

export function createVersionInfo(lastDataUpdate?: Date): VersionInfo {
  return {
    appVersion: getAppVersion(),
    buildNumber: getBuildNumber(),
    schemaVersion: DATA_SCHEMA_VERSION,
    releaseChannel: getReleaseChannel(),
    lastDataUpdateLabel: lastDataUpdate ? formatDataUpdateTime(lastDataUpdate) : '本機資料會在交易、預算或設定變更後更新',
  };
}

export function formatDataUpdateTime(date: Date): string {
  if (Number.isNaN(date.getTime())) return '尚無可用時間';
  return date.toLocaleString('zh-TW', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function compareSemverLike(a: string, b: string): number {
  const parse = (value: string) => value.split(/[.-]/).map((part) => Number.parseInt(part, 10)).map((part) => (Number.isFinite(part) ? part : 0));
  const left = parse(a);
  const right = parse(b);
  const length = Math.max(left.length, right.length);

  for (let index = 0; index < length; index += 1) {
    const diff = (left[index] ?? 0) - (right[index] ?? 0);
    if (diff !== 0) return diff > 0 ? 1 : -1;
  }

  return 0;
}

export function getUpdateStatus(versionInfo: Pick<VersionInfo, 'appVersion'>, latest = RELEASE_NOTES[0]): { level: UpdateLevel; label: string; detail: string } {
  if (!latest || compareSemverLike(versionInfo.appVersion, latest.version) >= 0) {
    return { level: 'current', label: '已是目前版本', detail: '目前沒有需要安裝的更新。' };
  }

  const label = latest.level === 'required'
    ? '需要更新'
    : latest.level === 'recommended'
      ? '建議更新'
      : '可選更新';

  return {
    level: latest.level,
    label,
    detail: `目前版本 ${versionInfo.appVersion}，最新版本 ${latest.version}。`,
  };
}

export function getUpdatePolicy(level: UpdateLevel): UpdatePolicy {
  if (level === 'required') {
    return {
      level,
      title: '必要更新',
      primaryAction: '前往商店更新',
      secondaryAction: '匯出資料',
      canPostpone: false,
      canUseCoreApp: false,
      mustKeepExportAvailable: true,
      message: '此版本可能涉及安全或資料相容性問題。主要操作應暫停，但必須保留匯出資料能力。',
    };
  }

  if (level === 'recommended') {
    return {
      level,
      title: '建議更新',
      primaryAction: '查看更新方式',
      secondaryAction: '稍後提醒',
      canPostpone: true,
      canUseCoreApp: true,
      mustKeepExportAvailable: true,
      message: '此更新改善穩定性或重要體驗。使用者可以稍後處理，但應看得到明確提醒。',
    };
  }

  if (level === 'optional') {
    return {
      level,
      title: '可選更新',
      primaryAction: '查看更新內容',
      secondaryAction: '略過',
      canPostpone: true,
      canUseCoreApp: true,
      mustKeepExportAvailable: true,
      message: '此更新屬於一般功能或體驗改善，不應打斷使用者流程。',
    };
  }

  return {
    level,
    title: '目前已是最新版本',
    primaryAction: '知道了',
    canPostpone: true,
    canUseCoreApp: true,
    mustKeepExportAvailable: true,
    message: '目前沒有需要安裝的更新。',
  };
}

export function getStoreAvailabilitySummary(storeLinks = STORE_LINKS): string {
  const ready = storeLinks.filter((link) => link.status === 'ready');
  if (ready.length === 0) return '商店連結會在正式上架後啟用，目前不會假裝可直接更新。';
  return `已啟用 ${ready.map((link) => link.label).join(' / ')} 更新連結。`;
}

export function createLocalBackupSummary(versionInfo: VersionInfo): string {
  return `更新前會建立本機復原點：app ${versionInfo.appVersion} / build ${versionInfo.buildNumber} / schema v${versionInfo.schemaVersion}`;
}
