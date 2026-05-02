import { useEffect, useRef } from 'react';
import {
  buildRecurringTransaction,
  confirmRecurringPending,
  reconcileRecurringAutoPost,
  skipRecurringPending,
} from '../domain/recurring';
import type { AppTab } from '../store/appStore';
import type { RecurringConfirmDateStrategy, RecurringItem, Transaction } from '../domain/types';
import { getRecurringBatchToast, type RecurringBatchResult } from '../app/appActions';

type StoreSetter<T> = (updater: T | ((prev: T) => T)) => void;

type UseRecurringActionsArgs = {
  recurring: RecurringItem[];
  transactions: Transaction[];
  setRecurring: StoreSetter<RecurringItem[]>;
  setTransactions: StoreSetter<Transaction[]>;
  displayCurrency: NonNullable<Transaction['originalCurrency']>;
  screen: AppTab;
  toast: (msg: string, type?: 'ok' | 'warn') => void;
};

export function useRecurringActions({
  recurring,
  transactions,
  setRecurring,
  setTransactions,
  displayCurrency,
  screen,
  toast,
}: UseRecurringActionsArgs) {
  const autoPostRanOnceRef = useRef(false);

  function runRecurringAutoPostReconcile(silent = false) {
    const result = reconcileRecurringAutoPost(recurring, transactions, new Date());
    if (result.autoPostedCount <= 0) {
      if (result.recurring !== recurring) setRecurring(result.recurring);
      return;
    }

    setRecurring(result.recurring);
    setTransactions(result.transactions);
    if (!silent) {
      toast(`已自動入帳 ${result.autoPostedCount} 筆到期定期帳目`);
    }
  }

  useEffect(() => {
    runRecurringAutoPostReconcile(true);
    autoPostRanOnceRef.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!autoPostRanOnceRef.current) return;
    if (screen === 1) {
      runRecurringAutoPostReconcile(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screen]);

  function toggleRecurring(id: number, active: boolean) {
    setRecurring((p) => p.map((x) => (x.id === id ? { ...x, active } : x)));
  }

  function handleRecurringBatchResult(result: RecurringBatchResult) {
    const nextToast = getRecurringBatchToast(result);
    toast(nextToast.msg, nextToast.type);
  }

  function confirmRecurringPendingCycle(id: number, strategy: RecurringConfirmDateStrategy) {
    const target = recurring.find((x) => x.id === id);
    if (!target?.pendingCycle) {
      toast('此筆目前沒有待確認輪次', 'warn');
      return;
    }

    setTransactions((p) => {
      const nextId = Math.max(0, ...p.map((x) => x.id)) + 1;
      const tx = { ...buildRecurringTransaction(target, new Date(), nextId, strategy), originalCurrency: displayCurrency };
      return [tx, ...p];
    });
    setRecurring((p) => p.map((x) => (x.id === id ? confirmRecurringPending(x) : x)));
    const dateHint = strategy === 'cycle' ? '（交易日期採到期日）' : '（交易日期採今天）';
    toast(`已確認入帳：${target.name}${dateHint}`);
  }

  function skipRecurringPendingCycle(id: number) {
    const target = recurring.find((x) => x.id === id);
    if (!target?.pendingCycle) {
      toast('此筆目前沒有待確認輪次', 'warn');
      return;
    }

    setRecurring((p) => p.map((x) => (x.id === id ? skipRecurringPending(x) : x)));
    toast(`已略過本輪：${target.name}`);
  }

  function saveRecurring(id: number, patch: Partial<RecurringItem>) {
    setRecurring((p) => p.map((x) => (x.id === id ? { ...x, ...patch } : x)));
    toast('已更新定期帳目 ✓');
  }

  function deleteRecurring(id: number) {
    setRecurring((p) => p.filter((x) => x.id !== id));
    toast('已刪除定期帳目', 'warn');
  }

  return {
    runRecurringAutoPostReconcile,
    toggleRecurring,
    handleRecurringBatchResult,
    confirmRecurringPendingCycle,
    skipRecurringPendingCycle,
    saveRecurring,
    deleteRecurring,
  };
}
