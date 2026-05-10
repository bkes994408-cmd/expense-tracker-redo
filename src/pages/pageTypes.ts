import type { AppTab } from '../store/appStore';
import type { BudgetMap, Goal, RecurringConfirmDateStrategy, RecurringItem, ThemeFonts, ThemePalette, ThemeRadii, ThemeStyle, Transaction } from '../domain/types';
import type { DisplayCurrency } from '../utils/format';
import type { CategoryRuleReapplyResult } from '../rules/categoryRules';
import type { UpdateManifestSource } from '../utils/updateInfo';

export type CsvExportScope = 'month' | 'all' | 'category';

export type CsvExportOptions = {
  scope: CsvExportScope;
  category?: Transaction['cat'];
};

export type CsvExportFeedback = {
  filename: string;
  count: number;
  summary: string;
  exportedAt: string;
  options: CsvExportOptions;
};

export type ThemedProps = {
  t: ThemePalette;
  r: ThemeRadii;
  f: ThemeFonts;
};

export type HomePageProps = ThemedProps & {
  txns: Transaction[];
  budgets: BudgetMap;
  recurring: RecurringItem[];
  goals: Goal[];
  loading: boolean;
  currency: DisplayCurrency;
  recentQuickEntries?: string[];
  onQuickEntryOpen?: (initialInput?: string) => void;
};

export type TransactionsPageProps = ThemedProps & {
  txns: Transaction[];
  recurring: RecurringItem[];
  currency: DisplayCurrency;
  onEdit: (tx: Transaction) => void;
  onDelete: (id: number) => void;
  onReapplyCategoryRules?: (ids: number[]) => CategoryRuleReapplyResult;
  onRecChange: (id: number, active: boolean) => void;
  onRecBatchResult?: (result: { action: 'enable' | 'disable' | 'confirm-pending' | 'skip-pending'; affected: number; target: number; names?: string[] }) => void;
  onRecSave: (id: number, patch: Partial<RecurringItem>) => void;
  onRecDelete: (id: number) => void;
  onRecConfirmPending?: (id: number, strategy: RecurringConfirmDateStrategy) => void;
  onRecSkipPending?: (id: number) => void;
  month: number;
  setMonth: (updater: number | ((prev: number) => number)) => void;
};

export type ReportsPageProps = ThemedProps & {
  txns: Transaction[];
  reportTxns?: Transaction[];
  currency: DisplayCurrency;
  budgets: BudgetMap;
  setBudgets: (updater: BudgetMap | ((prev: BudgetMap) => BudgetMap)) => void;
  goals: Goal[];
  setGoals: (updater: Goal[] | ((prev: Goal[]) => Goal[])) => void;
};

export type SettingsPageProps = ThemedProps & {
  style: ThemeStyle;
  mode: 'light' | 'dark';
  setStyle: (style: ThemeStyle) => void;
  setMode: (mode: 'light' | 'dark') => void;
  currency: DisplayCurrency;
  setCurrency: (currency: DisplayCurrency) => void;
  monthStartDay: number;
  setMonthStartDay: (day: number) => void;
  billReminder: boolean;
  setBillReminder: (value: boolean) => void;
  iCloudBackup: boolean;
  setICloudBackup: (value: boolean) => void;
  exportCategories: Transaction['cat'][];
  getCsvExportCount: (options: CsvExportOptions) => number;
  onExportCsv: (options: CsvExportOptions) => void;
  lastCsvExport?: CsvExportFeedback | null;
  onClearAllData: () => void;
  onRateApp: () => void;
  requiredUpdateProtectionActive?: boolean;
  onRequiredUpdateProtectionChange?: (active: boolean) => void;
  updateManifestSourceOverride?: UpdateManifestSource;
};

export type AppScreen = AppTab;
