import { describe, expect, it, vi } from 'vitest';
import type { StateStorage } from 'zustand/middleware';
import { createAppStore, rankRecentByStats, rankRecentNotesByCategoryContext } from '../store/appStore';

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

describe('appStore recent usage ranking', () => {
  it('rankRecentByStats 會以頻率 + 最近時間混合排序', () => {
    const now = new Date('2026-04-19T12:00:00.000Z').getTime();
    const ranked = rankRecentByStats(
      {
        A: { count: 2, lastUsedAt: now },
        B: { count: 4, lastUsedAt: now - 1000 * 60 * 60 * 24 * 20 },
        C: { count: 3, lastUsedAt: now - 1000 * 60 * 60 * 24 },
      },
      now,
      8,
    );

    expect(ranked).toEqual(['B', 'C', 'A']);
  });

  it('pushRecentCategory / pushRecentNote 會保留上限並更新排序', () => {
    const now = new Date('2026-04-19T12:00:00.000Z').getTime();
    vi.useFakeTimers();
    vi.setSystemTime(now);

    const store = createAppStore(createMockStorage());

    store.getState().pushRecentCategory('交通');
    store.getState().pushRecentCategory('餐飲');
    store.getState().pushRecentCategory('餐飲');

    expect(store.getState().recentCategories[0]).toBe('餐飲');

    for (let i = 0; i < 10; i += 1) {
      vi.setSystemTime(now + i * 1000);
      store.getState().pushRecentNote(`note-${i}`);
    }

    expect(store.getState().recentNotes).toHaveLength(8);
    expect(store.getState().recentNoteStats['note-0']).toBeUndefined();
    expect(store.getState().recentNotes[0]).toBe('note-9');

    vi.useRealTimers();
  });

  it('recent note 會受 category context 影響排序', () => {
    const now = new Date('2026-04-19T12:00:00.000Z').getTime();
    const ranked = rankRecentNotesByCategoryContext(
      {
        Uber: { count: 3, lastUsedAt: now - 1000 * 60 * 60 * 5 },
        午餐: { count: 3, lastUsedAt: now - 1000 * 60 * 60 * 5 },
      },
      {
        Uber: { 交通: { count: 2, lastUsedAt: now - 1000 * 60 * 15 } },
        午餐: { 餐飲: { count: 2, lastUsedAt: now - 1000 * 60 * 15 } },
      },
      '交通',
      now,
      8,
    );

    expect(ranked[0]).toBe('Uber');
  });

  it('舊版 recent list hydrate 後會補上 stats 並可 reset', async () => {
    const STORAGE_KEY = 'expense-tracker-redo-app-ui';
    const storage = createMockStorage({
      [STORAGE_KEY]: JSON.stringify({
        state: {
          style: 'minimal',
          mode: 'light',
          tab: 0,
          month: 3,
          currency: 'NTD',
          monthStartDay: 1,
          billReminder: true,
          iCloudBackup: false,
          recentCategories: ['交通', '餐飲'],
          recentNotes: ['Uber'],
        },
        version: 0,
      }),
    });

    const store = createAppStore(storage);
    await store.persist.rehydrate();

    expect(store.getState().recentCategoryStats['交通']).toBeTruthy();
    expect(store.getState().recentNoteStats['Uber']).toBeTruthy();

    store.getState().resetRecentUsage();
    expect(store.getState().recentCategories).toEqual([]);
    expect(store.getState().recentNotes).toEqual([]);
    expect(store.getState().recentCategoryStats).toEqual({});
    expect(store.getState().recentNoteStats).toEqual({});
  });
});
