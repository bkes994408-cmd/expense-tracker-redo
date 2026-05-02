import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../store/persistence', () => {
  const memory = new Map<string, string>();
  return {
    safeStorage: {
      getItem: (name: string) => memory.get(name) ?? null,
      setItem: (name: string, value: string) => {
        memory.set(name, value);
      },
      removeItem: (name: string) => {
        memory.delete(name);
      },
    },
  };
});

import { App } from '../app/App';
import { useAppStore } from '../store/appStore';
import { useFinanceStore } from '../store/financeStore';

describe('App integration smoke', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-04-15T10:00:00Z'));

    useAppStore.setState({
      style: 'minimal',
      mode: 'light',
      tab: 0,
      month: 3,
      currency: 'NTD',
      monthStartDay: 1,
      billReminder: true,
      iCloudBackup: false,
      recentQuickEntries: [],
      recentQuickEntryStats: {},
    });

    useFinanceStore.setState({
      transactions: [{ id: 1, name: '三月餐費', cat: '餐飲', amount: -100, date: '2026-03-10', time: '12:00' }],
      recurring: [],
      goals: [],
      budgets: {
        餐飲: 0,
        交通: 0,
        購物: 0,
        娛樂: 0,
        帳單: 0,
        健康: 0,
        教育: 0,
        其他: 0,
      },
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('從 App 新增交易後，Reports 會立即反映趨勢與月對月', () => {
    const { container } = render(<App />);

    const fab = container.querySelector('div[style*="fabPulse"]');
    expect(fab).toBeTruthy();
    fireEvent.click(fab as Element);

    fireEvent.click(screen.getByText('手動輸入'));
    fireEvent.change(screen.getByRole('spinbutton'), { target: { value: '200' } });
    fireEvent.change(screen.getByPlaceholderText('備註說明…'), { target: { value: '四月捷運' } });
    fireEvent.click(screen.getByText('交通'));
    fireEvent.click(screen.getByText('儲存'));
    vi.advanceTimersByTime(400);

    fireEvent.click(screen.getByText('報表', { selector: 'span' }));

    expect(screen.getByLabelText('月支出目前選取月份')).toHaveTextContent('2026-04：NT$200');
    expect(screen.getByLabelText('月對月變化率')).toHaveTextContent('環比（月對月）：↑ 100.0%（2026-03 → 2026-04）');
    expect(screen.getByText('NT$200 (67%)')).toBeInTheDocument();
    expect(screen.getByText('NT$100 (33%)')).toBeInTheDocument();
  });

  it('新增交易時會寫入 originalCurrency（來源為當下 display currency）', () => {
    useAppStore.setState({ currency: 'USD' });

    const { container } = render(<App />);

    const fab = container.querySelector('div[style*="fabPulse"]');
    expect(fab).toBeTruthy();
    fireEvent.click(fab as Element);

    fireEvent.click(screen.getByText('手動輸入'));
    fireEvent.change(screen.getByRole('spinbutton'), { target: { value: '88' } });
    fireEvent.change(screen.getByPlaceholderText('備註說明…'), { target: { value: '原始幣別測試' } });
    fireEvent.click(screen.getByText('儲存'));
    vi.advanceTimersByTime(400);

    const created = useFinanceStore.getState().transactions.find((tx) => tx.name === '原始幣別測試');
    expect(created?.originalCurrency).toBe('USD');

    useAppStore.setState({ currency: 'JPY' });
    fireEvent.click(screen.getByText('收支'));
    expect(screen.getByLabelText('交易幣別語意原始幣別測試')).toHaveTextContent('原始 US$ → 顯示 JP¥（未換算）');
  });

  it('在 Reports 調整預算後，Home 頁會顯示對應的預算警示（跨頁面/跨 store）', () => {
    useFinanceStore.setState({
      transactions: [{ id: 11, name: '四月午餐', cat: '餐飲', amount: -700, date: '2026-04-08', time: '12:00' }],
      recurring: [],
      goals: [],
      budgets: {
        餐飲: 0,
        交通: 0,
        購物: 0,
        娛樂: 0,
        帳單: 0,
        健康: 0,
        教育: 0,
        其他: 0,
      },
    });

    render(<App />);
    vi.advanceTimersByTime(1700);

    fireEvent.click(screen.getByText('報表', { selector: 'span' }));
    fireEvent.click(screen.getByText('預算'));

    fireEvent.click(screen.getByLabelText('編輯餐飲預算'));
    fireEvent.change(screen.getByDisplayValue('0'), { target: { value: '1000' } });
    fireEvent.click(screen.getByLabelText('儲存餐飲預算'));

    fireEvent.click(screen.getAllByText('報表')[0]);
    expect(screen.getByLabelText('報表預算摘要')).toHaveTextContent('本月總預算使用率：70%');
    expect(screen.getByLabelText('報表預算摘要')).toHaveTextContent('已超支分類：0（目前無）');

    fireEvent.click(screen.getByText('總覽'));

    expect(screen.getByText('預算警示')).toBeInTheDocument();
    expect(screen.getByText('餐飲')).toBeInTheDocument();
    expect(screen.getByText('70%')).toBeInTheDocument();
  });

  it('在 Reports 新增目標後，Home 頁會顯示儲蓄目標卡片（跨頁面/跨 store）', () => {
    render(<App />);
    vi.advanceTimersByTime(1700);

    fireEvent.click(screen.getByText('報表', { selector: 'span' }));
    fireEvent.click(screen.getByText('目標'));
    fireEvent.click(screen.getByText('新增儲蓄目標'));

    fireEvent.change(screen.getByPlaceholderText('目標名稱'), { target: { value: '旅行基金' } });
    fireEvent.change(screen.getByPlaceholderText('目標金額'), { target: { value: '10000' } });
    fireEvent.change(screen.getByPlaceholderText('已存金額'), { target: { value: '5000' } });
    fireEvent.click(screen.getByText('新增'));

    fireEvent.click(screen.getByText('總覽'));

    expect(screen.getByText('儲蓄目標')).toBeInTheDocument();
    expect(screen.getByText('旅行基金')).toBeInTheDocument();
    expect(screen.getByText('50%')).toBeInTheDocument();
  });

  it('先在 Goals 分頁變更資料，再切回 Reports 可看到決策摘要即時更新（跨頁路徑）', () => {
    render(<App />);
    vi.advanceTimersByTime(1700);

    fireEvent.click(screen.getByText('報表', { selector: 'span' }));
    fireEvent.click(screen.getByText('目標'));
    fireEvent.click(screen.getByText('新增儲蓄目標'));
    fireEvent.change(screen.getByPlaceholderText('目標名稱'), { target: { value: '旅行基金' } });
    fireEvent.change(screen.getByPlaceholderText('目標金額'), { target: { value: '10000' } });
    fireEvent.change(screen.getByPlaceholderText('已存金額'), { target: { value: '8500' } });
    fireEvent.click(screen.getByText('新增'));
    vi.advanceTimersByTime(1);

    fireEvent.click(screen.getByText('新增儲蓄目標'));
    fireEvent.change(screen.getByPlaceholderText('目標名稱'), { target: { value: '家電基金' } });
    fireEvent.change(screen.getByPlaceholderText('目標金額'), { target: { value: '20000' } });
    fireEvent.change(screen.getByPlaceholderText('已存金額'), { target: { value: '18000' } });
    fireEvent.click(screen.getByText('新增'));

    fireEvent.click(screen.getAllByText('報表')[0]);

    expect(screen.getByLabelText('報表決策摘要提示')).toHaveTextContent('依目前資料即時計算');
    expect(screen.getByLabelText('報表目標摘要')).toHaveTextContent('目前最接近完成：🎯 家電基金（90%）');
    expect(screen.getByLabelText('報表目標摘要')).toHaveTextContent('即將完成（≥80%）：🎯 家電基金（90%）、🎯 旅行基金（85%）');
  });

  it('Reports 摘要快捷導流後，目標頁內容與摘要脈絡一致', () => {
    useFinanceStore.setState({
      transactions: [{ id: 1, name: '四月午餐', cat: '餐飲', amount: -700, date: '2026-04-10', time: '12:00' }],
      recurring: [],
      goals: [{ id: 1, name: '旅行基金', target: 10000, saved: 8500, icon: '✈️', color: '#6366F1' }],
      budgets: {
        餐飲: 600,
        交通: 0,
        購物: 0,
        娛樂: 0,
        帳單: 0,
        健康: 0,
        教育: 0,
        其他: 0,
      },
    });

    render(<App />);
    vi.advanceTimersByTime(1700);

    fireEvent.click(screen.getByText('報表', { selector: 'span' }));
    expect(screen.getByLabelText('報表預算摘要')).toHaveTextContent('已超支分類：1（餐飲）');
    expect(screen.getByLabelText('報表目標摘要')).toHaveTextContent('目前最接近完成：✈️ 旅行基金（85%）');

    fireEvent.click(screen.getByLabelText('前往預算分頁查看摘要對應內容'));
    expect(screen.getByLabelText('預算分頁內容')).toBeInTheDocument();
    expect(screen.getByText('本月總預算')).toBeInTheDocument();
    expect(screen.getByText('餐飲')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '報表' }));
    fireEvent.click(screen.getByLabelText('前往目標分頁查看摘要對應內容'));
    expect(screen.getByLabelText('目標分頁內容')).toBeInTheDocument();
    expect(screen.getByText('旅行基金')).toBeInTheDocument();
  });

  it('Recurring 自動入帳 reconcile 後，交易與報表會立即可觀察（App 真實流程）', () => {
    useFinanceStore.setState({
      transactions: [],
      recurring: [
        { id: 801, name: 'Netflix', cat: '娛樂', amount: -390, freq: 'monthly', nextDate: '2026-04-15', active: true, autoPost: true },
      ],
      goals: [],
      budgets: {
        餐飲: 0,
        交通: 0,
        購物: 0,
        娛樂: 0,
        帳單: 0,
        健康: 0,
        教育: 0,
        其他: 0,
      },
    });

    render(<App />);
    vi.advanceTimersByTime(1700);

    expect(useFinanceStore.getState().transactions[0]).toMatchObject({ name: 'Netflix', amount: -390, date: '2026-04-15' });

    fireEvent.click(screen.getByText('收支'));
    expect(screen.getByText('Netflix')).toBeInTheDocument();

    fireEvent.click(screen.getByText('報表'));
    expect(screen.getByLabelText('月支出目前選取月份')).toHaveTextContent('2026-04：NT$390');
  });

  it('Recurring confirm 模式：reconcile 後進入待確認，確認後才入帳並反映到報表', () => {
    useFinanceStore.setState({
      transactions: [],
      recurring: [
        { id: 901, name: '健身房', cat: '健康', amount: -1200, freq: 'monthly', nextDate: '2026-04-15', active: true, autoPostMode: 'confirm' },
      ],
      goals: [],
      budgets: {
        餐飲: 0,
        交通: 0,
        購物: 0,
        娛樂: 0,
        帳單: 0,
        健康: 0,
        教育: 0,
        其他: 0,
      },
    });

    render(<App />);
    vi.advanceTimersByTime(1700);

    expect(useFinanceStore.getState().transactions).toHaveLength(0);

    fireEvent.click(screen.getByText('收支'));
    fireEvent.click(screen.getByText('定期帳目'));
    expect(screen.getByText('待確認輪次：04/15（尚未入帳）')).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText('確認入帳健身房'));
    expect(useFinanceStore.getState().transactions[0]).toMatchObject({ name: '健身房', amount: -1200, date: '2026-04-15' });

    fireEvent.click(screen.getByText('報表'));
    expect(screen.getByLabelText('月支出目前選取月份')).toHaveTextContent('2026-04：NT$1,200');
  });

  it('Recurring pending 批次確認後，交易與摘要會同步更新', () => {
    useFinanceStore.setState({
      transactions: [],
      recurring: [
        { id: 911, name: '待確認電費', cat: '帳單', amount: -900, freq: 'monthly', nextDate: '2026-04-15', active: true, autoPostMode: 'confirm' },
        { id: 912, name: '待確認網路', cat: '帳單', amount: -700, freq: 'monthly', nextDate: '2026-04-15', active: true, autoPostMode: 'confirm' },
      ],
      goals: [],
      budgets: {
        餐飲: 0,
        交通: 0,
        購物: 0,
        娛樂: 0,
        帳單: 0,
        健康: 0,
        教育: 0,
        其他: 0,
      },
    });

    render(<App />);
    vi.advanceTimersByTime(1700);

    fireEvent.click(screen.getByText('收支'));
    fireEvent.click(screen.getByText('定期帳目'));
    fireEvent.click(screen.getByLabelText('只看待確認'));
    fireEvent.click(screen.getByLabelText('批次確認入帳'));

    expect(useFinanceStore.getState().transactions).toHaveLength(2);
    expect(useFinanceStore.getState().transactions[0]).toMatchObject({ cat: '帳單', date: '2026-04-15' });

    fireEvent.click(screen.getByText('總覽'));
    expect(screen.getByLabelText('首頁定期提醒摘要')).toHaveTextContent('今日到期 0 項');
  });

  it('Recurring 提醒操作後，Home 與 Recurring 摘要會立即同步（App 真實流程）', () => {
    useFinanceStore.setState({
      transactions: [{ id: 1, name: '四月午餐', cat: '餐飲', amount: -100, date: '2026-04-10', time: '12:00' }],
      recurring: [
        { id: 101, name: '今天要扣', cat: '娛樂', amount: -390, freq: 'monthly', nextDate: '2026-04-15', active: true },
        { id: 102, name: '昨天未扣', cat: '帳單', amount: -1200, freq: 'monthly', nextDate: '2026-04-14', active: true },
      ],
      goals: [],
      budgets: {
        餐飲: 0,
        交通: 0,
        購物: 0,
        娛樂: 0,
        帳單: 0,
        健康: 0,
        教育: 0,
        其他: 0,
      },
    });

    render(<App />);
    vi.advanceTimersByTime(2100);

    fireEvent.click(screen.getByText('收支'));
    fireEvent.click(screen.getByText('定期帳目'));

    expect(screen.getByLabelText('定期帳目到期提醒摘要')).toHaveTextContent('今日到期 1 項');
    expect(screen.getByLabelText('定期帳目到期提醒摘要')).toHaveTextContent('逾期未處理 1 項');

    fireEvent.click(screen.getByLabelText('標記已處理昨天未扣'));
    expect(screen.getByLabelText('定期帳目到期提醒摘要')).toHaveTextContent('逾期未處理 0 項');

    fireEvent.click(screen.getByRole('button', { name: '只看逾期未處理' }));
    expect(screen.getByText('目前篩選條件下沒有符合的到期提醒項目，請切換篩選或新增一筆定期帳目。')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '全部到期篩選' }));
    fireEvent.click(screen.getByLabelText('延後一次今天要扣'));
    expect(screen.getByLabelText('定期帳目到期提醒摘要')).toHaveTextContent('今日到期 0 項');

    fireEvent.click(screen.getByText('總覽'));
    expect(screen.getByLabelText('首頁定期提醒摘要')).toHaveTextContent('今日到期 0 項');
    expect(screen.getByLabelText('首頁定期提醒摘要')).toHaveTextContent('逾期未處理 0 項');
  });

  it('Settings 切換預設幣別後，Home / Reports 金額顯示會同步切換（僅顯示層）', () => {
    useFinanceStore.setState({
      transactions: [
        { id: 1, name: '四月午餐', cat: '餐飲', amount: -100, date: '2026-04-10', time: '12:00' },
      ],
      recurring: [],
      goals: [],
      budgets: {
        餐飲: 500,
        交通: 0,
        購物: 0,
        娛樂: 0,
        帳單: 0,
        健康: 0,
        教育: 0,
        其他: 0,
      },
    });

    render(<App />);
    vi.advanceTimersByTime(1700);

    fireEvent.click(screen.getByText('設定'));
    fireEvent.click(screen.getByText('預設幣別'));
    fireEvent.click(screen.getByLabelText('選擇幣別USD'));

    fireEvent.click(screen.getByText('總覽'));
    expect(screen.getAllByText(/US\$/).length).toBeGreaterThan(0);

    fireEvent.click(screen.getByText('報表'));
    expect(screen.getByLabelText('報表幣別口徑提示')).toHaveTextContent('顯示幣別 US$｜基準幣別 NT$（僅顯示，未換算）');
    fireEvent.click(screen.getByText('預算'));
    expect(screen.getByLabelText('預算幣別口徑提示')).toHaveTextContent('顯示幣別 US$｜基準幣別 NT$（僅顯示，未換算）');
    expect(screen.getByText('US$100.00')).toBeInTheDocument();
    expect(screen.getAllByText('US$500.00').length).toBeGreaterThan(0);
  });
});
