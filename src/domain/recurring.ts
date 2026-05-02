import type { RecurringAutoPostMode, RecurringConfirmDateStrategy, RecurringItem, Transaction } from './types';
import { DEFAULT_BASE_CURRENCY } from '../utils/currencyDisplay';

const DATE_ONLY_RE = /^\d{4}-\d{2}-\d{2}$/;

export function parseDateOnly(dateStr: string) {
  if (!DATE_ONLY_RE.test(dateStr)) return null;
  const [y, m, d] = dateStr.split('-').map((x) => Number.parseInt(x, 10));
  const dt = new Date(y, m - 1, d);
  if (Number.isNaN(dt.getTime())) return null;
  return dt;
}

export function formatDateOnly(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function shiftRecurringDate(nextDate: string, freq: RecurringItem['freq'], step = 1) {
  const date = parseDateOnly(nextDate);
  if (!date) return nextDate;
  const moved = new Date(date);
  if (freq === 'daily') moved.setDate(moved.getDate() + step);
  if (freq === 'weekly') moved.setDate(moved.getDate() + step * 7);
  if (freq === 'monthly') moved.setMonth(moved.getMonth() + step);
  if (freq === 'yearly') moved.setFullYear(moved.getFullYear() + step);
  return formatDateOnly(moved);
}

export function normalizeRecurringItem(item: RecurringItem): RecurringItem {
  const resolvedMode: RecurringAutoPostMode = item.autoPostMode ?? (item.autoPost ? 'on' : 'off');
  return {
    ...item,
    autoPost: resolvedMode === 'on',
    autoPostMode: resolvedMode,
    lastAutoPostCycle: item.lastAutoPostCycle ?? null,
    pendingCycle: item.pendingCycle ?? null,
  };
}

export function buildRecurringTransaction(
  item: RecurringItem,
  now = new Date(),
  id = Date.now(),
  strategy: RecurringConfirmDateStrategy = 'today',
): Transaction {
  const cycleDate = item.pendingCycle && DATE_ONLY_RE.test(item.pendingCycle) ? item.pendingCycle : null;
  const txDate = strategy === 'cycle' ? (cycleDate ?? formatDateOnly(now)) : formatDateOnly(now);
  return {
    id,
    name: item.name,
    cat: item.cat,
    amount: item.amount,
    date: txDate,
    time: now.toTimeString().slice(0, 5),
    originalCurrency: DEFAULT_BASE_CURRENCY,
  };
}

export function confirmRecurringPending(item: RecurringItem): RecurringItem {
  const normalized = normalizeRecurringItem(item);
  const cycle = normalized.pendingCycle;
  if (!cycle) return normalized;
  return {
    ...normalized,
    pendingCycle: null,
    lastAutoPostCycle: cycle,
    nextDate: shiftRecurringDate(cycle, normalized.freq, 1),
  };
}

export function skipRecurringPending(item: RecurringItem): RecurringItem {
  return confirmRecurringPending(item);
}

export function reconcileRecurringAutoPost(
  recurring: RecurringItem[],
  transactions: Transaction[],
  now = new Date(),
): { recurring: RecurringItem[]; transactions: Transaction[]; autoPostedCount: number } {
  const today = formatDateOnly(now);
  let autoPostedCount = 0;
  let nextTxId = Math.max(0, ...transactions.map((x) => x.id)) + 1;
  const generated: Transaction[] = [];

  const nextRecurring = recurring.map((raw) => {
    const item = normalizeRecurringItem(raw);
    if (!item.active || !DATE_ONLY_RE.test(item.nextDate) || item.nextDate > today) {
      return item;
    }

    const mode = item.autoPostMode ?? 'off';
    if (mode === 'off') return item;

    if (mode === 'confirm') {
      if (item.lastAutoPostCycle === item.nextDate) {
        return {
          ...item,
          pendingCycle: null,
          nextDate: shiftRecurringDate(item.nextDate, item.freq, 1),
        };
      }
      if (item.pendingCycle === item.nextDate) {
        return item;
      }
      return {
        ...item,
        pendingCycle: item.nextDate,
      };
    }

    if (item.lastAutoPostCycle === item.nextDate) {
      return {
        ...item,
        nextDate: shiftRecurringDate(item.nextDate, item.freq, 1),
      };
    }

    generated.push({
      id: nextTxId++,
      name: item.name,
      cat: item.cat,
      amount: item.amount,
      date: today,
      time: now.toTimeString().slice(0, 5),
      originalCurrency: DEFAULT_BASE_CURRENCY,
    });
    autoPostedCount += 1;

    return {
      ...item,
      lastAutoPostCycle: item.nextDate,
      nextDate: shiftRecurringDate(item.nextDate, item.freq, 1),
    };
  });

  if (generated.length === 0) {
    return { recurring: nextRecurring, transactions, autoPostedCount };
  }

  return {
    recurring: nextRecurring,
    transactions: [...generated, ...transactions],
    autoPostedCount,
  };
}
