import { describe, expect, it } from 'vitest';
import type { StateStorage } from 'zustand/middleware';
import { createAppStore } from '../store/appStore';
import { INITIAL_BUDGETS, INITIAL_GOALS, INITIAL_RECURRING, INITIAL_TRANSACTIONS } from '../domain/initialData';
import { createFinanceStore } from '../store/financeStore';

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

describe('clear data flow consistency', () => {
  it('清除後 finance 與 recent usage 狀態一致回到乾淨值', () => {
    const appStore = createAppStore(createMockStorage());
    const financeStore = createFinanceStore(createMockStorage());

    appStore.getState().pushRecentCategory('交通');
    appStore.getState().pushRecentNote('Uber', '交通');

    financeStore.getState().setTransactions([{ id: 99, name: '測試', cat: '餐飲', amount: -100, date: '2026-04-10', time: '12:00' }]);
    financeStore.getState().setRecurring([{ id: 99, name: '定期', cat: '娛樂', amount: -50, freq: 'monthly', nextDate: '2026-05-01', active: true }]);
    financeStore.getState().setGoals([{ id: 99, name: '目標', target: 1000, saved: 100, icon: '🎯', color: '#000' }]);
    financeStore.getState().setBudgets({ ...INITIAL_BUDGETS, 交通: 9999 });

    financeStore.getState().resetAllData();
    appStore.getState().resetRecentUsage();

    expect(financeStore.getState().transactions).toEqual(INITIAL_TRANSACTIONS);
    expect(financeStore.getState().recurring).toEqual(INITIAL_RECURRING);
    expect(financeStore.getState().goals).toEqual(INITIAL_GOALS);
    expect(financeStore.getState().budgets).toEqual(INITIAL_BUDGETS);

    expect(appStore.getState().recentCategories).toEqual([]);
    expect(appStore.getState().recentNotes).toEqual([]);
    expect(appStore.getState().recentCategoryStats).toEqual({});
    expect(appStore.getState().recentNoteStats).toEqual({});
    expect(appStore.getState().recentNoteCategoryStats).toEqual({});
  });
});
