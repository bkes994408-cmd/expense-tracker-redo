import { describe, expect, it } from 'vitest';
import type { Transaction } from '../domain/types';
import { buildCsv, filterTransactionsForCsv, getCsvFilename } from '../utils/csv';

const TXNS: Transaction[] = [
  { id: 1, name: '午餐', cat: '餐飲', amount: -120, date: '2026-04-10', time: '12:00' },
  { id: 2, name: '捷運', cat: '交通', amount: -35, date: '2026-04-11', time: '08:30' },
  { id: 3, name: '年終', cat: '收入', amount: 50000, date: '2026-03-31', time: '09:00' },
];

describe('csv export scope', () => {
  it('依匯出範圍篩選交易', () => {
    const monthOnly = filterTransactionsForCsv(TXNS, 3, { scope: 'month' });
    const all = filterTransactionsForCsv(TXNS, 3, { scope: 'all' });
    const categoryOnly = filterTransactionsForCsv(TXNS, 3, { scope: 'category', category: '交通' });

    expect(monthOnly.map((x) => x.id)).toEqual([1, 2]);
    expect(all.map((x) => x.id)).toEqual([1, 2, 3]);
    expect(categoryOnly.map((x) => x.id)).toEqual([2]);
  });

  it('buildCsv 會輸出含表頭 CSV', () => {
    const csv = buildCsv(TXNS.slice(0, 1));
    expect(csv).toContain('"日期","時間","名稱","分類","金額"');
    expect(csv).toContain('"2026-04-10","12:00","午餐","餐飲","-120"');
  });

  it('檔名會反映 scope/category', () => {
    const fixedNow = new Date('2026-04-11T10:00:00Z');
    expect(getCsvFilename({ scope: 'month' }, fixedNow)).toBe('expense-tracker-month-2026-04-11.csv');
    expect(getCsvFilename({ scope: 'all' }, fixedNow)).toBe('expense-tracker-all-2026-04-11.csv');
    expect(getCsvFilename({ scope: 'category', category: '交通' }, fixedNow)).toBe('expense-tracker-category-交通-2026-04-11.csv');
  });
});
