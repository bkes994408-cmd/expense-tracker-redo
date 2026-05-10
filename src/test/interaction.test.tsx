import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TxnModal } from '../components/modals/TxnModal';
import { BudgetTab } from '../pages/reports/BudgetTab';
import { HomePage } from '../pages/home/HomePage';
import { INITIAL_BUDGETS } from '../domain/initialData';
import type { BudgetMap, Transaction } from '../domain/types';
import { TransactionsPage } from '../pages/transactions/TransactionsPage';
import { RecordsTab } from '../pages/transactions/RecordsTab';
import { TxnRow } from '../pages/transactions/TxnRow';
import { SettingsPage } from '../pages/settings/SettingsPage';
import { ReportTab } from '../pages/reports/ReportTab';
import { ReportsPage } from '../pages/reports/ReportsPage';
import { getCsvFilename } from '../utils/csv';
import { f, r, t } from './testTheme';
const SAMPLE_TXNS: Transaction[] = [
  { id: 1, name: '測試午餐', cat: '餐飲', amount: -120, date: '2026-04-10', time: '12:30' },
];

const SAMPLE_RECURRING = [
  { id: 1, name: '定期訂閱', cat: '娛樂' as const, amount: -149, freq: 'monthly' as const, nextDate: '2026-05-01', active: true },
];

