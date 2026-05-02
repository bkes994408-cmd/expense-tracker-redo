import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  buildCsvExportPayload,
  downloadCsvFile,
  getCsvExportCategories,
  getCsvExportSummary,
  toCsvExportFeedback,
} from '../app/exportActions';
import type { Transaction } from '../domain/types';

const TXNS: Transaction[] = [
  { id: 1, name: '午餐', cat: '餐飲', amount: -120, date: '2026-04-10', time: '12:00' },
  { id: 2, name: '捷運', cat: '交通', amount: -35, date: '2026-04-11', time: '08:30' },
  { id: 3, name: '年終', cat: '收入', amount: 50000, date: '2026-03-31', time: '09:00' },
];

describe('exportActions', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('buildCsvExportPayload 會產生下載 payload 與成功摘要', () => {
    const payload = buildCsvExportPayload(
      TXNS,
      3,
      { scope: 'category', category: '交通' },
      new Date('2026-04-11T10:30:00Z'),
    );

    expect(payload).toMatchObject({
      filename: 'expense-tracker-category-交通-2026-04-11.csv',
      count: 1,
      summary: '當月 交通 1 筆',
      options: { scope: 'category', category: '交通' },
    });
    expect(payload?.csv).toContain('"捷運","交通"');
    expect(payload?.csv).not.toContain('"午餐","餐飲"');
    expect(toCsvExportFeedback(payload as NonNullable<typeof payload>)).not.toHaveProperty('csv');
  });

  it('沒有可匯出資料時回傳 null', () => {
    expect(buildCsvExportPayload(TXNS, 0, { scope: 'month' })).toBeNull();
    expect(buildCsvExportPayload(TXNS, 3, { scope: 'category' })).toBeNull();
  });

  it('匯出分類與摘要會維持設定頁需要的語意', () => {
    expect(getCsvExportCategories(TXNS)).toEqual(['餐飲', '交通', '收入']);
    expect(getCsvExportSummary({ scope: 'all' }, 3)).toBe('全部交易 3 筆');
    expect(getCsvExportSummary({ scope: 'month' }, 2)).toBe('當月全部交易 2 筆');
    expect(getCsvExportSummary({ scope: 'category', category: '交通' }, 1)).toBe('當月 交通 1 筆');
  });

  it('downloadCsvFile 會建立 Blob anchor 並釋放 URL', () => {
    const createObjectURLSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:csv');
    const revokeObjectURLSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    const createElementSpy = vi.spyOn(document, 'createElement');

    downloadCsvFile('csv-content', 'export.csv');

    expect(createObjectURLSpy).toHaveBeenCalledTimes(1);
    expect(clickSpy).toHaveBeenCalledTimes(1);
    expect(revokeObjectURLSpy).toHaveBeenCalledWith('blob:csv');

    const anchorIndex = createElementSpy.mock.calls.findIndex((call) => call[0] === 'a');
    const anchor = createElementSpy.mock.results[anchorIndex]?.value as HTMLAnchorElement;
    expect(anchor.download).toBe('export.csv');
  });
});
