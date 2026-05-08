import { describe, expect, it } from 'vitest';
import type { StateStorage } from 'zustand/middleware';
import { createMigrationBackupStorage, getMigrationBackupKey, getMigrationBackupStatus, parseMigrationBackupSnapshot, type MigrationBackupSnapshot } from '../store/migrationBackupStorage';

function createMockStorage(seed: Record<string, string> = {}): StateStorage & { map: Map<string, string> } {
  const map = new Map(Object.entries(seed));
  return {
    map,
    getItem: (name) => map.get(name) ?? null,
    setItem: (name, value) => {
      map.set(name, value);
    },
    removeItem: (name) => {
      map.delete(name);
    },
  };
}

describe('migration backup storage', () => {
  it('creates a local backup snapshot before schema upgrade', () => {
    const sourceKey = 'finance';
    const raw = JSON.stringify({ state: { transactions: [] }, version: 4 });
    const storage = createMockStorage({ [sourceKey]: raw });
    const wrapped = createMigrationBackupStorage(storage, sourceKey, 5);

    expect(wrapped.getItem(sourceKey)).toBe(raw);

    const backupRaw = storage.map.get(getMigrationBackupKey(sourceKey));
    expect(backupRaw).toBeTruthy();
    const backup = JSON.parse(backupRaw as string) as MigrationBackupSnapshot;
    expect(backup.reason).toBe('schema-upgrade');
    expect(backup.fromVersion).toBe(4);
    expect(backup.toVersion).toBe(5);
    expect(backup.raw).toBe(raw);
  });

  it('keeps current schema payload untouched without creating backup', () => {
    const sourceKey = 'finance';
    const raw = JSON.stringify({ state: { transactions: [] }, version: 5 });
    const storage = createMockStorage({ [sourceKey]: raw });
    const wrapped = createMigrationBackupStorage(storage, sourceKey, 5);

    expect(wrapped.getItem(sourceKey)).toBe(raw);
    expect(storage.map.get(getMigrationBackupKey(sourceKey))).toBeUndefined();
  });

  it('parses backup status for UI copy', () => {
    const sourceKey = 'finance';
    const snapshot: MigrationBackupSnapshot = {
      createdAt: '2026-05-08T13:00:00.000Z',
      sourceKey,
      reason: 'corrupted-json',
      fromVersion: null,
      toVersion: 5,
      raw: '{broken json',
    };
    const storage = createMockStorage({ [getMigrationBackupKey(sourceKey)]: JSON.stringify(snapshot) });

    expect(parseMigrationBackupSnapshot(JSON.stringify(snapshot))?.reason).toBe('corrupted-json');
    const status = getMigrationBackupStatus(storage, sourceKey);
    expect(status.exists).toBe(true);
    expect(status.label).toBe('壞資料已安全備份');
    expect(status.detail).toContain('安全恢復');
  });

  it('backs up corrupted JSON and returns null to let the app recover cleanly', () => {
    const sourceKey = 'finance';
    const raw = '{broken json';
    const storage = createMockStorage({ [sourceKey]: raw });
    const wrapped = createMigrationBackupStorage(storage, sourceKey, 5);

    expect(wrapped.getItem(sourceKey)).toBeNull();

    const backupRaw = storage.map.get(getMigrationBackupKey(sourceKey));
    expect(backupRaw).toBeTruthy();
    const backup = JSON.parse(backupRaw as string) as MigrationBackupSnapshot;
    expect(backup.reason).toBe('corrupted-json');
    expect(backup.fromVersion).toBeNull();
    expect(backup.raw).toBe(raw);
  });
});
