import { describe, expect, it } from 'vitest';
import { DATA_SCHEMA_VERSION, RELEASE_NOTES, createLocalBackupSummary, createRequiredUpdateProtectionSummary, createUpdateReminderBadge, createUpdateReminderPreference, createStoreLinks, createUpdateDiagnosticsText, fetchRemoteUpdateManifest, createVersionInfo, formatDataUpdateTime, getManifestUpdateStatus, getPrimaryReadyStoreLink, getStoreAvailabilitySummary, getUpdateManifestAvailabilitySummary, getUpdatePolicy, getUpdateReminderPreferenceSummary, getUpdateStatus, createUpdateManifestSource, normalizeStoreUrl, normalizeUpdateManifestUrl, parseRemoteUpdateManifest } from '../utils/updateInfo';

describe('updateInfo helpers', () => {
  it('creates stable default version metadata', () => {
    const info = createVersionInfo();

    expect(info.appVersion).toBe('1.0.0');
    expect(info.buildNumber).toBe('2');
    expect(info.schemaVersion).toBe(DATA_SCHEMA_VERSION);
    expect(info.releaseChannel).toBe('Internal');
    expect(info.lastDataUpdateLabel).toContain('本機資料');
  });

  it('formats explicit last data update time', () => {
    const label = formatDataUpdateTime(new Date('2026-05-08T12:25:00Z'));

    expect(label).toContain('2026');
    expect(label).toContain('05');
  });

  it('reports current update status when app version matches or exceeds latest release note', () => {
    const sameVersionStatus = getUpdateStatus({ appVersion: RELEASE_NOTES[0].version });
    const newerVersionStatus = getUpdateStatus({ appVersion: '1.1.0' }, { ...RELEASE_NOTES[0], version: '1.0.0' });

    expect(sameVersionStatus.level).toBe('current');
    expect(sameVersionStatus.label).toBe('已是目前版本');
    expect(newerVersionStatus.level).toBe('current');
  });

  it('creates reminder preferences only for optional and recommended updates', () => {
    const now = new Date('2026-05-10T00:00:00.000Z');
    const recommended = createUpdateReminderPreference(getUpdatePolicy('recommended'), '1.0.2', now);
    const optional = createUpdateReminderPreference(getUpdatePolicy('optional'), '1.0.1', now);

    expect(recommended).toEqual(expect.objectContaining({ action: 'remind-later', version: '1.0.2', remindAfter: '2026-05-11T00:00:00.000Z' }));
    expect(optional).toEqual(expect.objectContaining({ action: 'skip-version', version: '1.0.1' }));
    expect(createUpdateReminderPreference(getUpdatePolicy('required'), '1.0.3', now)).toBeUndefined();
    expect(getUpdateReminderPreferenceSummary(optional)).toContain('已略過版本 1.0.1');
    expect(createUpdateReminderBadge(optional, '1.0.1')).toEqual(expect.objectContaining({ label: '已略過 v1.0.1', tone: 'neutral' }));
    expect(createUpdateReminderBadge(recommended, '1.0.2')).toEqual(expect.objectContaining({ label: '稍後提醒', tone: 'accent' }));
    expect(createUpdateReminderBadge(optional, '1.0.2')).toEqual(expect.objectContaining({ label: '有新版本', tone: 'accent' }));
  });

  it('defines required update behavior without blocking data export', () => {
    const policy = getUpdatePolicy('required');
    const protection = createRequiredUpdateProtectionSummary(policy);

    expect(policy.canPostpone).toBe(false);
    expect(policy.canUseCoreApp).toBe(false);
    expect(policy.mustKeepExportAvailable).toBe(true);
    expect(protection.active).toBe(true);
    expect(protection.allowedActions).toEqual(expect.arrayContaining(['CSV 匯出', '複製更新診斷', '查看本機復原點資訊']));
    expect(protection.blockedActions).toEqual(expect.arrayContaining(['新增交易', '編輯交易', '刪除交易']));
    expect(protection.copyText).toContain('必要更新保護已啟用');
  });

  it('summarizes store placeholder availability honestly', () => {
    expect(getStoreAvailabilitySummary()).toContain('正式上架後啟用');
  });


  it('normalizes only secure store URLs for outbound update links', () => {
    expect(normalizeStoreUrl(' https://apps.apple.com/app/example ')).toBe('https://apps.apple.com/app/example');
    expect(normalizeStoreUrl('http://apps.apple.com/app/example')).toBeUndefined();
    expect(normalizeStoreUrl('not-a-url')).toBeUndefined();
  });


  it('normalizes and summarizes remote update manifest source safely', () => {
    expect(normalizeUpdateManifestUrl(' https://example.com/app/update-manifest.json ')).toBe('https://example.com/app/update-manifest.json');
    expect(normalizeUpdateManifestUrl('http://example.com/app/update-manifest.json')).toBeUndefined();

    const placeholder = createUpdateManifestSource({ VITE_UPDATE_MANIFEST_URL: '' });
    const ready = createUpdateManifestSource({ VITE_UPDATE_MANIFEST_URL: 'https://example.com/app/update-manifest.json' });

    expect(placeholder.status).toBe('placeholder');
    expect(getUpdateManifestAvailabilitySummary(placeholder)).toContain('尚未設定');
    expect(ready).toEqual(expect.objectContaining({ status: 'ready', envKey: 'VITE_UPDATE_MANIFEST_URL', url: 'https://example.com/app/update-manifest.json' }));
    expect(getUpdateManifestAvailabilitySummary(ready)).toContain('已設定');
  });

  it('classifies remote manifest updates including minimum supported versions', () => {
    expect(getManifestUpdateStatus({ appVersion: '1.0.0' }, { latestVersion: '1.0.1', level: 'optional' })).toEqual(expect.objectContaining({ level: 'optional', label: '可選更新' }));
    expect(getManifestUpdateStatus({ appVersion: '1.0.0' }, { latestVersion: '1.0.1', minimumSupportedVersion: '1.0.1' })).toEqual(expect.objectContaining({ level: 'required', label: '需要更新' }));
    expect(getManifestUpdateStatus({ appVersion: '1.0.1' }, { latestVersion: '1.0.1', minimumSupportedVersion: '1.0.0' })).toEqual(expect.objectContaining({ level: 'current', label: '已是目前版本' }));
  });


  it('parses only valid remote update manifest payloads', () => {
    expect(parseRemoteUpdateManifest({ latestVersion: ' 1.0.2 ', minimumSupportedVersion: '1.0.0', level: 'recommended', message: ' 更新可用 ' })).toEqual({
      latestVersion: '1.0.2',
      minimumSupportedVersion: '1.0.0',
      level: 'recommended',
      message: '更新可用',
    });
    expect(parseRemoteUpdateManifest({ latestVersion: '' })).toBeUndefined();
    expect(parseRemoteUpdateManifest({ latestVersion: '1.0.2', level: 'current' })).toBeUndefined();
    expect(parseRemoteUpdateManifest(null)).toBeUndefined();
  });

  it('skips remote update fetch when manifest source is not configured', async () => {
    let called = false;
    const result = await fetchRemoteUpdateManifest(createUpdateManifestSource({ VITE_UPDATE_MANIFEST_URL: '' }), { appVersion: '1.0.0' }, {
      fetcher: async () => {
        called = true;
        return { ok: true, status: 200, json: async () => ({ latestVersion: '1.0.2' }) };
      },
    });

    expect(called).toBe(false);
    expect(result.status).toBe('not-configured');
    expect(result.updateStatus.level).toBe('current');
  });

  it('fetches and validates remote update manifest before classifying update status', async () => {
    const source = createUpdateManifestSource({ VITE_UPDATE_MANIFEST_URL: 'https://example.com/update-manifest.json' });
    const result = await fetchRemoteUpdateManifest(source, { appVersion: '1.0.0' }, {
      fetcher: async (url, init) => {
        expect(url).toBe('https://example.com/update-manifest.json');
        expect(init?.headers).toEqual({ Accept: 'application/json' });
        return {
          ok: true,
          status: 200,
          json: async () => ({ latestVersion: '1.0.2', minimumSupportedVersion: '1.0.1', message: '請更新以維持資料相容。' }),
        };
      },
    });

    expect(result.status).toBe('success');
    expect(result.updateStatus.level).toBe('required');
    expect(result.summary).toContain('最新版本 1.0.2');
  });

  it('falls back to local release notes when remote update manifest fetch fails', async () => {
    const source = createUpdateManifestSource({ VITE_UPDATE_MANIFEST_URL: 'https://example.com/update-manifest.json' });
    const result = await fetchRemoteUpdateManifest(source, { appVersion: '1.0.0' }, {
      fetcher: async () => ({ ok: false, status: 503, statusText: 'Service Unavailable', json: async () => ({}) }),
    });

    expect(result.status).toBe('error');
    expect(result.errorMessage).toContain('HTTP 503');
    expect(result.updateStatus.level).toBe('current');
    expect(result.summary).toContain('已回落本機 release notes');
  });

  it('builds store links from Vite env without pretending missing links are ready', () => {
    const links = createStoreLinks({
      VITE_APP_STORE_URL: 'https://apps.apple.com/app/expense-tracker-redo',
      VITE_PLAY_STORE_URL: '',
    });

    expect(links).toEqual([
      expect.objectContaining({ target: 'appStore', label: 'App Store', status: 'ready', envKey: 'VITE_APP_STORE_URL', url: 'https://apps.apple.com/app/expense-tracker-redo' }),
      expect.objectContaining({ target: 'playStore', label: 'Play Store', status: 'placeholder', envKey: 'VITE_PLAY_STORE_URL', url: undefined }),
    ]);
    expect(getStoreAvailabilitySummary(links)).toContain('已啟用 App Store 更新連結');
    expect(getPrimaryReadyStoreLink(links)?.target).toBe('appStore');
  });

  it('summarizes local backup context for safe migration copy', () => {
    const info = createVersionInfo();
    const summary = createLocalBackupSummary(info);

    expect(summary).toContain('本機復原點');
    expect(summary).toContain(`schema v${DATA_SCHEMA_VERSION}`);
  });

  it('creates copyable update diagnostics for support handoff', () => {
    const versionInfo = createVersionInfo();
    const updateStatus = getUpdateStatus(versionInfo);
    const updatePolicy = getUpdatePolicy(updateStatus.level);
    const diagnostics = createUpdateDiagnosticsText({
      versionInfo,
      updateStatus,
      updatePolicy,
      storeSummary: getStoreAvailabilitySummary(),
      backupStatusLabel: '尚無本機復原點',
      backupStatusDetail: '更新前若需要 migration，系統會先建立本機復原點。',
      categoryRuleVersion: 'category-test',
      noteSuggestionRuleVersion: 'note-test',
    });

    expect(diagnostics).toContain('Expense Tracker Redo 更新診斷');
    expect(diagnostics).toContain('App version: 1.0.0');
    expect(diagnostics).toContain('Recovery point: 尚無本機復原點');
    expect(diagnostics).toContain('Category rule version: category-test');
  });
});
