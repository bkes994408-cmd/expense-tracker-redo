import { describe, expect, it } from 'vitest';
import { DATA_SCHEMA_VERSION, RELEASE_NOTES, createLocalBackupSummary, createVersionInfo, formatDataUpdateTime, getStoreAvailabilitySummary, getUpdatePolicy, getUpdateStatus } from '../utils/updateInfo';

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

  it('reports current update status when app version matches latest release note', () => {
    const status = getUpdateStatus({ appVersion: RELEASE_NOTES[0].version });

    expect(status.level).toBe('current');
    expect(status.label).toBe('已是目前版本');
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

  it('summarizes local backup context for safe migration copy', () => {
    const info = createVersionInfo();
    const summary = createLocalBackupSummary(info);

    expect(summary).toContain('本機復原點');
    expect(summary).toContain(`schema v${DATA_SCHEMA_VERSION}`);
  });
});
