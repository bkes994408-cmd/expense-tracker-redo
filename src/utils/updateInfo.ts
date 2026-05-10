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

export type UpdateManifestSource = {
  status: 'placeholder' | 'ready';
  envKey: 'VITE_UPDATE_MANIFEST_URL';
  url?: string;
};

export type RemoteUpdateManifest = {
  latestVersion: string;
  minimumSupportedVersion?: string;
  level?: Exclude<UpdateLevel, 'current'>;
  message?: string;
};

export type UpdateStatusSummary = { level: UpdateLevel; label: string; detail: string };

export type UpdateManifestFetchResult = {
  status: 'not-configured' | 'success' | 'error';
  source: UpdateManifestSource;
  updateStatus: UpdateStatusSummary;
  summary: string;
  manifest?: RemoteUpdateManifest;
  errorMessage?: string;
};

export type UpdateManifestFetcher = (url: string, init?: RequestInit) => Promise<{
  ok: boolean;
  status: number;
  statusText?: string;
  json: () => Promise<unknown>;
}>;

export type StoreVersionQueryFetcher = UpdateManifestFetcher;

export type StoreLink = {
  target: StoreTarget;
  label: string;
  status: 'placeholder' | 'ready';
  url?: string;
  envKey: string;
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

export type StoreVersionQueryResult = {
  source: StoreTarget | 'manifest' | 'local';
  status: 'not-configured' | 'success' | 'error';
  latestVersion?: string;
  minimumSupportedVersion?: string;
  level?: Exclude<UpdateLevel, 'current'>;
  summary: string;
  errorMessage?: string;
};

export type StoreVersionQueryPlan = {
  order: Array<StoreTarget | 'manifest' | 'local'>;
  primarySource: StoreTarget | 'manifest' | 'local';
  summary: string;
};

export type StoreVersionQueryRun = {
  result: StoreVersionQueryResult;
  attempts: StoreVersionQueryResult[];
};

export type StoreVersionQueryPreflightCheck = { label: string; status: 'ready' | 'missing'; detail: string };

export type StoreVersionQueryPreflight = {
  status: 'ready' | 'partial' | 'blocked';
  summary: string;
  checks: StoreVersionQueryPreflightCheck[];
};

export type UpdateDiagnosticsInput = {
  versionInfo: VersionInfo;
  updateStatus: UpdateStatusSummary;
  updatePolicy: UpdatePolicy;
  storeSummary: string;
  updateManifestSummary?: string;
  storeVersionQueryPreflight?: StoreVersionQueryPreflight;
  storeVersionQueryPlan?: StoreVersionQueryPlan;
  storeVersionQueryRun?: StoreVersionQueryRun;
  backupStatusLabel: string;
  backupStatusDetail: string;
  categoryRuleVersion: string;
  noteSuggestionRuleVersion: string;
};

export type RequiredUpdateProtectionSummary = {
  active: boolean;
  title: string;
  message: string;
  allowedActions: string[];
  blockedActions: string[];
  copyText: string;
};

export type UpdateReminderPreference = {
  action: 'skip-version' | 'remind-later';
  version: string;
  updatedAt: string;
  remindAfter?: string;
};

export type UpdateReminderBadge = {
  label: string;
  detail: string;
  tone: 'neutral' | 'accent' | 'warn';
};

export const DATA_SCHEMA_VERSION = 5;
export const UPDATE_MANIFEST_ENV_KEY = 'VITE_UPDATE_MANIFEST_URL' as const;

export type StoreLinkEnv = Partial<Record<string, string | undefined>>;

export const STORE_LINK_CONFIG: Array<Pick<StoreLink, 'target' | 'label' | 'envKey'>> = [
  { target: 'appStore', label: 'App Store', envKey: 'VITE_APP_STORE_URL' },
  { target: 'playStore', label: 'Play Store', envKey: 'VITE_PLAY_STORE_URL' },
];

export function normalizeHttpsUrl(rawUrl: string | undefined): string | undefined {
  const value = rawUrl?.trim();
  if (!value) return undefined;

  try {
    const parsed = new URL(value);
    if (parsed.protocol !== 'https:') return undefined;
    return parsed.toString();
  } catch {
    return undefined;
  }
}

export function normalizeStoreUrl(rawUrl: string | undefined): string | undefined {
  return normalizeHttpsUrl(rawUrl);
}

export function normalizeUpdateManifestUrl(rawUrl: string | undefined): string | undefined {
  return normalizeHttpsUrl(rawUrl);
}

export function createStoreLinks(env: StoreLinkEnv = import.meta.env as unknown as StoreLinkEnv): StoreLink[] {
  return STORE_LINK_CONFIG.map((config) => {
    const url = normalizeStoreUrl(env[config.envKey]);
    return {
      ...config,
      status: url ? 'ready' : 'placeholder',
      url,
    };
  });
}

export const STORE_LINKS: StoreLink[] = createStoreLinks();

export function createUpdateManifestSource(env: StoreLinkEnv = import.meta.env as unknown as StoreLinkEnv): UpdateManifestSource {
  const url = normalizeUpdateManifestUrl(env[UPDATE_MANIFEST_ENV_KEY]);
  return {
    status: url ? 'ready' : 'placeholder',
    envKey: UPDATE_MANIFEST_ENV_KEY,
    url,
  };
}

export function getUpdateManifestAvailabilitySummary(source = createUpdateManifestSource()): string {
  if (source.status === 'ready') return `遠端版本 manifest 已設定：${source.envKey}`;
  return `遠端版本 manifest 尚未設定（${source.envKey}），目前使用本機 release notes 判定。`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function isRemoteUpdateLevel(value: unknown): value is Exclude<UpdateLevel, 'current'> {
  return value === 'optional' || value === 'recommended' || value === 'required';
}

export function parseRemoteUpdateManifest(value: unknown): RemoteUpdateManifest | undefined {
  if (!isRecord(value) || !isNonEmptyString(value.latestVersion)) return undefined;

  const manifest: RemoteUpdateManifest = {
    latestVersion: value.latestVersion.trim(),
  };

  if (value.minimumSupportedVersion !== undefined) {
    if (!isNonEmptyString(value.minimumSupportedVersion)) return undefined;
    manifest.minimumSupportedVersion = value.minimumSupportedVersion.trim();
  }

  if (value.level !== undefined) {
    if (!isRemoteUpdateLevel(value.level)) return undefined;
    manifest.level = value.level;
  }

  if (value.message !== undefined) {
    if (!isNonEmptyString(value.message)) return undefined;
    manifest.message = value.message.trim();
  }

  return manifest;
}

export function parseStoreVersionQueryResult(source: StoreTarget, value: unknown): StoreVersionQueryResult | undefined {
  if (!isRecord(value) || !isNonEmptyString(value.latestVersion)) return undefined;

  const result: StoreVersionQueryResult = {
    source,
    status: 'success',
    latestVersion: value.latestVersion.trim(),
    summary: `${source === 'appStore' ? 'App Store' : 'Play Store'} 查詢成功：最新版本 ${value.latestVersion.trim()}。`,
  };

  if (value.minimumSupportedVersion !== undefined) {
    if (!isNonEmptyString(value.minimumSupportedVersion)) return undefined;
    result.minimumSupportedVersion = value.minimumSupportedVersion.trim();
  }

  if (value.level !== undefined) {
    if (!isRemoteUpdateLevel(value.level)) return undefined;
    result.level = value.level;
  }

  return result;
}

export function createStoreVersionQueryPlan(source = createUpdateManifestSource(), storeLinks = STORE_LINKS): StoreVersionQueryPlan {
  const readyStoreSources = storeLinks.filter((link) => link.status === 'ready' && link.url).map((link) => link.target);
  const order: StoreVersionQueryPlan['order'] = [
    ...readyStoreSources,
    ...(source.status === 'ready' ? ['manifest' as const] : []),
    'local',
  ];
  const primarySource = order[0] ?? 'local';
  const summary = primarySource === 'local'
    ? '目前沒有可用的正式商店查詢來源，會使用本機 release notes。'
    : primarySource === 'manifest'
      ? '正式商店查詢尚未就緒，會先使用遠端 manifest，再回落本機 release notes。'
      : `正式商店查詢優先使用 ${primarySource === 'appStore' ? 'App Store' : 'Play Store'}，失敗後依序回落遠端 manifest / 本機 release notes。`;

  return { order, primarySource, summary };
}

export function createStoreVersionQueryFallbackSummary(plan: StoreVersionQueryPlan): string {
  const labels: Record<StoreVersionQueryPlan['order'][number], string> = {
    appStore: 'App Store',
    playStore: 'Play Store',
    manifest: '遠端 manifest',
    local: '本機 release notes',
  };
  return `版本查詢優先序：${plan.order.map((source) => labels[source]).join(' → ')}。`;
}

export function createStoreVersionQueryAttemptSummary(run: StoreVersionQueryRun): string {
  const labels: Record<StoreVersionQueryResult['source'], string> = {
    appStore: 'App Store',
    playStore: 'Play Store',
    manifest: '遠端 manifest',
    local: '本機 release notes',
  };
  const attemptText = run.attempts.map((attempt) => `${labels[attempt.source]}=${attempt.status}`).join(' → ');
  return `版本查詢結果：${labels[run.result.source]} / ${run.result.status}。Attempts：${attemptText}。`;
}

function getStoreSourceLabel(source: StoreTarget): string {
  return source === 'appStore' ? 'App Store' : 'Play Store';
}

export async function fetchStoreVersionQuery(
  storeLink: StoreLink | undefined,
  options: { fetcher?: StoreVersionQueryFetcher; timeoutMs?: number } = {},
): Promise<StoreVersionQueryResult> {
  if (!storeLink || storeLink.status !== 'ready' || !storeLink.url) {
    return {
      source: storeLink?.target ?? 'local',
      status: 'not-configured',
      summary: `${storeLink?.label ?? '商店'} 查詢尚未設定。`,
    };
  }

  const timeoutMs = options.timeoutMs ?? 4000;
  const fetcher = options.fetcher ?? globalThis.fetch?.bind(globalThis);
  const label = getStoreSourceLabel(storeLink.target);
  if (!fetcher) {
    return { source: storeLink.target, status: 'error', summary: `${label} 查詢失敗。`, errorMessage: '目前環境沒有 fetch API。' };
  }

  const controller = typeof AbortController !== 'undefined' ? new AbortController() : undefined;
  const timeoutId = controller && timeoutMs > 0 ? globalThis.setTimeout(() => controller.abort(), timeoutMs) : undefined;

  try {
    const response = await fetcher(storeLink.url, {
      signal: controller?.signal,
      headers: { Accept: 'application/json' },
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}${response.statusText ? ` ${response.statusText}` : ''}`);
    const parsed = parseStoreVersionQueryResult(storeLink.target, await response.json());
    if (!parsed) throw new Error('store version query 格式不正確');
    return parsed;
  } catch (error) {
    return {
      source: storeLink.target,
      status: 'error',
      summary: `${label} 查詢失敗，將依 fallback 優先序往下查詢。`,
      errorMessage: getFetchErrorMessage(error, timeoutMs),
    };
  } finally {
    if (timeoutId !== undefined) globalThis.clearTimeout(timeoutId);
  }
}

function createManifestStoreVersionResult(result: UpdateManifestFetchResult): StoreVersionQueryResult {
  if (result.status === 'success' && result.manifest) {
    return {
      source: 'manifest',
      status: 'success',
      latestVersion: result.manifest.latestVersion,
      minimumSupportedVersion: result.manifest.minimumSupportedVersion,
      level: result.manifest.level,
      summary: `遠端 manifest fallback 成功：最新版本 ${result.manifest.latestVersion}。`,
    };
  }

  return {
    source: 'manifest',
    status: result.status === 'not-configured' ? 'not-configured' : 'error',
    summary: result.summary,
    errorMessage: result.errorMessage,
  };
}

function createLocalStoreVersionResult(latest = RELEASE_NOTES[0]): StoreVersionQueryResult {
  return {
    source: 'local',
    status: 'success',
    latestVersion: latest?.version,
    level: latest?.level,
    summary: `已回落本機 release notes：最新版本 ${latest?.version ?? '未知'}。`,
  };
}

export async function fetchStoreVersionQueryPlan(
  plan: StoreVersionQueryPlan,
  storeLinks = STORE_LINKS,
  options: { fetcher?: StoreVersionQueryFetcher; manifestResult?: UpdateManifestFetchResult; timeoutMs?: number } = {},
): Promise<StoreVersionQueryRun> {
  const attempts: StoreVersionQueryResult[] = [];

  for (const source of plan.order) {
    if (source === 'local') {
      const result = createLocalStoreVersionResult();
      attempts.push(result);
      return { result, attempts };
    }

    if (source === 'manifest') {
      const result = options.manifestResult ? createManifestStoreVersionResult(options.manifestResult) : { source: 'manifest' as const, status: 'not-configured' as const, summary: '遠端 manifest 尚未執行，略過至本機 release notes。' };
      attempts.push(result);
      if (result.status === 'success') return { result, attempts };
      continue;
    }

    const result = await fetchStoreVersionQuery(storeLinks.find((link) => link.target === source), options);
    attempts.push(result);
    if (result.status === 'success') return { result, attempts };
  }

  const result = createLocalStoreVersionResult();
  attempts.push(result);
  return { result, attempts };
}

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

function getUpdateLabel(level: Exclude<UpdateLevel, 'current'>): string {
  return level === 'required'
    ? '需要更新'
    : level === 'recommended'
      ? '建議更新'
      : '可選更新';
}

export function getUpdateStatus(versionInfo: Pick<VersionInfo, 'appVersion'>, latest = RELEASE_NOTES[0]): UpdateStatusSummary {
  if (!latest || compareSemverLike(versionInfo.appVersion, latest.version) >= 0) {
    return { level: 'current', label: '已是目前版本', detail: '目前沒有需要安裝的更新。' };
  }

  return {
    level: latest.level,
    label: getUpdateLabel(latest.level),
    detail: `目前版本 ${versionInfo.appVersion}，最新版本 ${latest.version}。`,
  };
}

export function getManifestUpdateStatus(versionInfo: Pick<VersionInfo, 'appVersion'>, manifest?: RemoteUpdateManifest): UpdateStatusSummary {
  if (!manifest) return getUpdateStatus(versionInfo);

  if (manifest.minimumSupportedVersion && compareSemverLike(versionInfo.appVersion, manifest.minimumSupportedVersion) < 0) {
    return {
      level: 'required',
      label: getUpdateLabel('required'),
      detail: `目前版本 ${versionInfo.appVersion} 低於最低支援版本 ${manifest.minimumSupportedVersion}。${manifest.message ? ` ${manifest.message}` : ''}`,
    };
  }

  if (compareSemverLike(versionInfo.appVersion, manifest.latestVersion) < 0) {
    const level = manifest.level ?? 'recommended';
    return {
      level,
      label: getUpdateLabel(level),
      detail: `目前版本 ${versionInfo.appVersion}，遠端最新版本 ${manifest.latestVersion}。${manifest.message ? ` ${manifest.message}` : ''}`,
    };
  }

  return { level: 'current', label: '已是目前版本', detail: `目前版本 ${versionInfo.appVersion} 已符合遠端最新版本 ${manifest.latestVersion}。` };
}

function getFetchErrorMessage(error: unknown, timeoutMs: number): string {
  if (isRecord(error) && error.name === 'AbortError') return `查詢逾時（${timeoutMs}ms）`;
  if (error instanceof Error && error.message) return error.message;
  return '未知錯誤';
}

export async function fetchRemoteUpdateManifest(
  source: UpdateManifestSource,
  versionInfo: Pick<VersionInfo, 'appVersion'>,
  options: { fetcher?: UpdateManifestFetcher; timeoutMs?: number } = {},
): Promise<UpdateManifestFetchResult> {
  const localStatus = getUpdateStatus(versionInfo);

  if (source.status !== 'ready' || !source.url) {
    return {
      status: 'not-configured',
      source,
      updateStatus: localStatus,
      summary: getUpdateManifestAvailabilitySummary(source),
    };
  }

  const timeoutMs = options.timeoutMs ?? 4000;
  const fetcher = options.fetcher ?? globalThis.fetch?.bind(globalThis);
  if (!fetcher) {
    return {
      status: 'error',
      source,
      updateStatus: localStatus,
      summary: '遠端版本 manifest 查詢失敗，已回落本機 release notes。',
      errorMessage: '目前環境沒有 fetch API。',
    };
  }

  const controller = typeof AbortController !== 'undefined' ? new AbortController() : undefined;
  const timeoutId = controller && timeoutMs > 0 ? globalThis.setTimeout(() => controller.abort(), timeoutMs) : undefined;

  try {
    const response = await fetcher(source.url, {
      signal: controller?.signal,
      headers: { Accept: 'application/json' },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}${response.statusText ? ` ${response.statusText}` : ''}`);
    }

    const payload = await response.json();
    const manifest = parseRemoteUpdateManifest(payload);
    if (!manifest) throw new Error('manifest 格式不正確');

    const updateStatus = getManifestUpdateStatus(versionInfo, manifest);
    const minimumText = manifest.minimumSupportedVersion ? `，最低支援版本 ${manifest.minimumSupportedVersion}` : '';
    return {
      status: 'success',
      source,
      manifest,
      updateStatus,
      summary: `遠端版本 manifest 查詢成功：最新版本 ${manifest.latestVersion}${minimumText}。`,
    };
  } catch (error) {
    return {
      status: 'error',
      source,
      updateStatus: localStatus,
      summary: '遠端版本 manifest 查詢失敗，已回落本機 release notes。',
      errorMessage: getFetchErrorMessage(error, timeoutMs),
    };
  } finally {
    if (timeoutId !== undefined) globalThis.clearTimeout(timeoutId);
  }
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

export function createUpdateReminderPreference(policy: UpdatePolicy, version: string, now = new Date()): UpdateReminderPreference | undefined {
  if (!version || policy.level === 'current' || policy.level === 'required') return undefined;

  if (policy.level === 'recommended') {
    return {
      action: 'remind-later',
      version,
      updatedAt: now.toISOString(),
      remindAfter: new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString(),
    };
  }

  return {
    action: 'skip-version',
    version,
    updatedAt: now.toISOString(),
  };
}

export function getUpdateReminderPreferenceSummary(preference: UpdateReminderPreference | null | undefined): string {
  if (!preference) return '尚未設定更新提醒或略過版本。';
  if (preference.action === 'skip-version') return `已略過版本 ${preference.version}，下個版本仍會提醒。`;
  return `已設定稍後提醒版本 ${preference.version}${preference.remindAfter ? `，提醒時間 ${preference.remindAfter}` : ''}。`;
}

export function isUpdateReminderDue(preference: UpdateReminderPreference | null | undefined, now = new Date()): boolean {
  if (!preference || preference.action !== 'remind-later' || !preference.remindAfter) return false;
  const remindAt = new Date(preference.remindAfter).getTime();
  return Number.isFinite(remindAt) && remindAt <= now.getTime();
}

export function createUpdateReminderBadge(preference: UpdateReminderPreference | null | undefined, currentVersion?: string, now = new Date()): UpdateReminderBadge {
  if (!preference) {
    return { label: '未設定提醒', detail: '尚未稍後提醒或略過版本。', tone: 'neutral' };
  }

  const isSameVersion = currentVersion ? preference.version === currentVersion : true;
  if (!isSameVersion) {
    return { label: '有新版本', detail: `先前偏好是版本 ${preference.version}，目前版本 ${currentVersion} 仍需重新確認。`, tone: 'accent' };
  }

  if (preference.action === 'skip-version') {
    return { label: `已略過 v${preference.version}`, detail: '這個版本不再主動提醒，下個版本仍會提醒。', tone: 'neutral' };
  }

  if (isUpdateReminderDue(preference, now)) {
    return {
      label: '提醒到期',
      detail: `版本 ${preference.version} 的稍後提醒已到期，建議重新檢查更新。`,
      tone: 'warn',
    };
  }

  return {
    label: '稍後提醒',
    detail: `已設定版本 ${preference.version} 的稍後提醒${preference.remindAfter ? `（${preference.remindAfter} 後）` : ''}。`,
    tone: 'accent',
  };
}

export function createRequiredUpdateProtectionSummary(policy: UpdatePolicy): RequiredUpdateProtectionSummary {
  const active = policy.level === 'required' && !policy.canUseCoreApp;
  const allowedActions = active
    ? ['CSV 匯出', '複製更新診斷', '查看本機復原點資訊', '開啟商店更新連結']
    : ['完整核心功能', 'CSV 匯出', '更新診斷', '本機復原點資訊'];
  const blockedActions = active
    ? ['新增交易', '編輯交易', '刪除交易', '預算與目標主要操作', '報表主要操作']
    : [];
  const title = active ? '必要更新保護已啟用' : '必要更新保護未啟用';
  const message = active
    ? '目前版本低於最低支援版本時，App 會限制主要操作，避免在可能不相容的資料結構上繼續寫入；資料匯出、更新診斷與本機復原點資訊仍會保留。'
    : '目前未進入必要更新狀態，核心功能維持可用。';

  return {
    active,
    title,
    message,
    allowedActions,
    blockedActions,
    copyText: [
      title,
      `Allowed: ${allowedActions.join(', ')}`,
      `Blocked: ${blockedActions.length > 0 ? blockedActions.join(', ') : 'none'}`,
      message,
    ].join('\n'),
  };
}

export function getStoreAvailabilitySummary(storeLinks = STORE_LINKS): string {
  const ready = storeLinks.filter((link) => link.status === 'ready');
  if (ready.length === 0) return '商店連結會在正式上架後啟用，目前不會假裝可直接更新。';
  return `已啟用 ${ready.map((link) => link.label).join(' / ')} 更新連結。`;
}

export function getPrimaryReadyStoreLink(storeLinks = STORE_LINKS): StoreLink | undefined {
  return storeLinks.find((link) => link.status === 'ready' && link.url);
}

export function createStoreVersionQueryPreflight(source = createUpdateManifestSource(), storeLinks = STORE_LINKS): StoreVersionQueryPreflight {
  const checks: StoreVersionQueryPreflightCheck[] = [
    {
      label: '遠端 manifest fallback',
      status: source.status === 'ready' ? 'ready' : 'missing',
      detail: source.status === 'ready' ? `${source.envKey} 已設定，可作為商店查詢失敗時的 fallback。` : `${source.envKey} 尚未設定，正式查詢失敗時只能回本機 release notes。`,
    },
    ...storeLinks.map((link) => ({
      label: `${link.label} 更新連結`,
      status: link.status === 'ready' ? 'ready' as const : 'missing' as const,
      detail: link.status === 'ready' ? `${link.envKey} 已設定，可導向商店頁。` : `${link.envKey} 尚未設定，需正式上架後補入 HTTPS 商店 URL。`,
    })),
  ];

  const readyCount = checks.filter((check) => check.status === 'ready').length;
  const status: StoreVersionQueryPreflight['status'] = readyCount === checks.length ? 'ready' : readyCount > 0 ? 'partial' : 'blocked';
  const missingLabels = checks.filter((check) => check.status === 'missing').map((check) => check.label);
  const summary = status === 'ready'
    ? '正式商店版本查詢前置設定已齊，可進入 App Store / Play Store 查詢 API 接入。'
    : status === 'partial'
      ? `正式商店版本查詢前置設定尚未完整：待補 ${missingLabels.join('、')}。`
      : '正式商店版本查詢前置設定尚未開始：需先設定遠端 manifest fallback 與商店 HTTPS 連結。';

  return { status, summary, checks };
}

export function createLocalBackupSummary(versionInfo: VersionInfo): string {
  return `更新前會建立本機復原點：app ${versionInfo.appVersion} / build ${versionInfo.buildNumber} / schema v${versionInfo.schemaVersion}`;
}

export function createUpdateDiagnosticsText(input: UpdateDiagnosticsInput): string {
  const { versionInfo, updateStatus, updatePolicy, storeSummary, updateManifestSummary, storeVersionQueryPreflight, storeVersionQueryPlan, storeVersionQueryRun, backupStatusLabel, backupStatusDetail, categoryRuleVersion, noteSuggestionRuleVersion } = input;

  return [
    'Expense Tracker Redo 更新診斷',
    `App version: ${versionInfo.appVersion}`,
    `Build number: ${versionInfo.buildNumber}`,
    `Data schema: v${versionInfo.schemaVersion}`,
    `Release channel: ${versionInfo.releaseChannel}`,
    `Data status: ${versionInfo.lastDataUpdateLabel}`,
    `Update status: ${updateStatus.label} (${updateStatus.level})`,
    `Update detail: ${updateStatus.detail}`,
    `Update policy: ${updatePolicy.title}`,
    `Core app usable: ${updatePolicy.canUseCoreApp ? 'yes' : 'limited'}`,
    `Export preserved: ${updatePolicy.mustKeepExportAvailable ? 'yes' : 'no'}`,
    `Store links: ${storeSummary}`,
    `Update manifest: ${updateManifestSummary ?? 'local release notes only'}`,
    `Store query preflight: ${storeVersionQueryPreflight?.summary ?? 'not checked'}`,
    ...(storeVersionQueryPreflight?.checks.map((check) => `- ${check.label}: ${check.status} — ${check.detail}`) ?? []),
    `Store query fallback: ${storeVersionQueryPlan ? createStoreVersionQueryFallbackSummary(storeVersionQueryPlan) : 'not planned'}`,
    ...(storeVersionQueryPlan ? [`Store query primary source: ${storeVersionQueryPlan.primarySource}`] : []),
    ...(storeVersionQueryRun ? [`Store query result: ${createStoreVersionQueryAttemptSummary(storeVersionQueryRun)}`] : []),
    `Recovery point: ${backupStatusLabel}`,
    `Recovery detail: ${backupStatusDetail}`,
    `Category rule version: ${categoryRuleVersion}`,
    `Note suggestion rule version: ${noteSuggestionRuleVersion}`,
  ].join('\n');
}
