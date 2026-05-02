import { create } from 'zustand';
import { createJSONStorage, persist, type StateStorage } from 'zustand/middleware';
import type { CurrencyCode, ThemeMode, ThemeStyle } from '../domain/types';
import { safeStorage } from './persistence';
import {
  applyRecentNoteUsage,
  migrateRecentListToStats,
  pushRecentWithStats,
  rankRecentByStats,
  type RecentUsageStat,
} from './recentUsage';

export { rankRecentByStats, rankRecentNotesByCategoryContext } from './recentUsage';
export type { RecentUsageStat } from './recentUsage';

export type AppTab = 0 | 1 | 3 | 4;

type AppState = {
  style: ThemeStyle;
  mode: ThemeMode;
  tab: AppTab;
  month: number;
  currency: CurrencyCode;
  monthStartDay: number;
  billReminder: boolean;
  iCloudBackup: boolean;
  recentCategories: string[];
  recentNotes: string[];
  recentQuickEntries: string[];
  recentCategoryStats: Record<string, RecentUsageStat>;
  recentNoteStats: Record<string, RecentUsageStat>;
  recentQuickEntryStats: Record<string, RecentUsageStat>;
  recentNoteCategoryStats: Record<string, Record<string, RecentUsageStat>>;
  setStyle: (style: ThemeStyle) => void;
  setMode: (mode: ThemeMode) => void;
  setTab: (tab: AppTab) => void;
  setMonth: (month: number | ((prev: number) => number)) => void;
  setCurrency: (currency: CurrencyCode) => void;
  setMonthStartDay: (day: number) => void;
  setBillReminder: (value: boolean) => void;
  setICloudBackup: (value: boolean) => void;
  pushRecentCategory: (category: string) => void;
  pushRecentNote: (note: string, category?: string) => void;
  pushRecentQuickEntry: (entry: string) => void;
  resetRecentUsage: () => void;
};

const emptyRecentUsageState = {
  recentCategories: [],
  recentNotes: [],
  recentQuickEntries: [],
  recentCategoryStats: {},
  recentNoteStats: {},
  recentQuickEntryStats: {},
  recentNoteCategoryStats: {},
};

export function createAppStore(storage: StateStorage = safeStorage) {
  return create<AppState>()(
    persist(
      (set) => ({
        style: 'minimal',
        mode: 'light',
        tab: 0,
        month: new Date().getMonth(),
        currency: 'NTD',
        monthStartDay: 1,
        billReminder: true,
        iCloudBackup: false,
        ...emptyRecentUsageState,
        setStyle: (style) => set({ style }),
        setMode: (mode) => set({ mode }),
        setTab: (tab) => set({ tab }),
        setMonth: (month) =>
          set((state) => ({
            month: typeof month === 'function' ? (month as (prev: number) => number)(state.month) : month,
          })),
        setCurrency: (currency) => set({ currency }),
        setMonthStartDay: (monthStartDay) => set({ monthStartDay: Math.max(1, Math.min(28, Math.floor(monthStartDay) || 1)) }),
        setBillReminder: (billReminder) => set({ billReminder }),
        setICloudBackup: (iCloudBackup) => set({ iCloudBackup }),
        pushRecentCategory: (category) => set((state) => {
          const next = pushRecentWithStats(state.recentCategories, state.recentCategoryStats, category);
          return { recentCategories: next.items, recentCategoryStats: next.stats };
        }),
        pushRecentNote: (note, category) => set((state) => applyRecentNoteUsage(state, note, category)),
        pushRecentQuickEntry: (entry) => set((state) => {
          const next = pushRecentWithStats(state.recentQuickEntries, state.recentQuickEntryStats, entry);
          return { recentQuickEntries: next.items, recentQuickEntryStats: next.stats };
        }),
        resetRecentUsage: () => set(emptyRecentUsageState),
      }),
      {
        name: 'expense-tracker-redo-app-ui',
        storage: createJSONStorage(() => storage),
        version: 2,
        migrate: (persistedState) => {
          const state = (persistedState ?? {}) as Partial<AppState>;
          const recentCategories = state.recentCategories ?? [];
          const recentNotes = state.recentNotes ?? [];
          const recentQuickEntries = state.recentQuickEntries ?? [];
          const recentCategoryStats = state.recentCategoryStats && Object.keys(state.recentCategoryStats).length > 0
            ? state.recentCategoryStats
            : migrateRecentListToStats(recentCategories);
          const recentNoteStats = state.recentNoteStats && Object.keys(state.recentNoteStats).length > 0
            ? state.recentNoteStats
            : migrateRecentListToStats(recentNotes);
          const recentQuickEntryStats = state.recentQuickEntryStats && Object.keys(state.recentQuickEntryStats).length > 0
            ? state.recentQuickEntryStats
            : migrateRecentListToStats(recentQuickEntries);
          const recentNoteCategoryStats = state.recentNoteCategoryStats ?? {};

          return {
            ...state,
            recentCategories: rankRecentByStats(recentCategoryStats),
            recentNotes: rankRecentByStats(recentNoteStats),
            recentQuickEntries: rankRecentByStats(recentQuickEntryStats),
            recentCategoryStats,
            recentNoteStats,
            recentQuickEntryStats,
            recentNoteCategoryStats,
          } as AppState;
        },
        partialize: (state) => ({
          style: state.style,
          mode: state.mode,
          tab: state.tab,
          month: state.month,
          currency: state.currency,
          monthStartDay: state.monthStartDay,
          billReminder: state.billReminder,
          iCloudBackup: state.iCloudBackup,
          recentCategories: state.recentCategories,
          recentNotes: state.recentNotes,
          recentQuickEntries: state.recentQuickEntries,
          recentCategoryStats: state.recentCategoryStats,
          recentNoteStats: state.recentNoteStats,
          recentQuickEntryStats: state.recentQuickEntryStats,
          recentNoteCategoryStats: state.recentNoteCategoryStats,
        }),
      },
    ),
  );
}

export const useAppStore = createAppStore();
