import type { ExpenseCategory, RecurringFrequency } from './types';

export const CATS: ExpenseCategory[] = ['餐飲', '交通', '購物', '娛樂', '帳單', '健康', '教育', '其他'];
export const MONTHS = ['10月', '11月', '12月', '1月', '2月', '3月'] as const;
export const BAR_DATA = [12800, 18400, 22100, 15600, 19200, 17180] as const;
export const FREQ: Record<RecurringFrequency, string> = {
  daily: '每天',
  weekly: '每週',
  monthly: '每月',
  yearly: '每年',
};
export const MONTH_NAMES = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'] as const;