describe('interaction', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    try {
      vi.runOnlyPendingTimers();
    } catch {
      // Some tests intentionally switch back to real timers for async fetch flows.
    }
    vi.useRealTimers();
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it('BudgetTab 可編輯單一分類預算', () => {
    let budgets: BudgetMap = { ...INITIAL_BUDGETS };
    const setBudgets = (updater: BudgetMap | ((prev: BudgetMap) => BudgetMap)) => {
      budgets = typeof updater === 'function' ? updater(budgets) : updater;
    };

    render(<BudgetTab txns={SAMPLE_TXNS} currency="NTD" budgets={budgets} setBudgets={setBudgets} t={t} r={r} f={f} />);

    fireEvent.click(screen.getByLabelText('編輯餐飲預算'));
    fireEvent.change(screen.getByDisplayValue('0'), { target: { value: '6200' } });
    fireEvent.click(screen.getByLabelText('儲存餐飲預算'));

    expect(budgets.餐飲).toBe(6200);
  });

  it('BudgetTab 會依 display currency 套用一致的格式策略（USD 有小數、JPY 無小數）', () => {
    const { rerender } = render(<BudgetTab txns={SAMPLE_TXNS} currency="USD" budgets={{ ...INITIAL_BUDGETS, 餐飲: 500 }} setBudgets={() => {}} t={t} r={r} f={f} />);
    expect(screen.getByText('US$120.00')).toBeInTheDocument();
    expect(screen.getByText('US$500.00')).toBeInTheDocument();

    rerender(<BudgetTab txns={SAMPLE_TXNS} currency="JPY" budgets={{ ...INITIAL_BUDGETS, 餐飲: 500 }} setBudgets={() => {}} t={t} r={r} f={f} />);
    expect(screen.getByText('JP¥120')).toBeInTheDocument();
    expect(screen.getByText('JP¥500')).toBeInTheDocument();
  });

  it('TxnModal 可新增交易並關閉', () => {
    const onSave = vi.fn();
    const onClose = vi.fn();

    render(<TxnModal t={t} r={r} f={f} initial={null} month={3} onSave={onSave} onClose={onClose} />);

    fireEvent.click(screen.getByText('手動輸入'));
    fireEvent.change(screen.getByRole('spinbutton'), { target: { value: '350' } });
    fireEvent.change(screen.getByPlaceholderText('備註說明…'), { target: { value: '測試晚餐' } });
    fireEvent.click(screen.getByText('餐飲'));
    fireEvent.click(screen.getByText('儲存'));

    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onSave.mock.calls[0][0]).toMatchObject({ name: '測試晚餐', cat: '餐飲', amount: -350 });

    vi.advanceTimersByTime(300);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('TxnModal 快速輸入可解析並帶入資料', () => {
    const onSave = vi.fn();

    render(<TxnModal t={t} r={r} f={f} initial={null} month={3} onSave={onSave} onClose={() => {}} />);

    fireEvent.click(screen.getByText('快速輸入'));
    fireEvent.change(screen.getByLabelText('快速輸入記帳'), { target: { value: 'uber 280 交通' } });
    fireEvent.click(screen.getByLabelText('解析快速輸入'));

    expect(screen.getByDisplayValue('uber')).toBeInTheDocument();
    expect(screen.getByText('已帶入：uber / 支出 / 交通 / 280')).toBeInTheDocument();

    fireEvent.click(screen.getByText('儲存'));
    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ name: 'uber', cat: '交通', amount: -280 }));
  });

  it('TxnModal 快速輸入會顯示預覽卡，且支援快捷送出', () => {
    const onSave = vi.fn();
    const onClose = vi.fn();

    render(<TxnModal t={t} r={r} f={f} initial={null} month={3} onSave={onSave} onClose={onClose} />);

    fireEvent.click(screen.getByText('快速輸入'));
    fireEvent.change(screen.getByLabelText('快速輸入記帳'), { target: { value: '退款 120' } });

    expect(screen.getByLabelText('快速輸入預覽')).toHaveTextContent('收入 · 收入 · 退款 · 120');

    fireEvent.keyDown(screen.getByLabelText('快速輸入記帳'), { key: 'Enter', ctrlKey: true });
    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ name: '退款', cat: '收入', amount: 120 }));

    vi.advanceTimersByTime(300);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('TxnModal 支援負數 shorthand 與幣別語法', () => {
    const onSave = vi.fn();

    const first = render(<TxnModal t={t} r={r} f={f} initial={null} month={3} onSave={onSave} onClose={() => {}} />);

    fireEvent.click(screen.getByText('快速輸入'));
    fireEvent.change(screen.getByLabelText('快速輸入記帳'), { target: { value: '-50' } });
    fireEvent.click(screen.getByLabelText('解析快速輸入'));
    expect(screen.getByDisplayValue('快速支出')).toBeInTheDocument();

    first.unmount();
    onSave.mockReset();

    render(<TxnModal t={t} r={r} f={f} initial={null} month={3} onSave={onSave} onClose={() => {}} initialTab="quick" initialQuickInput="USD 20 lunch" />);
    fireEvent.click(screen.getByLabelText('解析快速輸入'));
    fireEvent.click(screen.getByText('儲存'));
    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ name: 'lunch', originalCurrency: 'USD', amount: -20 }));
  });

  it('HomePage 會提供首頁 quick entry 快捷入口', () => {
    const onQuickEntryOpen = vi.fn();

    render(
      <HomePage
        txns={SAMPLE_TXNS}
        budgets={INITIAL_BUDGETS}
        recurring={[]}
        goals={[]}
        loading={false}
        currency="NTD"
        recentQuickEntries={['今天午餐 120']}
        onQuickEntryOpen={onQuickEntryOpen}
        t={t}
        r={r}
        f={f}
      />,
    );

    fireEvent.click(screen.getByLabelText('首頁快速記一筆'));
    expect(onQuickEntryOpen).toHaveBeenCalledWith();

    fireEvent.click(screen.getByLabelText('首頁最近快速輸入今天午餐 120'));
    expect(onQuickEntryOpen).toHaveBeenCalledWith('今天午餐 120');
  });

  it('TxnModal 快速輸入解析失敗時會顯示明確提示', () => {
    render(<TxnModal t={t} r={r} f={f} initial={null} month={3} onSave={() => {}} onClose={() => {}} />);

    fireEvent.click(screen.getByText('快速輸入'));
    fireEvent.change(screen.getByLabelText('快速輸入記帳'), { target: { value: '午餐' } });
    fireEvent.click(screen.getByLabelText('解析快速輸入'));

    expect(screen.getByText('我看不懂金額，請補上數字，例如：買咖啡 90')).toBeInTheDocument();
  });

  it('TxnModal 可顯示並套用最近快速輸入', () => {
    const onUseQuickEntry = vi.fn();

    render(
      <TxnModal
        t={t}
        r={r}
        f={f}
        initial={null}
        month={3}
        onSave={() => {}}
        onClose={() => {}}
        recentQuickEntries={['今天午餐 120']}
        onUseQuickEntry={onUseQuickEntry}
      />,
    );

    fireEvent.click(screen.getByText('快速輸入'));
    fireEvent.click(screen.getByLabelText('最近快速輸入今天午餐 120'));
    expect(screen.getByLabelText('快速輸入記帳')).toHaveValue('今天午餐 120');

    fireEvent.click(screen.getByLabelText('解析快速輸入'));
    expect(screen.getByDisplayValue('午餐')).toBeInTheDocument();
    expect(onUseQuickEntry).toHaveBeenCalledWith('今天午餐 120');
  });

  it('TxnModal 編輯模式可更新為收入', () => {
    const onSave = vi.fn();

    const existing: Transaction = {
      id: 88,
      name: '午餐',
      cat: '餐飲',
      amount: -120,
      date: '2026-04-08',
      time: '12:00',
    };

    render(<TxnModal t={t} r={r} f={f} initial={existing} month={3} onSave={onSave} onClose={() => {}} />);

    fireEvent.click(screen.getByText('收入'));
    fireEvent.click(screen.getByText('手動輸入'));
    fireEvent.change(screen.getByRole('spinbutton'), { target: { value: '800' } });
    fireEvent.change(screen.getByPlaceholderText('備註說明…'), { target: { value: '退款' } });
    fireEvent.click(screen.getByText('更新'));

    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onSave.mock.calls[0][0]).toMatchObject({ id: 88, name: '退款', cat: '收入', amount: 800 });
  });

  it('TxnRow 左滑後可觸發編輯 action', () => {
    const onEdit = vi.fn();
    const onDelete = vi.fn();

    const tx: Transaction = {
      id: 456,
      name: '左滑編輯測試',
      cat: '餐飲',
      amount: -88,
      date: '2026-04-11',
      time: '09:30',
    };

    render(<TxnRow tx={tx} currency="NTD" t={t} r={r} f={f} onEdit={onEdit} onDelete={onDelete} />);

    const row = screen.getByLabelText('交易列左滑編輯測試');
    expect(row).toHaveAttribute('data-swipe-state', 'closed');
    fireEvent.mouseDown(row, { clientX: 160, clientY: 20 });
    fireEvent.mouseMove(row, { clientX: 70, clientY: 20 });
    fireEvent.mouseUp(row);
    expect(row).toHaveAttribute('data-swipe-state', 'open');

    fireEvent.click(screen.getByLabelText('編輯左滑編輯測試'));

    expect(onEdit).toHaveBeenCalledTimes(1);
    expect(onEdit).toHaveBeenCalledWith(tx);
    expect(onDelete).not.toHaveBeenCalled();
  });

  it('TxnRow 支援 pointer 事件左滑後可觸發編輯 action', () => {
    const onEdit = vi.fn();
    const onDelete = vi.fn();

    const tx: Transaction = {
      id: 790,
      name: 'pointer 左滑編輯測試',
      cat: '餐飲',
      amount: -66,
      date: '2026-04-11',
      time: '11:10',
    };

    render(<TxnRow tx={tx} currency="NTD" t={t} r={r} f={f} onEdit={onEdit} onDelete={onDelete} />);

    const row = screen.getByLabelText('交易列pointer 左滑編輯測試');
    fireEvent.pointerDown(row, { pointerId: 1, pointerType: 'touch', clientX: 160 });
    fireEvent.pointerMove(row, { pointerId: 1, pointerType: 'touch', clientX: 70 });
    fireEvent.pointerUp(row, { pointerId: 1, pointerType: 'touch' });

    fireEvent.click(screen.getByLabelText('編輯pointer 左滑編輯測試'));

    expect(onEdit).toHaveBeenCalledTimes(1);
    expect(onEdit).toHaveBeenCalledWith(tx);
    expect(onDelete).not.toHaveBeenCalled();
  });

  it('TxnRow 會顯示 original/display 幣別語意（未換算）', () => {
    const tx: Transaction = {
      id: 9527,
      name: '幣別語意測試',
      cat: '餐飲',
      amount: -250,
      date: '2026-04-11',
      time: '11:20',
      originalCurrency: 'NTD',
    };

    render(<TxnRow tx={tx} currency="USD" t={t} r={r} f={f} onEdit={() => {}} onDelete={() => {}} />);

    expect(screen.getByLabelText('交易幣別語意幣別語意測試')).toHaveTextContent('原始 NT$ → 顯示 US$（未換算）');
    expect(screen.getByText('US$250.00')).toBeInTheDocument();
  });

  it('TxnRow 左滑後可觸發刪除 action', () => {
    const onEdit = vi.fn();
    const onDelete = vi.fn();

    const tx: Transaction = {
      id: 789,
      name: '左滑刪除測試',
      cat: '交通',
      amount: -120,
      date: '2026-04-11',
      time: '10:10',
    };

    render(<TxnRow tx={tx} currency="NTD" t={t} r={r} f={f} onEdit={onEdit} onDelete={onDelete} />);

    const row = screen.getByLabelText('交易列左滑刪除測試');
    fireEvent.mouseDown(row, { clientX: 180 });
    fireEvent.mouseMove(row, { clientX: 20 });
    fireEvent.mouseUp(row);

    fireEvent.click(screen.getByLabelText('刪除左滑刪除測試'));

    expect(onDelete).not.toHaveBeenCalled();
    vi.advanceTimersByTime(360);
    expect(onDelete).toHaveBeenCalledTimes(1);
    expect(onDelete).toHaveBeenCalledWith(789);
    expect(onEdit).not.toHaveBeenCalled();
  });

  it('TxnRow 支援 touch 事件左滑後可觸發刪除 action', () => {
    const onEdit = vi.fn();
    const onDelete = vi.fn();

    const tx: Transaction = {
      id: 791,
      name: 'touch 左滑刪除測試',
      cat: '交通',
      amount: -120,
      date: '2026-04-11',
      time: '11:20',
    };

    render(<TxnRow tx={tx} currency="NTD" t={t} r={r} f={f} onEdit={onEdit} onDelete={onDelete} />);

    const row = screen.getByLabelText('交易列touch 左滑刪除測試');
    fireEvent.touchStart(row, { touches: [{ identifier: 1, clientX: 180, clientY: 0 }] });
    fireEvent.touchMove(row, { touches: [{ identifier: 1, clientX: 20, clientY: 0 }] });
    fireEvent.touchEnd(row);

    fireEvent.click(screen.getByLabelText('刪除touch 左滑刪除測試'));

    expect(onDelete).not.toHaveBeenCalled();
    vi.advanceTimersByTime(360);
    expect(onDelete).toHaveBeenCalledTimes(1);
    expect(onDelete).toHaveBeenCalledWith(791);
    expect(onEdit).not.toHaveBeenCalled();
  });

  it('RecordsTab 同時間只會保持一列展開', () => {
    const onEdit = vi.fn();
    const onDelete = vi.fn();
    const txns: Transaction[] = [
      { id: 11, name: '第一列', cat: '餐飲', amount: -100, date: '2026-04-11', time: '09:00' },
      { id: 12, name: '第二列', cat: '交通', amount: -200, date: '2026-04-11', time: '10:00' },
    ];

    render(<RecordsTab txns={txns} currency="NTD" t={t} r={r} f={f} onEdit={onEdit} onDelete={onDelete} />);

    const firstRow = screen.getByLabelText('交易列第一列');
    const secondRow = screen.getByLabelText('交易列第二列');

    fireEvent.pointerDown(firstRow, { pointerId: 1, pointerType: 'touch', clientX: 180, clientY: 10 });
    fireEvent.pointerMove(firstRow, { pointerId: 1, pointerType: 'touch', clientX: 20, clientY: 10 });
    fireEvent.pointerUp(firstRow, { pointerId: 1, pointerType: 'touch' });
    expect(firstRow).toHaveAttribute('data-swipe-state', 'open');
    expect(secondRow).toHaveAttribute('data-swipe-state', 'closed');

    fireEvent.pointerDown(secondRow, { pointerId: 2, pointerType: 'touch', clientX: 180, clientY: 10 });
    fireEvent.pointerMove(secondRow, { pointerId: 2, pointerType: 'touch', clientX: 20, clientY: 10 });
    fireEvent.pointerUp(secondRow, { pointerId: 2, pointerType: 'touch' });

    expect(firstRow).toHaveAttribute('data-swipe-state', 'closed');
    expect(secondRow).toHaveAttribute('data-swipe-state', 'open');
  });

  it('RecordsTab 切換篩選或排序時會收回已展開列', () => {
    const onEdit = vi.fn();
    const onDelete = vi.fn();
    const txns: Transaction[] = [
      { id: 13, name: '收回第一列', cat: '餐飲', amount: -100, date: '2026-04-11', time: '09:00' },
    ];

    render(<RecordsTab txns={txns} currency="NTD" t={t} r={r} f={f} onEdit={onEdit} onDelete={onDelete} />);

    const row = screen.getByLabelText('交易列收回第一列');
    fireEvent.pointerDown(row, { pointerId: 1, pointerType: 'touch', clientX: 180, clientY: 10 });
    fireEvent.pointerMove(row, { pointerId: 1, pointerType: 'touch', clientX: 20, clientY: 10 });
    fireEvent.pointerUp(row, { pointerId: 1, pointerType: 'touch' });
    expect(row).toHaveAttribute('data-swipe-state', 'open');

    fireEvent.click(screen.getByText('餐飲'));
    expect(row).toHaveAttribute('data-swipe-state', 'closed');

    fireEvent.pointerDown(row, { pointerId: 2, pointerType: 'touch', clientX: 180, clientY: 10 });
    fireEvent.pointerMove(row, { pointerId: 2, pointerType: 'touch', clientX: 20, clientY: 10 });
    fireEvent.pointerUp(row, { pointerId: 2, pointerType: 'touch' });
    expect(row).toHaveAttribute('data-swipe-state', 'open');

    fireEvent.click(screen.getByText('名稱'));
    expect(row).toHaveAttribute('data-swipe-state', 'closed');
  });

  it('TxnRow 展開後點一下列本身會先收回，不直接進編輯', () => {
    const onEdit = vi.fn();
    const tx: Transaction = {
      id: 794,
      name: '點擊收回測試',
      cat: '交通',
      amount: -120,
      date: '2026-04-11',
      time: '11:25',
    };

    render(<TxnRow tx={tx} currency="NTD" t={t} r={r} f={f} onEdit={onEdit} onDelete={() => {}} />);

    const row = screen.getByLabelText('交易列點擊收回測試');
    fireEvent.pointerDown(row, { pointerId: 1, pointerType: 'touch', clientX: 180, clientY: 10 });
    fireEvent.pointerMove(row, { pointerId: 1, pointerType: 'touch', clientX: 20, clientY: 10 });
    fireEvent.pointerUp(row, { pointerId: 1, pointerType: 'touch' });
    expect(row).toHaveAttribute('data-swipe-state', 'open');

    fireEvent.click(row);
    expect(row).toHaveAttribute('data-swipe-state', 'closed');
    expect(onEdit).not.toHaveBeenCalled();

    fireEvent.click(row);
    expect(onEdit).toHaveBeenCalledTimes(1);
    expect(onEdit).toHaveBeenCalledWith(tx);
  });

  it('TxnRow 支援鍵盤 Enter/Space 與 Escape 收回', () => {
    const onEdit = vi.fn();
    const tx: Transaction = {
      id: 796,
      name: '鍵盤測試',
      cat: '交通',
      amount: -120,
      date: '2026-04-11',
      time: '11:25',
    };

    render(<TxnRow tx={tx} currency="NTD" t={t} r={r} f={f} onEdit={onEdit} onDelete={() => {}} />);

    const row = screen.getByLabelText('交易列鍵盤測試');
    expect(row).toHaveAttribute('role', 'button');
    expect(row).toHaveAttribute('aria-expanded', 'false');

    fireEvent.keyDown(row, { key: 'Enter' });
    expect(onEdit).toHaveBeenCalledTimes(1);

    fireEvent.pointerDown(row, { pointerId: 1, pointerType: 'touch', clientX: 180, clientY: 10 });
    fireEvent.pointerMove(row, { pointerId: 1, pointerType: 'touch', clientX: 20, clientY: 10 });
    fireEvent.pointerUp(row, { pointerId: 1, pointerType: 'touch' });
    expect(row).toHaveAttribute('aria-expanded', 'true');

    fireEvent.keyDown(row, { key: 'Escape' });
    expect(row).toHaveAttribute('aria-expanded', 'false');

    fireEvent.keyDown(row, { key: ' ' });
    expect(onEdit).toHaveBeenCalledTimes(2);
  });

  it('TxnRow 已展開時可右滑收回 actions', () => {
    const onEdit = vi.fn();
    const onDelete = vi.fn();

    const tx: Transaction = {
      id: 792,
      name: '右滑收回測試',
      cat: '交通',
      amount: -120,
      date: '2026-04-11',
      time: '11:25',
    };

    render(<TxnRow tx={tx} currency="NTD" t={t} r={r} f={f} onEdit={onEdit} onDelete={onDelete} />);

    const row = screen.getByLabelText('交易列右滑收回測試');
    fireEvent.pointerDown(row, { pointerId: 1, pointerType: 'touch', clientX: 180, clientY: 10 });
    fireEvent.pointerMove(row, { pointerId: 1, pointerType: 'touch', clientX: 20, clientY: 10 });
    fireEvent.pointerUp(row, { pointerId: 1, pointerType: 'touch' });
    expect(row).toHaveAttribute('data-swipe-state', 'open');

    fireEvent.pointerDown(row, { pointerId: 1, pointerType: 'touch', clientX: 40, clientY: 10 });
    fireEvent.pointerMove(row, { pointerId: 1, pointerType: 'touch', clientX: 150, clientY: 10 });
    fireEvent.pointerUp(row, { pointerId: 1, pointerType: 'touch' });
    expect(row).toHaveAttribute('data-swipe-state', 'closed');
  });

  it('TxnRow 垂直手勢不應誤觸 swipe 狀態', () => {
    const tx: Transaction = {
      id: 793,
      name: '垂直手勢測試',
      cat: '餐飲',
      amount: -50,
      date: '2026-04-11',
      time: '12:00',
    };

    render(<TxnRow tx={tx} currency="NTD" t={t} r={r} f={f} onEdit={() => {}} onDelete={() => {}} />);

    const row = screen.getByLabelText('交易列垂直手勢測試');
    fireEvent.touchStart(row, { touches: [{ identifier: 1, clientX: 120, clientY: 20 }] });
    fireEvent.touchMove(row, { touches: [{ identifier: 1, clientX: 110, clientY: 120 }] });
    fireEvent.touchEnd(row);

    expect(row).toHaveAttribute('data-swipe-state', 'closed');
  });

  it('TxnRow 拖曳時會暴露 swipe progress，且可有輕微 overshoot 手感', () => {
    const tx: Transaction = {
      id: 795,
      name: 'overshoot 測試',
      cat: '餐飲',
      amount: -80,
      date: '2026-04-11',
      time: '12:00',
    };

    render(<TxnRow tx={tx} currency="NTD" t={t} r={r} f={f} onEdit={() => {}} onDelete={() => {}} />);

    const row = screen.getByLabelText('交易列overshoot 測試');
    fireEvent.pointerDown(row, { pointerId: 1, pointerType: 'touch', clientX: 180, clientY: 10 });
    fireEvent.pointerMove(row, { pointerId: 1, pointerType: 'touch', clientX: -30, clientY: 10 });

    expect(Number(row.getAttribute('data-swipe-progress'))).toBeGreaterThan(0.9);
    expect((row as HTMLDivElement).style.transform).toContain('translateX(-');

    fireEvent.pointerUp(row, { pointerId: 1, pointerType: 'touch' });
    expect(row).toHaveAttribute('data-swipe-state', 'open');
  });

  it('TxnRow 快速左 flick 即使距離較短也會展開', () => {
    const tx: Transaction = {
      id: 794,
      name: '快速左滑測試',
      cat: '交通',
      amount: -70,
      date: '2026-04-11',
      time: '12:10',
    };

    render(<TxnRow tx={tx} currency="NTD" t={t} r={r} f={f} onEdit={() => {}} onDelete={() => {}} />);

    const row = screen.getByLabelText('交易列快速左滑測試');
    fireEvent.pointerDown(row, { pointerId: 1, pointerType: 'touch', clientX: 180, clientY: 10 });
    vi.advanceTimersByTime(1);
    fireEvent.pointerMove(row, { pointerId: 1, pointerType: 'touch', clientX: 150, clientY: 10 });
    vi.advanceTimersByTime(1);
    fireEvent.pointerUp(row, { pointerId: 1, pointerType: 'touch' });

    expect(row).toHaveAttribute('data-swipe-state', 'open');
  });

  it('TxnRow 快速右 flick 可直接收回已展開狀態', () => {
    const tx: Transaction = {
      id: 795,
      name: '快速右滑收回測試',
      cat: '交通',
      amount: -70,
      date: '2026-04-11',
      time: '12:20',
    };

    render(<TxnRow tx={tx} currency="NTD" t={t} r={r} f={f} onEdit={() => {}} onDelete={() => {}} />);

    const row = screen.getByLabelText('交易列快速右滑收回測試');
    fireEvent.pointerDown(row, { pointerId: 1, pointerType: 'touch', clientX: 180, clientY: 10 });
    fireEvent.pointerMove(row, { pointerId: 1, pointerType: 'touch', clientX: 20, clientY: 10 });
    fireEvent.pointerUp(row, { pointerId: 1, pointerType: 'touch' });
    expect(row).toHaveAttribute('data-swipe-state', 'open');

    fireEvent.pointerDown(row, { pointerId: 1, pointerType: 'touch', clientX: 60, clientY: 10 });
    vi.advanceTimersByTime(1);
    fireEvent.pointerMove(row, { pointerId: 1, pointerType: 'touch', clientX: 100, clientY: 10 });
    vi.advanceTimersByTime(1);
    fireEvent.pointerUp(row, { pointerId: 1, pointerType: 'touch' });

    expect(row).toHaveAttribute('data-swipe-state', 'closed');
  });

  it('RecordsTab 可重新套用分類規則且保護手動分類', () => {
    const onReapplyCategoryRules = vi.fn(() => ({
      scanned: 2,
      eligible: 1,
      changed: 1,
      unchanged: 0,
      skippedManual: 1,
      changedNames: ['uber'],
      transactions: [],
    }));

    render(
      <RecordsTab
        txns={[
          { id: 1, name: 'uber', cat: '餐飲', amount: -280, date: '2026-04-10', time: '12:30', categorySource: 'system', categoryRuleVersion: 'old' },
          { id: 2, name: '星巴克', cat: '交通', amount: -120, date: '2026-04-10', time: '13:30', categorySource: 'user' },
        ]}
        currency="NTD"
        t={t}
        r={r}
        f={f}
        onEdit={() => {}}
        onDelete={() => {}}
        onReapplyCategoryRules={onReapplyCategoryRules}
      />,
    );

    expect(screen.getByLabelText('分類規則重新套用區')).toHaveTextContent('可重新套用 1 筆');
    expect(screen.getByLabelText('分類規則重新套用區')).toHaveTextContent('手動分類不會被覆蓋');

    fireEvent.click(screen.getByRole('button', { name: '重新套用分類規則' }));

    expect(onReapplyCategoryRules).toHaveBeenCalledWith(expect.arrayContaining([1, 2]));
    expect(screen.getByLabelText('分類規則重新套用結果')).toHaveTextContent('已更新 1/1 筆：uber');
  });

  it('TransactionsPage 會用 updater 更新月份（對應 store update 路徑）', () => {
    let month = 3;

    const setMonth = (updater: number | ((prev: number) => number)) => {
      month = typeof updater === 'function' ? updater(month) : updater;
    };

    render(
      <TransactionsPage
        txns={SAMPLE_TXNS}
        recurring={SAMPLE_RECURRING}
        t={t}
        r={r}
        f={f}
        currency="NTD"
        onEdit={() => {}}
        onDelete={() => {}}
        onRecChange={() => {}}
        onRecSave={() => {}}
        onRecDelete={() => {}}
        month={month}
        setMonth={setMonth}
      />,
    );

    const navButtons = screen.getAllByRole('button');
    fireEvent.click(navButtons[1]);
    expect(month).toBe(4);
    fireEvent.click(navButtons[0]);
    expect(month).toBe(3);
  });

  it('TransactionsPage 定期帳目可編輯並刪除', () => {
    const onRecSave = vi.fn();
    const onRecDelete = vi.fn();

    render(
      <TransactionsPage
        txns={SAMPLE_TXNS}
        recurring={SAMPLE_RECURRING}
        t={t}
        r={r}
        f={f}
        currency="NTD"
        onEdit={() => {}}
        onDelete={() => {}}
        onRecChange={() => {}}
        onRecSave={onRecSave}
        onRecDelete={onRecDelete}
        month={3}
        setMonth={() => {}}
      />,
    );

    fireEvent.click(screen.getByText('定期帳目'));
    fireEvent.click(screen.getByLabelText('編輯定期訂閱'));
    fireEvent.change(screen.getByDisplayValue('定期訂閱'), { target: { value: '更新後名稱' } });
    fireEvent.change(screen.getByLabelText('下次扣款日期定期訂閱'), { target: { value: '2026-06-01' } });
    fireEvent.change(screen.getByLabelText('自動入帳模式定期訂閱'), { target: { value: 'on' } });
    fireEvent.click(screen.getByLabelText('儲存定期訂閱'));
    expect(onRecSave).toHaveBeenCalledTimes(1);
    expect(onRecSave).toHaveBeenCalledWith(1, expect.objectContaining({ nextDate: '2026-06-01', autoPostMode: 'on', autoPost: true }));

    fireEvent.click(screen.getByLabelText('刪除定期訂閱'));
    expect(onRecDelete).toHaveBeenCalledWith(1);
  });

  it('SettingsPage 所有可見 row 皆可互動', () => {
    const setStyle = vi.fn();
    const setMode = vi.fn();
    const setCurrency = vi.fn();
    const setMonthStartDay = vi.fn();
    const setBillReminder = vi.fn();
    const setICloudBackup = vi.fn();
    const getCsvExportCount = vi.fn((options: { scope: 'month' | 'all' | 'category'; category?: string }) => {
      if (options.scope === 'all') return 2;
      if (options.scope === 'category') return options.category === '交通' ? 1 : 0;
      return 1;
    });
    const onExportCsv = vi.fn();
    const onClearAllData = vi.fn();
    const onRateApp = vi.fn();
    const writeTextMock = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: writeTextMock },
      configurable: true,
    });

    render(
      <SettingsPage
        t={t}
        r={r}
        f={f}
        style="minimal"
        setStyle={setStyle}
        mode="light"
        setMode={setMode}
        currency="NTD"
        setCurrency={setCurrency}
        monthStartDay={1}
        setMonthStartDay={setMonthStartDay}
        billReminder
        setBillReminder={setBillReminder}
        iCloudBackup={false}
        setICloudBackup={setICloudBackup}
        exportCategories={['餐飲', '交通']}
        getCsvExportCount={getCsvExportCount}
        onExportCsv={onExportCsv}
        onClearAllData={onClearAllData}
        onRateApp={onRateApp}
      />,
    );

    fireEvent.click(screen.getByText('質感設計'));
    fireEvent.click(screen.getByText('預設幣別'));
    fireEvent.click(screen.getByLabelText('選擇幣別USD'));
    expect(screen.getByLabelText('匯率資料狀態')).toHaveTextContent('目前不自動換算');
    expect(screen.getByLabelText('匯率資料狀態')).toHaveTextContent('尚未設定匯率來源');
    expect(screen.getByLabelText('匯率資料狀態')).toHaveTextContent('只切換符號與格式');
    fireEvent.click(screen.getByText('每月起始日'));
    fireEvent.click(screen.getByLabelText('選擇每月起始日15'));
    fireEvent.click(screen.getByText('全部'));
    expect(screen.getByLabelText('CSV匯出預覽')).toHaveTextContent('預計匯出 2 筆記錄');
    expect(screen.getByLabelText('CSV匯出檔名預覽')).toHaveTextContent(`下載檔名：${getCsvFilename({ scope: 'all' })}`);
    fireEvent.click(screen.getByRole('button', { name: '匯出 CSV' }));
    fireEvent.click(screen.getByText('分類'));
    expect(screen.getByLabelText('CSV匯出預覽')).toHaveTextContent('請先選擇分類');
    expect(screen.getByLabelText('CSV匯出檔名預覽')).toHaveTextContent('請先選擇分類後產生檔名');
    expect(screen.getByRole('button', { name: '匯出 CSV' })).toBeDisabled();
    fireEvent.change(screen.getByLabelText('CSV分類匯出分類'), { target: { value: '交通' } });
    expect(screen.getByLabelText('CSV匯出檔名預覽')).toHaveTextContent(`下載檔名：${getCsvFilename({ scope: 'category', category: '交通' })}`);
    fireEvent.click(screen.getByRole('button', { name: '匯出 CSV' }));
    expect(screen.getByLabelText('同步狀態中心')).toHaveTextContent('目前資料只儲存在此裝置');
    expect(screen.getByLabelText('同步狀態項目')).toHaveTextContent('本機交易：2 筆');
    expect(screen.getByLabelText('同步狀態項目')).toHaveTextContent('未啟用雲端同步');
    fireEvent.click(screen.getByRole('button', { name: '複製同步狀態' }));
    expect(writeTextMock).toHaveBeenCalledWith(expect.stringContaining('Expense Tracker Redo 同步狀態'));
    expect(writeTextMock).toHaveBeenCalledWith(expect.stringContaining('Local transactions: 2'));
    fireEvent.click(screen.getByText('清除所有資料'));
    expect(screen.getByRole('dialog', { name: '清除所有資料確認' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '確認清除所有資料' }));
    expect(screen.getByLabelText('清除資料確認字串')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '確認清除所有資料' })).toBeDisabled();
    fireEvent.change(screen.getByLabelText('清除資料確認字串'), { target: { value: 'wrong' } });
    expect(screen.getByRole('button', { name: '確認清除所有資料' })).toBeDisabled();
    expect(onClearAllData).not.toHaveBeenCalled();
    fireEvent.change(screen.getByLabelText('清除資料確認字串'), { target: { value: 'CLEAR' } });
    fireEvent.click(screen.getByRole('button', { name: '確認清除所有資料' }));
    fireEvent.click(screen.getByText('評分 App'));
    fireEvent.click(screen.getByText('更新內容'));
    expect(screen.getByRole('dialog', { name: '更新內容' })).toBeInTheDocument();
    expect(screen.getByText('版本資訊中心')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '關閉' }));
    expect(screen.getByLabelText('分類規則版本狀態')).toHaveTextContent('不覆蓋手動分類');
    fireEvent.click(screen.getByRole('button', { name: '複製更新診斷' }));
    expect(writeTextMock).toHaveBeenCalledWith(expect.stringContaining('Expense Tracker Redo 更新診斷'));
    expect(writeTextMock).toHaveBeenCalledWith(expect.stringContaining('Recovery point: 尚無本機復原點'));
    fireEvent.click(screen.getByText('檢查更新'));
    expect(screen.getByRole('dialog', { name: '檢查更新結果' })).toBeInTheDocument();
    expect(screen.getByText('目前是本機檢查')).toBeInTheDocument();
    expect(screen.getByLabelText('更新行為策略')).toHaveTextContent('目前已是最新版本');
    expect(screen.getByLabelText('遠端更新來源狀態')).toHaveTextContent('遠端版本 manifest');
    expect(screen.getByLabelText('遠端更新來源狀態')).toHaveTextContent('未設定');
    expect(screen.getByLabelText('商店更新連結狀態')).toHaveTextContent('App Store');
    expect(screen.getByLabelText('商店更新連結狀態')).toHaveTextContent('上架後啟用');
    expect(screen.getByLabelText('正式商店版本查詢前置檢查')).toHaveTextContent('正式查詢前置：待設定');
    expect(screen.getByLabelText('正式商店版本查詢前置檢查')).toHaveTextContent('遠端 manifest fallback：待補');
    expect(screen.getAllByText(/尚無本機復原點/).length).toBeGreaterThan(0);
    fireEvent.click(screen.getByRole('button', { name: '知道了' }));
    expect(screen.queryByRole('dialog', { name: '檢查更新結果' })).not.toBeInTheDocument();

    expect(setStyle).toHaveBeenCalled();
    expect(setCurrency).toHaveBeenCalledWith('USD');
    expect(setMonthStartDay).toHaveBeenCalledWith(15);
    expect(getCsvExportCount).toHaveBeenCalled();
    expect(onExportCsv).toHaveBeenNthCalledWith(1, { scope: 'all', category: undefined });
    expect(onExportCsv).toHaveBeenNthCalledWith(2, { scope: 'category', category: '交通' });
    expect(onClearAllData).toHaveBeenCalledTimes(1);
    expect(onRateApp).toHaveBeenCalled();
  });

  it('SettingsPage 會在 recommended 稍後提醒到期後顯示提醒到期 badge', () => {
    const storage = new Map<string, string>([
      ['expense-tracker-redo-update-reminder', JSON.stringify({
        action: 'remind-later',
        version: '1.0.2',
        updatedAt: '2026-05-09T00:00:00.000Z',
        remindAfter: '2026-05-09T01:00:00.000Z',
      })],
    ]);
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: (key: string) => storage.get(key) ?? null,
        setItem: (key: string, value: string) => storage.set(key, value),
        removeItem: (key: string) => storage.delete(key),
      },
      configurable: true,
    });

    render(
      <SettingsPage
        t={t}
        r={r}
        f={f}
        style="minimal"
        setStyle={vi.fn()}
        mode="light"
        setMode={vi.fn()}
        currency="NTD"
        setCurrency={vi.fn()}
        monthStartDay={1}
        setMonthStartDay={vi.fn()}
        billReminder
        setBillReminder={vi.fn()}
        iCloudBackup={false}
        setICloudBackup={vi.fn()}
        exportCategories={['餐飲']}
        getCsvExportCount={() => 1}
        onExportCsv={vi.fn()}
        onClearAllData={vi.fn()}
        onRateApp={vi.fn()}
      />,
    );

    expect(screen.getByLabelText('更新入口狀態')).toHaveTextContent('提醒到期');
    fireEvent.click(screen.getByText('檢查更新'));
    expect(screen.getByLabelText('更新提醒狀態')).toHaveTextContent('入口狀態：提醒到期');

    fireEvent.click(screen.getByRole('button', { name: '再提醒24小時' }));
    expect(window.localStorage.getItem('expense-tracker-redo-update-reminder')).toContain('remind-later');
    expect(screen.getByLabelText('更新入口狀態')).toHaveTextContent('稍後提醒');
    expect(screen.getByLabelText('更新提醒狀態')).toHaveTextContent('入口狀態：稍後提醒');

    fireEvent.click(screen.getByRole('button', { name: '清除更新提醒偏好' }));
    expect(storage.has('expense-tracker-redo-update-reminder')).toBe(false);
    expect(screen.getByLabelText('更新入口狀態')).toHaveTextContent('未設定提醒');
    expect(screen.getByLabelText('更新提醒狀態')).toHaveTextContent('尚未設定更新提醒或略過版本');
  });

  it('SettingsPage 對 optional 更新可略過此版本並保留下版提醒', async () => {
    vi.useRealTimers();
    vi.stubEnv('VITE_UPDATE_MANIFEST_URL', 'https://example.com/update-manifest.json');
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ latestVersion: '1.0.1', level: 'optional', message: '小型體驗更新。' }),
    } as Response);
    const storage = new Map<string, string>();
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: (key: string) => storage.get(key) ?? null,
        setItem: (key: string, value: string) => storage.set(key, value),
        removeItem: (key: string) => storage.delete(key),
      },
      configurable: true,
    });

    render(
      <SettingsPage
        t={t}
        r={r}
        f={f}
        style="minimal"
        setStyle={vi.fn()}
        mode="light"
        setMode={vi.fn()}
        currency="NTD"
        setCurrency={vi.fn()}
        monthStartDay={1}
        setMonthStartDay={vi.fn()}
        billReminder
        setBillReminder={vi.fn()}
        iCloudBackup={false}
        setICloudBackup={vi.fn()}
        exportCategories={['餐飲']}
        getCsvExportCount={() => 1}
        onExportCsv={vi.fn()}
        onClearAllData={vi.fn()}
        onRateApp={vi.fn()}
        updateManifestSourceOverride={{ status: 'ready', envKey: 'VITE_UPDATE_MANIFEST_URL', url: 'https://example.com/update-manifest.json' }}
      />,
    );

    fireEvent.click(screen.getByText('檢查更新'));
    await screen.findByText(/遠端最新版本 1.0.1/);
    expect(screen.getByLabelText('更新入口狀態')).toHaveTextContent('未設定提醒');
    expect(screen.getByLabelText('更新提醒狀態')).toHaveTextContent('尚未設定更新提醒或略過版本');

    fireEvent.click(screen.getByRole('button', { name: '略過' }));
    expect(window.localStorage.getItem('expense-tracker-redo-update-reminder')).toContain('skip-version');
    expect(window.localStorage.getItem('expense-tracker-redo-update-reminder')).toContain('1.0.1');

    fireEvent.click(screen.getByText('檢查更新'));
    expect(screen.getByLabelText('更新入口狀態')).toHaveTextContent('已略過 v1.0.1');
    expect(screen.getByLabelText('更新提醒狀態')).toHaveTextContent('入口狀態：已略過 v1.0.1');
  });

  it('SettingsPage 手動檢查到 required update 會通知 App 層啟用保護', async () => {
    vi.useRealTimers();
    vi.stubEnv('VITE_UPDATE_MANIFEST_URL', 'https://example.com/update-manifest.json');
    const onRequiredUpdateProtectionChange = vi.fn();
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ latestVersion: '1.0.2', minimumSupportedVersion: '1.0.1', message: '請更新以維持資料相容。' }),
    } as Response);

    render(
      <SettingsPage
        t={t}
        r={r}
        f={f}
        style="minimal"
        setStyle={vi.fn()}
        mode="light"
        setMode={vi.fn()}
        currency="NTD"
        setCurrency={vi.fn()}
        monthStartDay={1}
        setMonthStartDay={vi.fn()}
        billReminder
        setBillReminder={vi.fn()}
        iCloudBackup={false}
        setICloudBackup={vi.fn()}
        exportCategories={['餐飲']}
        getCsvExportCount={() => 1}
        onExportCsv={vi.fn()}
        onClearAllData={vi.fn()}
        onRateApp={vi.fn()}
        onRequiredUpdateProtectionChange={onRequiredUpdateProtectionChange}
        updateManifestSourceOverride={{ status: 'ready', envKey: 'VITE_UPDATE_MANIFEST_URL', url: 'https://example.com/update-manifest.json' }}
      />,
    );

    fireEvent.click(screen.getByText('檢查更新'));

    await waitFor(() => expect(onRequiredUpdateProtectionChange).toHaveBeenCalledWith(true));
    expect(screen.getByLabelText('更新行為策略')).toHaveTextContent('限制主要操作');
  });

  it('SettingsPage 顯示必要更新保護狀態且保留資料出口', () => {
    const writeTextMock = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: writeTextMock },
      configurable: true,
    });

    render(
      <SettingsPage
        t={t}
        r={r}
        f={f}
        style="minimal"
        setStyle={vi.fn()}
        mode="light"
        setMode={vi.fn()}
        currency="NTD"
        setCurrency={vi.fn()}
        monthStartDay={1}
        setMonthStartDay={vi.fn()}
        billReminder
        setBillReminder={vi.fn()}
        iCloudBackup={false}
        setICloudBackup={vi.fn()}
        exportCategories={['餐飲']}
        getCsvExportCount={() => 1}
        onExportCsv={vi.fn()}
        onClearAllData={vi.fn()}
        onRateApp={vi.fn()}
        requiredUpdateProtectionActive
      />,
    );

    expect(screen.getByLabelText('必要更新保護狀態')).toHaveTextContent('必要更新保護已啟用');
    expect(screen.getByLabelText('必要更新保護狀態')).toHaveTextContent('CSV 匯出');
    expect(screen.getByLabelText('必要更新保護狀態')).toHaveTextContent('複製更新診斷');
    expect(screen.getByLabelText('必要更新保護狀態')).toHaveTextContent('新增交易');
    fireEvent.click(screen.getByRole('button', { name: '複製必要更新保護狀態' }));
    expect(writeTextMock).toHaveBeenCalledWith(expect.stringContaining('必要更新保護已啟用'));
  });

  it('SettingsPage 清除資料流程支援取消、重開與最終清除', () => {
    const onClearAllData = vi.fn();

    render(
      <SettingsPage
        t={t}
        r={r}
        f={f}
        style="minimal"
        setStyle={vi.fn()}
        mode="light"
        setMode={vi.fn()}
        currency="NTD"
        setCurrency={vi.fn()}
        monthStartDay={1}
        setMonthStartDay={vi.fn()}
        billReminder
        setBillReminder={vi.fn()}
        iCloudBackup={false}
        setICloudBackup={vi.fn()}
        exportCategories={['餐飲']}
        getCsvExportCount={() => 1}
        onExportCsv={vi.fn()}
        onClearAllData={onClearAllData}
        onRateApp={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByText('清除所有資料'));
    fireEvent.click(screen.getByRole('button', { name: '確認清除所有資料' }));
    expect(screen.getByRole('button', { name: '確認清除所有資料' })).toHaveTextContent('輸入 CLEAR 後確認清除');
    expect(screen.getByLabelText('清除資料確認字串')).toBeInTheDocument();

    fireEvent.click(screen.getByText('取消'));
    expect(screen.queryByRole('dialog', { name: '清除所有資料確認' })).not.toBeInTheDocument();

    fireEvent.click(screen.getByText('清除所有資料'));
    expect(screen.getByRole('button', { name: '確認清除所有資料' })).toHaveTextContent('我了解風險，下一步確認');
    fireEvent.click(screen.getByRole('button', { name: '確認清除所有資料' }));
    fireEvent.change(screen.getByLabelText('清除資料確認字串'), { target: { value: 'CLEAR' } });
    fireEvent.click(screen.getByRole('button', { name: '確認清除所有資料' }));

    expect(onClearAllData).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('dialog', { name: '清除所有資料確認' })).not.toBeInTheDocument();
  });

  it('ReportTab 無資料時顯示 empty state，不顯示 demo 趨勢數值', () => {
    render(<ReportTab txns={[]} currency="NTD" t={t} r={r} f={f} />);

    expect(screen.getByText('所選期間尚無支出資料，新增交易後會顯示趨勢與分類占比。')).toBeInTheDocument();
    expect(screen.queryByText('12,800')).not.toBeInTheDocument();
    expect(screen.queryByText('18,400')).not.toBeInTheDocument();
  });

  it('Reports 摘要快捷導流可切換到預算與目標分頁', () => {
    render(
      <ReportsPage
        txns={[
          { id: 1, name: '餐費', cat: '餐飲', amount: -900, date: '2026-04-10', time: '12:00' },
          { id: 2, name: '交通', cat: '交通', amount: -180, date: '2026-04-11', time: '08:00' },
        ]}
        reportTxns={[
          { id: 1, name: '餐費', cat: '餐飲', amount: -900, date: '2026-04-10', time: '12:00' },
          { id: 2, name: '交通', cat: '交通', amount: -180, date: '2026-04-11', time: '08:00' },
        ]}
        budgets={{ ...INITIAL_BUDGETS, 餐飲: 800, 交通: 200 }}
        currency="NTD"
        setBudgets={() => {}}
        goals={[{ id: 1, name: '旅行基金', target: 10000, saved: 8500, icon: '✈️', color: '#6366F1' }]}
        setGoals={() => {}}
        t={t}
        r={r}
        f={f}
      />, 
    );

    fireEvent.click(screen.getByLabelText('前往預算分頁查看摘要對應內容'));
    expect(screen.getByLabelText('預算分頁內容')).toBeInTheDocument();
    expect(screen.getByText('本月總預算')).toBeInTheDocument();

    fireEvent.click(screen.getByText('報表'));
    fireEvent.click(screen.getByLabelText('前往目標分頁查看摘要對應內容'));
    expect(screen.getByLabelText('目標分頁內容')).toBeInTheDocument();
    expect(screen.getByText('新增儲蓄目標')).toBeInTheDocument();
  });

  it('ReportTab 可切換近 3 月 / 6 月 / 12 月期間', () => {
    render(
      <ReportTab
        txns={[
          { id: 1, name: 'A', cat: '餐飲', amount: -100, date: '2026-04-10', time: '12:00' },
          { id: 2, name: 'B', cat: '交通', amount: -80, date: '2025-08-01', time: '08:00' },
        ]}
        t={t}
        r={r}
        f={f}
      currency="NTD"
      />,
    );

    fireEvent.click(screen.getByText('近 12 月'));
    expect(screen.getByText('支出分類排行與占比')).toBeInTheDocument();

    fireEvent.click(screen.getByText('近 3 月'));
    expect(screen.getByText('支出分類排行與占比')).toBeInTheDocument();
  });

  it('ReportTab 顯示月對月變化率與月柱狀數值標籤', () => {
    const latest = new Date();
    latest.setDate(10);
    const prev = new Date(latest);
    prev.setMonth(prev.getMonth() - 1);
    const latestDate = `${latest.getFullYear()}-${String(latest.getMonth() + 1).padStart(2, '0')}-10`;
    const prevDate = `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, '0')}-10`;

    render(
      <ReportTab
        txns={[
          { id: 1, name: '上月', cat: '餐飲', amount: -100, date: prevDate, time: '12:00' },
          { id: 2, name: '本月', cat: '餐飲', amount: -150, date: latestDate, time: '12:00' },
        ]}
        t={t}
        r={r}
        f={f}
      currency="NTD"
      />,
    );

    expect(screen.getByLabelText('月對月變化率').textContent).toContain('環比（月對月）：↑ 50.0%');
    expect(screen.getByText('150')).toBeInTheDocument();
  });

  it('ReportTab 點擊月柱後會顯示固定月份資訊卡並更新選取月份', () => {
    render(
      <ReportTab
        txns={[
          { id: 1, name: '一月', cat: '餐飲', amount: -120, date: '2026-02-10', time: '12:00' },
          { id: 2, name: '二月', cat: '餐飲', amount: -320, date: '2026-03-10', time: '12:00' },
        ]}
        t={t}
        r={r}
        f={f}
      currency="NTD"
      />,
    );

    fireEvent.click(screen.getByTitle(/2026-02：NT\$120/));
    expect(screen.getByLabelText('月支出目前選取月份')).toHaveTextContent('2026-02：NT$120');
  });

  it('ReportTab 切換期間時會保留可用月份，若不存在則回退到該期間最新有資料月份', () => {
    vi.setSystemTime(new Date('2026-07-15T10:00:00Z'));

    render(
      <ReportTab
        txns={[
          { id: 1, name: '二月', cat: '餐飲', amount: -120, date: '2026-02-10', time: '12:00' },
          { id: 2, name: '六月', cat: '餐飲', amount: -220, date: '2026-06-10', time: '12:00' },
          { id: 3, name: '七月', cat: '餐飲', amount: -320, date: '2026-07-10', time: '12:00' },
        ]}
        t={t}
        r={r}
        f={f}
      currency="NTD"
      />,
    );

    fireEvent.click(screen.getByTitle(/2026-06：NT\$220/));
    expect(screen.getByLabelText('月支出目前選取月份')).toHaveTextContent('2026-06：NT$220');

    fireEvent.click(screen.getByText('近 12 月'));
    expect(screen.getByLabelText('月支出目前選取月份')).toHaveTextContent('2026-06：NT$220');

    fireEvent.click(screen.getByTitle(/2026-02：NT\$120/));
    expect(screen.getByLabelText('月支出目前選取月份')).toHaveTextContent('2026-02：NT$120');

    fireEvent.click(screen.getByText('近 3 月'));
    expect(screen.getByLabelText('月支出目前選取月份')).toHaveTextContent('2026-07：NT$320');
  });

  it('RecurringTab 支援啟用狀態篩選', () => {
    render(
      <TransactionsPage
        txns={SAMPLE_TXNS}
        recurring={[
          { id: 1, name: 'A訂閱', cat: '娛樂', amount: -100, freq: 'monthly', nextDate: '2026-05-01', active: true },
          { id: 2, name: 'B停用', cat: '帳單', amount: -200, freq: 'monthly', nextDate: '2026-05-10', active: false },
        ]}
        t={t}
        r={r}
        f={f}
        currency="NTD"
        onEdit={() => {}}
        onDelete={() => {}}
        onRecChange={() => {}}
        onRecSave={() => {}}
        onRecDelete={() => {}}
        month={3}
        setMonth={() => {}}
      />,
    );

    fireEvent.click(screen.getByText('定期帳目'));
    expect(screen.getByText('A訂閱')).toBeInTheDocument();
    expect(screen.getByText('B停用')).toBeInTheDocument();

    fireEvent.click(screen.getByText('啟用中'));
    expect(screen.getByText('A訂閱')).toBeInTheDocument();
    expect(screen.queryByText('B停用')).not.toBeInTheDocument();

    fireEvent.click(screen.getByText('已停用'));
    expect(screen.getByText('B停用')).toBeInTheDocument();
    expect(screen.queryByText('A訂閱')).not.toBeInTheDocument();
  });

  it('RecurringTab 支援只看 7 天內到期與批次停用', () => {
    const now = new Date();
    const dueIn3 = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
    const dueIn10 = new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000);
    const format = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const onRecChange = vi.fn();

    render(
      <TransactionsPage
        txns={SAMPLE_TXNS}
        recurring={[
          { id: 1, name: '近期待扣', cat: '娛樂', amount: -100, freq: 'monthly', nextDate: format(dueIn3), active: true },
          { id: 2, name: '較晚扣款', cat: '帳單', amount: -200, freq: 'monthly', nextDate: format(dueIn10), active: true },
        ]}
        t={t}
        r={r}
        f={f}
        currency="NTD"
        onEdit={() => {}}
        onDelete={() => {}}
        onRecChange={onRecChange}
        onRecSave={() => {}}
        onRecDelete={() => {}}
        month={3}
        setMonth={() => {}}
      />, 
    );

    fireEvent.click(screen.getByText('定期帳目'));
    expect(screen.getByLabelText('搜尋定期帳目')).toBeInTheDocument();
    expect(screen.getByLabelText('定期帳目到期提醒摘要')).toHaveTextContent('今日到期');
    fireEvent.click(screen.getByRole('button', { name: '只看7天內到期' }));
    expect(screen.getByText('近期待扣')).toBeInTheDocument();
    expect(screen.queryByText('較晚扣款')).not.toBeInTheDocument();
    expect(screen.getByLabelText('定期帳目批次摘要')).toHaveTextContent('已選取 0 / 目前篩選 1 筆');

    fireEvent.click(screen.getByRole('button', { name: '全選目前篩選結果' }));
    expect(screen.getByLabelText('定期帳目批次摘要')).toHaveTextContent('已選取 1 / 目前篩選 1 筆');
    fireEvent.click(screen.getByRole('button', { name: '批次停用' }));
    expect(onRecChange).toHaveBeenCalledWith(1, false);

    fireEvent.change(screen.getByLabelText('搜尋定期帳目'), { target: { value: '晚扣' } });
    expect(screen.queryByText('近期待扣')).not.toBeInTheDocument();
  });

  it('RecurringTab 支援今日到期與逾期未處理快速篩選', () => {
    const today = new Date();
    const format = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    render(
      <TransactionsPage
        txns={SAMPLE_TXNS}
        recurring={[
          { id: 1, name: '今日要扣', cat: '娛樂', amount: -99, freq: 'monthly', nextDate: format(today), active: true },
          { id: 2, name: '昨天未扣', cat: '帳單', amount: -199, freq: 'monthly', nextDate: format(yesterday), active: true },
        ]}
        t={t}
        r={r}
        f={f}
        currency="NTD"
        onEdit={() => {}}
        onDelete={() => {}}
        onRecChange={() => {}}
        onRecSave={() => {}}
        onRecDelete={() => {}}
        month={3}
        setMonth={() => {}}
      />,
    );

    fireEvent.click(screen.getByText('定期帳目'));
    fireEvent.click(screen.getByRole('button', { name: '只看今日到期' }));
    expect(screen.getByText('今日要扣')).toBeInTheDocument();
    expect(screen.queryByText('昨天未扣')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '只看逾期未處理' }));
    expect(screen.getByText('昨天未扣')).toBeInTheDocument();
    expect(screen.queryByText('今日要扣')).not.toBeInTheDocument();
  });

  it('RecurringTab 提醒文案在摘要/篩選/empty state 保持一致', () => {
    vi.setSystemTime(new Date('2026-04-15T10:00:00Z'));

    render(
      <TransactionsPage
        txns={SAMPLE_TXNS}
        recurring={[
          { id: 1, name: '今日扣款', cat: '娛樂', amount: -120, freq: 'monthly', nextDate: '2026-04-15', active: true },
        ]}
        t={t}
        r={r}
        f={f}
        currency="NTD"
        onEdit={() => {}}
        onDelete={() => {}}
        onRecChange={() => {}}
        onRecSave={() => {}}
        onRecDelete={() => {}}
        month={3}
        setMonth={() => {}}
      />,
    );

    fireEvent.click(screen.getByText('定期帳目'));

    expect(screen.getByRole('button', { name: '全部到期篩選' })).toHaveTextContent('全部到期項目');
    expect(screen.getByRole('button', { name: '只看今日到期' })).toHaveTextContent('今日到期');
    expect(screen.getByRole('button', { name: '只看7天內到期' })).toHaveTextContent('7 天內到期');
    expect(screen.getByRole('button', { name: '只看逾期未處理' })).toHaveTextContent('逾期未處理');
    expect(screen.getByLabelText('定期帳目到期提醒摘要')).toHaveTextContent('今日到期 1 項 · 7 天內到期 0 項 · 逾期未處理 0 項');

    fireEvent.change(screen.getByLabelText('搜尋定期帳目'), { target: { value: '不存在關鍵字' } });
    expect(screen.getByText('目前篩選條件下沒有符合的到期提醒項目，請切換篩選或新增一筆定期帳目。')).toBeInTheDocument();
  });

  it('RecurringTab 可直接切換自動入帳模式（off/on/confirm）', () => {
    const onRecSave = vi.fn();

    render(
      <TransactionsPage
        txns={SAMPLE_TXNS}
        recurring={[
          { id: 1, name: '串流訂閱', cat: '娛樂', amount: -150, freq: 'monthly', nextDate: '2026-04-20', active: true, autoPostMode: 'off' },
        ]}
        t={t}
        r={r}
        f={f}
        currency="NTD"
        onEdit={() => {}}
        onDelete={() => {}}
        onRecChange={() => {}}
        onRecSave={onRecSave}
        onRecDelete={() => {}}
        month={3}
        setMonth={() => {}}
      />,
    );

    fireEvent.click(screen.getByText('定期帳目'));
    fireEvent.change(screen.getByLabelText('切換自動入帳模式串流訂閱'), { target: { value: 'confirm' } });

    expect(onRecSave).toHaveBeenCalledWith(1, { autoPostMode: 'confirm', autoPost: false });
  });

  it('RecurringTab 顯示 pending 並可確認入帳/略過本輪', () => {
    const onRecConfirmPending = vi.fn();
    const onRecSkipPending = vi.fn();

    render(
      <TransactionsPage
        txns={SAMPLE_TXNS}
        recurring={[
          { id: 1, name: '水電費', cat: '帳單', amount: -1200, freq: 'monthly', nextDate: '2026-04-20', active: true, autoPostMode: 'confirm', pendingCycle: '2026-04-20' },
        ]}
        t={t}
        r={r}
        f={f}
        currency="NTD"
        onEdit={() => {}}
        onDelete={() => {}}
        onRecChange={() => {}}
        onRecSave={() => {}}
        onRecDelete={() => {}}
        onRecConfirmPending={onRecConfirmPending}
        onRecSkipPending={onRecSkipPending}
        month={3}
        setMonth={() => {}}
      />, 
    );

    fireEvent.click(screen.getByText('定期帳目'));
    expect(screen.getByText('待確認輪次：04/20（尚未入帳）')).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText('確認入帳水電費'));
    fireEvent.click(screen.getByLabelText('略過本輪水電費'));

    expect(onRecConfirmPending).toHaveBeenCalledWith(1, 'today');
    expect(onRecSkipPending).toHaveBeenCalledWith(1);
  });

  it('RecurringTab 支援 pending 專屬篩選，且可與搜尋共存', () => {
    render(
      <TransactionsPage
        txns={SAMPLE_TXNS}
        recurring={[
          { id: 1, name: '待確認水費', cat: '帳單', amount: -500, freq: 'monthly', nextDate: '2026-04-20', active: true, autoPostMode: 'confirm', pendingCycle: '2026-04-20' },
          { id: 2, name: '一般訂閱', cat: '娛樂', amount: -200, freq: 'monthly', nextDate: '2026-04-21', active: true, autoPostMode: 'on' },
        ]}
        t={t}
        r={r}
        f={f}
        currency="NTD"
        onEdit={() => {}}
        onDelete={() => {}}
        onRecChange={() => {}}
        onRecSave={() => {}}
        onRecDelete={() => {}}
        month={3}
        setMonth={() => {}}
      />,
    );

    fireEvent.click(screen.getByText('定期帳目'));
    fireEvent.click(screen.getByLabelText('只看待確認'));
    expect(screen.getByText('待確認水費')).toBeInTheDocument();
    expect(screen.queryByText('一般訂閱')).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('搜尋定期帳目'), { target: { value: '不存在' } });
    expect(screen.getByText('目前篩選條件下沒有符合的到期提醒項目，請切換篩選或新增一筆定期帳目。')).toBeInTheDocument();
  });

  it('RecurringTab 支援 pending 批次確認/略過（已選取優先，否則用目前 pending 篩選）', () => {
    const onRecConfirmPending = vi.fn();
    const onRecSkipPending = vi.fn();

    render(
      <TransactionsPage
        txns={SAMPLE_TXNS}
        recurring={[
          { id: 1, name: '待確認A', cat: '帳單', amount: -500, freq: 'monthly', nextDate: '2026-04-20', active: true, autoPostMode: 'confirm', pendingCycle: '2026-04-20' },
          { id: 2, name: '待確認B', cat: '娛樂', amount: -300, freq: 'monthly', nextDate: '2026-04-21', active: true, autoPostMode: 'confirm', pendingCycle: '2026-04-21' },
          { id: 3, name: '非待確認', cat: '交通', amount: -100, freq: 'monthly', nextDate: '2026-04-22', active: true, autoPostMode: 'on' },
        ]}
        t={t}
        r={r}
        f={f}
        currency="NTD"
        onEdit={() => {}}
        onDelete={() => {}}
        onRecChange={() => {}}
        onRecSave={() => {}}
        onRecDelete={() => {}}
        onRecConfirmPending={onRecConfirmPending}
        onRecSkipPending={onRecSkipPending}
        month={3}
        setMonth={() => {}}
      />,
    );

    fireEvent.click(screen.getByText('定期帳目'));
    fireEvent.click(screen.getByLabelText('只看待確認'));

    fireEvent.click(screen.getByLabelText('選取待確認A'));
    fireEvent.click(screen.getByLabelText('批次確認入帳'));
    expect(onRecConfirmPending).toHaveBeenCalledTimes(1);
    expect(onRecConfirmPending).toHaveBeenLastCalledWith(1, 'today');

    fireEvent.click(screen.getByLabelText('清除選取'));
    fireEvent.click(screen.getByLabelText('批次略過本輪'));
    expect(onRecSkipPending).toHaveBeenCalledTimes(2);
    expect(onRecSkipPending).toHaveBeenNthCalledWith(1, 1);
    expect(onRecSkipPending).toHaveBeenNthCalledWith(2, 2);
  });

  it('RecurringTab 可切換確認入帳日期策略（今天 / 到期日）', () => {
    const onRecConfirmPending = vi.fn();

    render(
      <TransactionsPage
        txns={SAMPLE_TXNS}
        recurring={[
          { id: 1, name: '待確認日策略', cat: '帳單', amount: -500, freq: 'monthly', nextDate: '2026-04-20', active: true, autoPostMode: 'confirm', pendingCycle: '2026-04-20' },
        ]}
        t={t}
        r={r}
        f={f}
        currency="NTD"
        onEdit={() => {}}
        onDelete={() => {}}
        onRecChange={() => {}}
        onRecSave={() => {}}
        onRecDelete={() => {}}
        onRecConfirmPending={onRecConfirmPending}
        month={3}
        setMonth={() => {}}
      />,
    );

    fireEvent.click(screen.getByText('定期帳目'));
    fireEvent.change(screen.getByLabelText('確認入帳日期策略'), { target: { value: 'cycle' } });
    fireEvent.click(screen.getByLabelText('確認入帳待確認日策略'));

    expect(onRecConfirmPending).toHaveBeenCalledWith(1, 'cycle');
  });

  it('RecurringTab 提醒處理動作可呼叫標記已處理與延後一次', () => {
    vi.setSystemTime(new Date('2026-04-15T10:00:00Z'));
    const onRecSave = vi.fn();

    render(
      <TransactionsPage
        txns={SAMPLE_TXNS}
        recurring={[
          { id: 1, name: '每月房租', cat: '帳單', amount: -12000, freq: 'monthly', nextDate: '2026-04-15', active: true },
          { id: 2, name: '每週課程', cat: '教育', amount: -800, freq: 'weekly', nextDate: '2026-04-10', active: true },
        ]}
        t={t}
        r={r}
        f={f}
        currency="NTD"
        onEdit={() => {}}
        onDelete={() => {}}
        onRecChange={() => {}}
        onRecSave={onRecSave}
        onRecDelete={() => {}}
        month={3}
        setMonth={() => {}}
      />,
    );

    fireEvent.click(screen.getByText('定期帳目'));
    fireEvent.click(screen.getByLabelText('標記已處理每週課程'));
    fireEvent.click(screen.getByLabelText('延後一次每月房租'));

    expect(onRecSave).toHaveBeenCalledWith(2, expect.objectContaining({ nextDate: '2026-04-17' }));
    expect(onRecSave).toHaveBeenCalledWith(1, expect.objectContaining({ nextDate: '2026-05-15' }));
  });

  it('TxnModal 分類改變後備註預設選項會更新，點擊會帶入備註', () => {
    render(<TxnModal t={t} r={r} f={f} initial={null} month={3} onSave={vi.fn()} onClose={() => {}} />);

    expect(screen.getByLabelText('備註預設餐飲早餐')).toBeInTheDocument();
    fireEvent.click(screen.getByText('交通'));
    expect(screen.getByLabelText('備註預設交通捷運')).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText('備註預設交通捷運'));
    expect(screen.getByPlaceholderText('備註說明…')).toHaveValue('捷運');
  });

  it('TxnModal 支援最近分類與最近備註快速帶入', () => {
    const onUseCategory = vi.fn();
    const onUseNote = vi.fn();

    render(
      <TxnModal
        t={t}
        r={r}
        f={f}
        initial={null}
        month={3}
        onSave={vi.fn()}
        onClose={() => {}}
        recentCategories={['交通', '購物']}
        recentNotes={['Uber', '全聯補貨']}
        onUseCategory={onUseCategory}
        onUseNote={onUseNote}
      />,
    );

    fireEvent.click(screen.getByLabelText('最近分類交通'));
    fireEvent.click(screen.getByLabelText('最近備註Uber'));

    expect(screen.getByPlaceholderText('備註說明…')).toHaveValue('Uber');
    expect(onUseCategory).toHaveBeenCalledWith('交通');
    expect(onUseNote).toHaveBeenCalledWith('Uber', '交通');
  });

  it('TxnModal 會依目前分類重排最近備註（category context）', () => {
    const now = new Date('2026-04-19T12:00:00.000Z').getTime();
    const ranker = (
      noteStats: Record<string, { count: number; lastUsedAt: number }>,
      noteCategoryStats: Record<string, Record<string, { count: number; lastUsedAt: number }>>,
      category?: string,
    ) => {
      const notes = Object.keys(noteStats);
      return notes.sort((a, b) => {
        const aCtx = category ? (noteCategoryStats[a]?.[category]?.count ?? 0) : 0;
        const bCtx = category ? (noteCategoryStats[b]?.[category]?.count ?? 0) : 0;
        if (bCtx !== aCtx) return bCtx - aCtx;
        return noteStats[b].lastUsedAt - noteStats[a].lastUsedAt;
      });
    };

    render(
      <TxnModal
        t={t}
        r={r}
        f={f}
        initial={null}
        month={3}
        onSave={vi.fn()}
        onClose={() => {}}
        recentNotes={['午餐', 'Uber']}
        recentNoteStats={{ Uber: { count: 2, lastUsedAt: now }, 午餐: { count: 2, lastUsedAt: now } }}
        recentNoteCategoryStats={{ Uber: { 交通: { count: 2, lastUsedAt: now } }, 午餐: { 餐飲: { count: 2, lastUsedAt: now } } }}
        rankRecentNotesByCategoryContext={ranker}
      />,
    );

    fireEvent.click(screen.getByText('交通'));
    const labels = screen.getAllByLabelText(/最近備註/).map((el) => el.getAttribute('aria-label'));
    expect(labels[0]).toBe('最近備註Uber');
  });

  it('TxnModal 計算機遇到非法算式與除以 0 會顯示清楚錯誤', () => {
    render(<TxnModal t={t} r={r} f={f} initial={null} month={3} onSave={vi.fn()} onClose={() => {}} />);

    fireEvent.click(screen.getByText('='));
    expect(screen.getByLabelText('計算機錯誤提示')).toHaveTextContent('算式格式不正確');

    fireEvent.click(screen.getByText('2'));
    fireEvent.click(screen.getByText('÷'));
    fireEvent.click(screen.getByText('0'));
    fireEvent.click(screen.getByText('='));
    expect(screen.getByLabelText('計算機錯誤提示')).toHaveTextContent('無法除以 0');
  });
});
