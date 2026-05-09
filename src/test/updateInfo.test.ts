import { describe, expect, it } from 'vitest';
import { DATA_SCHEMA_VERSION, RELEASE_NOTES, createLocalBackupSummary, createStoreLinks, createUpdateDiagnosticsText, createVersionInfo, formatDataUpdateTime, getManifestUpdateStatus, getPrimaryReadyStoreLink, getStoreAvailabilitySummary, getUpdateManifestAvailabilitySummary, getUpdatePolicy, getUpdateStatus, createUpdateManifestSource, normalizeStoreUrl, normalizeUpdateManifestUrl } from '../utils/updateInfo';

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

  it('defines required update behavior without blocking data export', () => {
    const policy = getUpdatePolicy('required');

    expect(policy.canPostpone).toBe(false);
    expect(policy.canUseCoreApp).toBe(false);
    expect(policy.mustKeepExportAvailable).toBe(true);
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
