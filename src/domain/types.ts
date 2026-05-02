export type ThemeStyle = 'minimal' | 'material';
export type ThemeMode = 'light' | 'dark';

export type ExpenseCategory =
  | '餐飲'
  | '交通'
  | '購物'
  | '娛樂'
  | '帳單'
  | '健康'
  | '教育'
  | '其他';

export type Category = ExpenseCategory | '收入';

export type RecurringFrequency = 'daily' | 'weekly' | 'monthly' | 'yearly';
export type RecurringAutoPostMode = 'off' | 'on' | 'confirm';
export type RecurringConfirmDateStrategy = 'today' | 'cycle';

export type BudgetMap = Record<ExpenseCategory, number>;

export type CurrencyCode = 'NTD' | 'USD' | 'JPY' | 'EUR' | 'HKD' | 'CNY' | 'GBP';

export type Transaction = {
  id: number;
  name: string;
  cat: Category;
  amount: number;
  date: string;
  time: string;
  originalCurrency?: CurrencyCode;
};

export type RecurringItem = {
  id: number;
  name: string;
  cat: Category;
  amount: number;
  freq: RecurringFrequency;
  nextDate: string;
  active: boolean;
  autoPost?: boolean;
  autoPostMode?: RecurringAutoPostMode;
  lastAutoPostCycle?: string | null;
  pendingCycle?: string | null;
};

export type Goal = {
  id: number;
  name: string;
  target: number;
  saved: number;
  icon: string;
  color: string;
};

export type ThemePalette = {
  bg: string;
  surface: string;
  surfaceAlt: string;
  surfaceHover: string;
  primary: string;
  secondary: string;
  tertiary: string;
  accent: string;
  accentSoft: string;
  income: string;
  incomeChip: string;
  incomeIcon: string;
  expense: string;
  expenseChip: string;
  expenseIcon: string;
  border: string;
  divider: string;
  hero: string;
  heroText: string;
  heroSub: string;
  navBg: string;
  navBorder: string;
  tabActive: string;
  tabInactive: string;
  chip: string;
  chipText: string;
  chipActive: string;
  chipActiveText: string;
  barFg: string;
  barBg: string;
  fabBg: string;
  fabText: string;
  shadow: string;
  cardShadow: string;
  modalOverlay: string;
  inputBg: string;
  inputBorder: string;
  positive: string;
  negative: string;
  warn: string;
  warnChip: string;
  donut: string[];
  budgetOk: string;
  budgetWarn: string;
  budgetOver: string;
  swipeEdit: string;
  swipeDel: string;
  goalColor: string;
  shimmer: string;
};

export type ThemeRadii = {
  card: string;
  chip: string;
  bar: string;
  fab: string;
  modal: string;
  input: string;
  icon: string;
  nav: string;
};

export type ThemeFonts = {
  display: string;
  body: string;
};
