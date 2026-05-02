import type { RecurringFrequency, RecurringItem, Transaction } from '../domain/types';

export type TransactionSaveDraft = Transaction & {
  isRec?: boolean;
  freq?: RecurringFrequency;
};

export type RecurringBatchResult = {
  action: 'enable' | 'disable' | 'confirm-pending' | 'skip-pending';
  affected: number;
  target: number;
  names?: string[];
};

export type ToastIntent = {
  msg: string;
  type?: 'ok' | 'warn';
};

export function normalizeSavedTransaction(
  tx: TransactionSaveDraft,
  editTx: Transaction | null,
  fallbackCurrency: NonNullable<Transaction['originalCurrency']>,
): Transaction {
  return {
    ...tx,
    originalCurrency: tx.originalCurrency ?? (editTx?.originalCurrency ?? fallbackCurrency),
  };
}

export function buildRecurringItemFromTransaction(
  tx: TransactionSaveDraft,
  month: number,
  now: Date = new Date(),
  id: number = Date.now() + 1,
): RecurringItem | null {
  if (!tx.isRec || !tx.freq) return null;

  const nextDate = `${now.getFullYear()}-${String(month + 1).padStart(2, '0')}-05`;
  return {
    id,
    name: tx.name,
    cat: tx.cat,
    amount: tx.amount,
    freq: tx.freq,
    nextDate,
    active: true,
    autoPost: false,
    autoPostMode: 'off',
    lastAutoPostCycle: null,
    pendingCycle: null,
  };
}

export function getRecurringBatchToast(result: RecurringBatchResult): ToastIntent {
  const actionText = result.action === 'enable'
    ? '啟用'
    : result.action === 'disable'
      ? '停用'
      : result.action === 'confirm-pending'
        ? '確認入帳'
        : '略過本輪';

  if (result.target === 0) {
    return {
      msg: result.action === 'confirm-pending' || result.action === 'skip-pending'
        ? '沒有可操作的待確認項目'
        : '沒有可操作的定期帳目',
      type: 'warn',
    };
  }

  if (result.affected === 0) {
    return { msg: `批次${actionText}完成（0/${result.target} 筆變更）`, type: 'warn' };
  }

  const nameSuffix = result.names && result.names.length > 0
    ? `：${result.names.slice(0, 3).join('、')}${result.names.length > 3 ? '…' : ''}`
    : '';

  return { msg: `批次${actionText}完成（${result.affected}/${result.target} 筆已更新）${nameSuffix}` };
}
