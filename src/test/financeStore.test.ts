import { describe, expect, it } from 'vitest';
import type { StateStorage } from 'zustand/middleware';
import { INITIAL_BUDGETS, INITIAL_GOALS, INITIAL_RECURRING, INITIAL_TRANSACTIONS } from '../domain/initialData';
import { createFinanceStore } from '../store/financeStore';
import { getMigrationBackupKey, type MigrationBackupSnapshot } from '../store/migrationBackupStorage';

const STORAGE_KEY = 'expense-tracker-redo-finance';

function createMockStorage(seed: Record<string, string> = {}): StateStorage {
  const map = new Map(Object.entries(seed));
  return {
    getItem: (name) => map.get(name) ?? null,
    setItem: (name, value) => {
      map.set(name, value);
    },
    removeItem: (name) => {
      map.delete(name);
    },
  };
}

describe('financeStore persistence/DI', () => {
  it('storage 無資料時，維持預設初始值', async () => {
    const store = createFinanceStore(createMockStorage());
    await store.persist.rehydrate();

    const state = store.getState();
    expect(state.transactions).toEqual(INITIAL_TRANSACTIONS);
    expect(state.recurring).toEqual(INITIAL_RECURRING);
    expect(state.goals).toEqual(INITIAL_GOALS);
    expect(state.budgets).toEqual(INITIAL_BUDGETS);
  });

  it('可由注入 storage hydrate 初始狀態', async () => {
    const hydratedState = {
      transactions: [{ id: 999, name: 'hydrated txn', cat: '餐飲', amount: -100, date: '2026-04-01', time: '12:00' }],
      recurring: [{ id: 1, name: 'hydrated recurring', cat: '娛樂', amount: -149, freq: 'monthly', nextDate: '2026-05-01', active: true }],
      goals: [{ id: 321, name: 'hydrated goal', target: 10000, saved: 500, icon: '🎯', color: '#6366F1' }],
      budgets: { ...INITIAL_BUDGETS, 餐飲: 7777 },
    };

    const storage = createMockStorage({
      [STORAGE_KEY]: JSON.stringify({ state: hydratedState, version: 2 }),
    });

    const store = createFinanceStore(storage);
    await store.persist.rehydrate();

    const state = store.getState();
    expect(state.transactions[0].name).toBe('hydrated txn');
    expect(state.goals[0].name).toBe('hydrated goal');
    expect(state.budgets.餐飲).toBe(7777);
    expect(state.recurring[0].autoPost).toBe(false);
    expect(state.recurring[0].autoPostMode).toBe('off');
    expect(state.recurring[0].lastAutoPostCycle).toBeNull();
    expect(state.recurring[0].pendingCycle).toBeNull();
  });

  it('舊交易若無 originalCurrency，migration 會補成 NTD fallback', async () => {
    const hydratedState = {
      transactions: [{ id: 77, name: 'legacy txn', cat: '餐飲', amount: -80, date: '2026-04-01', time: '08:00' }],
      recurring: [],
      goals: [],
      budgets: { ...INITIAL_BUDGETS },
    };

    const storage = createMockStorage({
      [STORAGE_KEY]: JSON.stringify({ state: hydratedState, version: 4 }),
    });

    const store = createFinanceStore(storage);
    await store.persist.rehydrate();

    expect(store.getState().transactions[0].originalCurrency).toBe('NTD');
  });

  it('setTransactions / setBudgets / setGoals 會更新狀態並寫回 persistence', () => {
    const writes: string[] = [];
    const map = new Map<string, string>();

    const storage: StateStorage = {
      getItem: (name) => map.get(name) ?? null,
      setItem: (name, value) => {
        writes.push(value);
        map.set(name, value);
      },
      removeItem: (name) => {
        map.delete(name);
      },
    };

    const store = createFinanceStore(storage);

    store.getState().setTransactions((prev) => [{ id: 123456, name: 'updated txn', cat: '餐飲', amount: -300, date: '2026-04-02', time: '12:30' }, ...prev]);
    store.getState().setBudgets((prev) => ({ ...prev, 交通: 2468 }));
    store.getState().setGoals((prev) => [{ id: 9999, name: 'updated goal', target: 30000, saved: 3000, icon: '🎯', color: '#6366F1' }, ...prev]);

    expect(store.getState().transactions[0].name).toBe('updated txn');
    expect(store.getState().budgets.交通).toBe(2468);
    expect(store.getState().goals[0].name).toBe('updated goal');
    expect(writes.length).toBeGreaterThan(0);

    const persistedRaw = map.get(STORAGE_KEY);
    expect(persistedRaw).toBeTruthy();

    const parsed = JSON.parse(persistedRaw as string) as {
      state: { budgets: typeof INITIAL_BUDGETS; goals: typeof INITIAL_GOALS };
    };
    expect(parsed.state.budgets.交通).toBe(2468);
    expect(parsed.state.goals[0].name).toBe('updated goal');
  });

  it('migration 前會建立本機備份 snapshot', async () => {
    const rawState = {
      transactions: [{ id: 77, name: 'legacy txn', cat: '餐飲', amount: -80, date: '2026-04-01', time: '08:00' }],
      recurring: [],
      goals: [],
      budgets: { ...INITIAL_BUDGETS },
    };
    const raw = JSON.stringify({ state: rawState, version: 4 });
    const storage = createMockStorage({ [STORAGE_KEY]: raw });

    const store = createFinanceStore(storage);
    await store.persist.rehydrate();

    const backupRaw = storage.getItem(getMigrationBackupKey(STORAGE_KEY));
    expect(backupRaw).toBeTruthy();
    const backup = JSON.parse(backupRaw as string) as MigrationBackupSnapshot;
    expect(backup.reason).toBe('schema-upgrade');
    expect(backup.fromVersion).toBe(4);
    expect(backup.toVersion).toBe(5);
    expect(backup.raw).toBe(raw);
  });

  it('corrupted persisted JSON 會備份並回復乾淨狀態，不讓 hydrate 失敗', async () => {
    const storage = createMockStorage({ [STORAGE_KEY]: '{broken json' });

    const store = createFinanceStore(storage);
    await store.persist.rehydrate();

    const state = store.getState();
    expect(state.transactions).toEqual(INITIAL_TRANSACTIONS);
    expect(state.recurring).toEqual(INITIAL_RECURRING);

    const backupRaw = storage.getItem(getMigrationBackupKey(STORAGE_KEY));
    expect(backupRaw).toBeTruthy();
    const backup = JSON.parse(backupRaw as string) as MigrationBackupSnapshot;
    expect(backup.reason).toBe('corrupted-json');
    expect(backup.raw).toBe('{broken json');
  });

  it('舊版 demo seed persistence 會在 migration 清空', async () => {
    const seedState = {
      transactions: [
        { id: 1, name: '午餐・拉麵', cat: '餐飲', amount: -180, date: '2026-04-05', time: '12:30' },
        { id: 2, name: '全聯採購', cat: '購物', amount: -740, date: '2026-04-05', time: '10:15' },
      ],
      recurring: [{ id: 1, name: 'Netflix', cat: '娛樂', amount: -390, freq: 'monthly', nextDate: '2026-05-02', active: true }],
      goals: [{ id: 1, name: '日本旅遊基金', target: 80000, saved: 34000, icon: '✈️', color: '#6366F1' }],
      budgets: { ...INITIAL_BUDGETS, 餐飲: 5000 },
    };

    const store = createFinanceStore(
      createMockStorage({
        [STORAGE_KEY]: JSON.stringify({ state: seedState, version: 0 }),
      }),
    );
    await store.persist.rehydrate();

    const state = store.getState();
    expect(state.transactions).toEqual(INITIAL_TRANSACTIONS);
    expect(state.recurring).toEqual(INITIAL_RECURRING);
    expect(state.goals).toEqual(INITIAL_GOALS);
    expect(state.budgets).toEqual(INITIAL_BUDGETS);
  });
});
