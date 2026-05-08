import type { StateStorage } from 'zustand/middleware';

export type MigrationBackupReason = 'schema-upgrade' | 'corrupted-json';

export type MigrationBackupSnapshot = {
  createdAt: string;
  sourceKey: string;
  reason: MigrationBackupReason;
  fromVersion: number | null;
  toVersion: number;
  raw: string;
};

export type MigrationBackupStatus = {
  exists: boolean;
  label: string;
  detail: string;
  snapshot?: MigrationBackupSnapshot;
};

export function getMigrationBackupKey(sourceKey: string): string {
  return `${sourceKey}-migration-backup`;
}

function createBackupSnapshot(sourceKey: string, raw: string, reason: MigrationBackupReason, fromVersion: number | null, toVersion: number): MigrationBackupSnapshot {
  return {
    createdAt: new Date().toISOString(),
    sourceKey,
    reason,
    fromVersion,
    toVersion,
    raw,
  };
}

function getPersistedVersion(parsed: unknown): number | null {
  if (!parsed || typeof parsed !== 'object') return null;
  const version = (parsed as { version?: unknown }).version;
  return typeof version === 'number' && Number.isFinite(version) ? version : null;
}

function writeBackup(storage: StateStorage, sourceKey: string, raw: string, reason: MigrationBackupReason, fromVersion: number | null, toVersion: number) {
  const backup = createBackupSnapshot(sourceKey, raw, reason, fromVersion, toVersion);
  storage.setItem(getMigrationBackupKey(sourceKey), JSON.stringify(backup));
}

function inspectRawValue(storage: StateStorage, sourceKey: string, currentVersion: number, key: string, raw: string | null): string | null {
  if (key !== sourceKey || raw === null) return raw;

  try {
    const parsed = JSON.parse(raw) as unknown;
    const fromVersion = getPersistedVersion(parsed);
    if (fromVersion === null || fromVersion < currentVersion) {
      writeBackup(storage, sourceKey, raw, 'schema-upgrade', fromVersion, currentVersion);
    }
    return raw;
  } catch {
    writeBackup(storage, sourceKey, raw, 'corrupted-json', null, currentVersion);
    return null;
  }
}

function formatBackupReason(reason: MigrationBackupReason): string {
  return reason === 'corrupted-json' ? '壞資料已安全備份' : '更新前本機復原點';
}

export function parseMigrationBackupSnapshot(raw: string | null): MigrationBackupSnapshot | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<MigrationBackupSnapshot>;
    if (!parsed || typeof parsed !== 'object') return null;
    if (typeof parsed.createdAt !== 'string' || typeof parsed.sourceKey !== 'string' || typeof parsed.raw !== 'string') return null;
    if (parsed.reason !== 'schema-upgrade' && parsed.reason !== 'corrupted-json') return null;
    if (typeof parsed.toVersion !== 'number') return null;
    return {
      createdAt: parsed.createdAt,
      sourceKey: parsed.sourceKey,
      reason: parsed.reason,
      fromVersion: typeof parsed.fromVersion === 'number' ? parsed.fromVersion : null,
      toVersion: parsed.toVersion,
      raw: parsed.raw,
    };
  } catch {
    return null;
  }
}

export function getMigrationBackupStatus(storage: Pick<StateStorage, 'getItem'>, sourceKey: string): MigrationBackupStatus {
  const raw = storage.getItem(getMigrationBackupKey(sourceKey));
  if (raw instanceof Promise) {
    return { exists: false, label: '尚無本機復原點', detail: '備份狀態正在讀取中。' };
  }

  const snapshot = parseMigrationBackupSnapshot(raw);
  if (!snapshot) {
    return { exists: false, label: '尚無本機復原點', detail: '更新前若需要 migration，系統會先建立本機復原點。' };
  }

  const fromVersion = snapshot.fromVersion === null ? '未知' : `v${snapshot.fromVersion}`;
  const detail = snapshot.reason === 'corrupted-json'
    ? `偵測到壞掉的本機資料，已於 ${snapshot.createdAt} 保存原始內容並安全恢復。`
    : `已於 ${snapshot.createdAt} 保存 ${fromVersion} → v${snapshot.toVersion} 更新前資料。`;

  return {
    exists: true,
    label: formatBackupReason(snapshot.reason),
    detail,
    snapshot,
  };
}

export function createMigrationBackupStorage(storage: StateStorage, sourceKey: string, currentVersion: number): StateStorage {
  return {
    getItem: (key) => {
      const raw = storage.getItem(key);
      if (raw instanceof Promise) {
        return raw.then((value) => inspectRawValue(storage, sourceKey, currentVersion, key, value));
      }
      return inspectRawValue(storage, sourceKey, currentVersion, key, raw);
    },
    setItem: (key, value) => storage.setItem(key, value),
    removeItem: (key) => storage.removeItem(key),
  };
}
