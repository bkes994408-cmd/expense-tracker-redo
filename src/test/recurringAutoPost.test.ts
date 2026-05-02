import { describe, expect, it, vi } from 'vitest';
import { confirmRecurringPending, reconcileRecurringAutoPost, skipRecurringPending } from '../domain/recurring';
import type { RecurringItem, Transaction } from '../domain/types';

describe('recurring auto-post baseline', () => {
  it('off / on / confirm 三態：只有 on 會在 reconcile 直接入帳', () => {
    vi.setSystemTime(new Date('2026-04-22T08:30:00Z'));
    const recurring: RecurringItem[] = [
      { id: 1, name: 'OFF', cat: '娛樂', amount: -100, freq: 'monthly', nextDate: '2026-04-22', active: true, autoPostMode: 'off' },
      { id: 2, name: 'ON', cat: '娛樂', amount: -200, freq: 'monthly', nextDate: '2026-04-22', active: true, autoPostMode: 'on' },
      { id: 3, name: 'CONFIRM', cat: '娛樂', amount: -300, freq: 'monthly', nextDate: '2026-04-22', active: true, autoPostMode: 'confirm' },
    ];
    const txns: Transaction[] = [];

    const result = reconcileRecurringAutoPost(recurring, txns, new Date());

    expect(result.autoPostedCount).toBe(1);
    expect(result.transactions).toHaveLength(1);
    expect(result.transactions[0]).toMatchObject({ name: 'ON', amount: -200, date: '2026-04-22' });

    expect(result.recurring.find((x) => x.id === 1)).toMatchObject({ nextDate: '2026-04-22', pendingCycle: null });
    expect(result.recurring.find((x) => x.id === 2)).toMatchObject({ nextDate: '2026-05-22', lastAutoPostCycle: '2026-04-22' });
    expect(result.recurring.find((x) => x.id === 3)).toMatchObject({ nextDate: '2026-04-22', pendingCycle: '2026-04-22', lastAutoPostCycle: null });
  });

  it('confirm 模式同一輪只會建立一次 pending，不會反覆 pending', () => {
    vi.setSystemTime(new Date('2026-04-22T09:00:00Z'));
    const recurring: RecurringItem[] = [
      { id: 1, name: 'Spotify', cat: '娛樂', amount: -149, freq: 'monthly', nextDate: '2026-04-22', active: true, autoPostMode: 'confirm', pendingCycle: '2026-04-22' },
    ];

    const result = reconcileRecurringAutoPost(recurring, [], new Date());

    expect(result.autoPostedCount).toBe(0);
    expect(result.transactions).toHaveLength(0);
    expect(result.recurring[0]).toMatchObject({ nextDate: '2026-04-22', pendingCycle: '2026-04-22' });
  });

  it('confirm 後可確認入帳或略過本輪，兩者都會推進 nextDate 並清除 pending', () => {
    const pendingRec: RecurringItem = {
      id: 1,
      name: 'Netflix',
      cat: '娛樂',
      amount: -390,
      freq: 'monthly',
      nextDate: '2026-04-22',
      active: true,
      autoPostMode: 'confirm',
      pendingCycle: '2026-04-22',
    };

    const confirmed = confirmRecurringPending(pendingRec);
    const skipped = skipRecurringPending(pendingRec);

    expect(confirmed).toMatchObject({ pendingCycle: null, lastAutoPostCycle: '2026-04-22', nextDate: '2026-05-22' });
    expect(skipped).toMatchObject({ pendingCycle: null, lastAutoPostCycle: '2026-04-22', nextDate: '2026-05-22' });
  });
});
