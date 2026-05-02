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
import { getCsvFilename } from '../utils/csv';

describe('App CSV download flow', () => {
  const writeTextMock = vi.fn();

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-04-11T10:30:00Z'));
    writeTextMock.mockReset();
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: writeTextMock },
      configurable: true,
    });

    useAppStore.setState({
      style: 'minimal',
      mode: 'light',
      tab: 0,
      month: 3,
      currency: 'NTD',
      monthStartDay: 1,
      billReminder: true,
      iCloudBackup: false,
    });

    useFinanceStore.setState({
      transactions: [
        { id: 1, name: '午餐', cat: '餐飲', amount: -120, date: '2026-04-10', time: '12:30' },
        { id: 2, name: '捷運', cat: '交通', amount: -45, date: '2026-04-09', time: '09:00' },
        { id: 3, name: '耳機', cat: '購物', amount: -1680, date: '2026-03-30', time: '18:20' },
      ],
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
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('從 App 設定頁匯出分類 CSV 時，實際 download 檔名與預覽一致且內容受 scope/category 影響', async () => {
    const createObjectURLSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock-csv');
    const revokeObjectURLSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    const createElementSpy = vi.spyOn(document, 'createElement');

    render(<App />);

    fireEvent.click(screen.getByText('設定'));
    fireEvent.click(screen.getByText('分類'));
    fireEvent.change(screen.getByLabelText('CSV分類匯出分類'), { target: { value: '交通' } });

    const filenamePreviewText = screen.getByLabelText('CSV匯出檔名預覽').textContent;
    const expectedFilename = getCsvFilename({ scope: 'category', category: '交通' });
    expect(filenamePreviewText).toBe(`下載檔名：${expectedFilename}`);

    fireEvent.click(screen.getByRole('button', { name: '匯出 CSV' }));
    expect(screen.getByLabelText('CSV匯出成功摘要')).toHaveTextContent('已完成匯出');
    expect(screen.getByLabelText('CSV匯出成功摘要')).toHaveTextContent(expectedFilename);
    expect(screen.getByLabelText('CSV匯出成功摘要')).toHaveTextContent('條件：範圍 當月分類交易｜分類 交通｜筆數 1');
    expect(screen.getByLabelText('CSV匯出成功摘要')).toHaveTextContent('快速重跑上一筆匯出條件');

    fireEvent.click(screen.getByRole('button', { name: '再次匯出相同條件' }));
    expect(createObjectURLSpy).toHaveBeenCalledTimes(2);
    const rerunAnchorCallIndex = createElementSpy.mock.calls
      .map((call, index) => ({ tag: call[0], index }))
      .filter((x) => x.tag === 'a')
      .at(-1)?.index;
    expect(rerunAnchorCallIndex).toBeDefined();
    const rerunAnchor = createElementSpy.mock.results[rerunAnchorCallIndex as number]?.value as HTMLAnchorElement;
    expect(rerunAnchor.download).toBe(expectedFilename);

    expect(clickSpy).toHaveBeenCalledTimes(2);
    expect(revokeObjectURLSpy).toHaveBeenCalledWith('blob:mock-csv');

    const anchorCallIndex = createElementSpy.mock.calls.findIndex((call) => call[0] === 'a');
    expect(anchorCallIndex).toBeGreaterThanOrEqual(0);

    const anchor = createElementSpy.mock.results[anchorCallIndex]?.value as HTMLAnchorElement;
    expect(anchor.download).toBe(expectedFilename);
    expect(anchor.download).toBe(filenamePreviewText?.replace('下載檔名：', ''));

    const categoryBlobArg = createObjectURLSpy.mock.calls[0]?.[0] as { size?: number };

    fireEvent.click(screen.getByText('全部'));
    const allFilename = getCsvFilename({ scope: 'all' });
    expect(screen.getByLabelText('CSV匯出檔名預覽')).toHaveTextContent(`下載檔名：${allFilename}`);
    fireEvent.click(screen.getByRole('button', { name: '匯出 CSV' }));

    const allBlobArg = createObjectURLSpy.mock.calls[2]?.[0] as { size?: number };
    expect(createObjectURLSpy).toHaveBeenCalledTimes(3);
    expect(typeof categoryBlobArg?.size).toBe('number');
    expect(typeof allBlobArg?.size).toBe('number');
    expect((allBlobArg.size ?? 0)).toBeGreaterThan(categoryBlobArg.size ?? 0);

    const latestAnchorCallIndex = createElementSpy.mock.calls
      .map((call, index) => ({ tag: call[0], index }))
      .filter((x) => x.tag === 'a')
      .at(-1)?.index;
    expect(latestAnchorCallIndex).toBeDefined();
    const latestAnchor = createElementSpy.mock.results[latestAnchorCallIndex as number]?.value as HTMLAnchorElement;
    expect(latestAnchor.download).toBe(allFilename);
  });

  it('從 App 設定頁切到匯出區後，0 筆資料不會觸發下載流程', () => {
    const createObjectURLSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock-csv');
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

    useAppStore.setState({ month: 0 });
    render(<App />);

    fireEvent.click(screen.getByText('設定'));

    expect(screen.getByLabelText('CSV匯出預覽')).toHaveTextContent('目前範圍沒有可匯出的資料，請切換範圍後再試。');
    expect(screen.getByRole('button', { name: '匯出 CSV' })).toBeDisabled();

    fireEvent.click(screen.getByRole('button', { name: '匯出 CSV' }));

    expect(createObjectURLSpy).not.toHaveBeenCalled();
    expect(clickSpy).not.toHaveBeenCalled();
  });

  it('從 App 設定頁切到分類匯出，當 category 在當月為 0 筆時不會觸發下載', () => {
    const createObjectURLSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock-csv');
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

    useAppStore.setState({ month: 4 });

    render(<App />);

    fireEvent.click(screen.getByText('設定'));
    fireEvent.click(screen.getByText('分類'));
    fireEvent.change(screen.getByLabelText('CSV分類匯出分類'), { target: { value: '購物' } });

    expect(screen.getByLabelText('CSV匯出預覽')).toHaveTextContent('目前範圍沒有可匯出的資料，請切換範圍後再試。');

    const exportButton = screen.getByRole('button', { name: '匯出 CSV' });
    expect(exportButton).toBeDisabled();

    fireEvent.click(exportButton);

    expect(createObjectURLSpy).not.toHaveBeenCalled();
    expect(clickSpy).not.toHaveBeenCalled();
  });

  it('定期帳目批次停用會顯示含影響筆數的 toast 回饋', () => {
    render(<App />);

    useFinanceStore.setState({
      recurring: [
        { id: 100, name: 'Netflix', cat: '娛樂', amount: -390, freq: 'monthly', nextDate: '2026-04-20', active: true },
      ],
    });

    fireEvent.click(screen.getByText('收支'));
    fireEvent.click(screen.getByText('定期帳目'));
    fireEvent.click(screen.getByRole('button', { name: '全選目前篩選結果' }));
    fireEvent.click(screen.getByRole('button', { name: '批次停用' }));

    expect(screen.getByText('批次停用完成（1/1 筆已更新）')).toBeInTheDocument();
  });

  it('CSV 匯出成功卡可一鍵複製檔名並顯示回饋', async () => {
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock-csv');
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

    render(<App />);

    fireEvent.click(screen.getByText('設定'));
    fireEvent.click(screen.getByRole('button', { name: '匯出 CSV' }));

    const expectedFilename = getCsvFilename({ scope: 'month' });
    fireEvent.click(screen.getByRole('button', { name: '複製CSV檔名' }));
    await Promise.resolve();

    expect(writeTextMock).toHaveBeenCalledWith(expectedFilename);
  });
});
