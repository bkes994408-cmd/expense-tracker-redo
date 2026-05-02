import { describe, expect, it } from 'vitest';
import { buildRecurringItemFromTransaction, getRecurringBatchToast, normalizeSavedTransaction } from '../app/appActions';
import type { Transaction } from '../domain/types';

const baseTxn: Transaction = {
  id: 1,
  name: '午餐',
  cat: '餐飲',
  amount: -120,
  date: '2026-04-26',
  time: '12:30',
};

describe('appActions', () => {
  it('normalizeSavedTransaction 會保留原幣別，否則沿用編輯或 fallback 幣別', () => {
    expect(normalizeSavedTransaction({ ...baseTxn, originalCurrency: 'USD' }, null, 'NTD').originalCurrency).toBe('USD');
    expect(normalizeSavedTransaction(baseTxn, { ...baseTxn, originalCurrency: 'JPY' }, 'NTD').originalCurrency).toBe('JPY');
    expect(normalizeSavedTransaction(baseTxn, null, 'NTD').originalCurrency).toBe('NTD');
  });

  it('buildRecurringItemFromTransaction 只在 isRec + freq 時建立定期帳目草稿', () => {
    expect(buildRecurringItemFromTransaction(baseTxn, 3)).toBeNull();

    const item = buildRecurringItemFromTransaction(
      { ...baseTxn, isRec: true, freq: 'monthly' },
      3,
      new Date('2026-04-26T10:00:00.000Z'),
      99,
    );

    expect(item).toMatchObject({
      id: 99,
      name: '午餐',
      cat: '餐飲',
      amount: -120,
      freq: 'monthly',
      nextDate: '2026-04-05',
      active: true,
      autoPost: false,
      autoPostMode: 'off',
      lastAutoPostCycle: null,
      pendingCycle: null,
    });
  });

  it('getRecurringBatchToast 會產生一致的批次操作提示', () => {
    expect(getRecurringBatchToast({ action: 'confirm-pending', affected: 0, target: 0 })).toEqual({
      msg: '沒有可操作的待確認項目',
      type: 'warn',
    });
    expect(getRecurringBatchToast({ action: 'enable', affected: 0, target: 2 })).toEqual({
      msg: '批次啟用完成（0/2 筆變更）',
      type: 'warn',
    });
    expect(getRecurringBatchToast({ action: 'disable', affected: 4, target: 5, names: ['A', 'B', 'C', 'D'] })).toEqual({
      msg: '批次停用完成（4/5 筆已更新）：A、B、C…',
    });
  });
});
