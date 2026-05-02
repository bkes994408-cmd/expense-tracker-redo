import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SettingsPage } from '../pages/settings/SettingsPage';
import { buildCsv, filterTransactionsForCsv, getCsvFilename } from '../utils/csv';
import { FONTS, RADII, THEME_TOKENS } from '../theme/theme';
import type { CsvExportOptions } from '../pages/pageTypes';
import type { Transaction } from '../domain/types';

const t = THEME_TOKENS.minimal.light;
const r = RADII.minimal;
const f = FONTS.minimal;

describe('Settings CSV export integration flow', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-04-11T10:30:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('可切換 scope、選分類並觸發接近真實下載流程的匯出函式', () => {
    const txns: Transaction[] = [
      { id: 1, name: '午餐', cat: '餐飲', amount: -120, date: '2026-04-10', time: '12:30' },
      { id: 2, name: '捷運', cat: '交通', amount: -45, date: '2026-04-09', time: '09:00' },
      { id: 3, name: '耳機', cat: '購物', amount: -1680, date: '2026-03-30', time: '18:20' },
    ];
    const month = 3;

    const downloadCsv = vi.fn();
    const onExportCsv = (options: CsvExportOptions) => {
      const exportedTxns = filterTransactionsForCsv(txns, month, options);
      const csv = buildCsv(exportedTxns);
      downloadCsv({ csv, filename: getCsvFilename(options), options, count: exportedTxns.length });
    };

    render(
      <SettingsPage
        t={t}
        r={r}
        f={f}
        style="minimal"
        setStyle={() => {}}
        mode="light"
        setMode={() => {}}
        currency="NTD"
        setCurrency={() => {}}
        monthStartDay={1}
        setMonthStartDay={() => {}}
        billReminder={false}
        setBillReminder={() => {}}
        iCloudBackup={false}
        setICloudBackup={() => {}}
        exportCategories={['餐飲', '交通', '購物']}
        getCsvExportCount={(options) => filterTransactionsForCsv(txns, month, options).length}
        onExportCsv={onExportCsv}
        onClearAllData={() => {}}
        onRateApp={() => {}}
      />,
    );

    fireEvent.click(screen.getByText('全部'));
    expect(screen.getByLabelText('CSV匯出預覽')).toHaveTextContent('預計匯出 3 筆記錄');
    expect(screen.getByLabelText('CSV匯出檔名預覽')).toHaveTextContent(`下載檔名：${getCsvFilename({ scope: 'all' })}`);

    fireEvent.click(screen.getByText('分類'));
    expect(screen.getByRole('button', { name: '匯出 CSV' })).toBeDisabled();
    expect(screen.getByLabelText('CSV匯出檔名預覽')).toHaveTextContent('請先選擇分類後產生檔名');

    fireEvent.change(screen.getByLabelText('CSV分類匯出分類'), { target: { value: '交通' } });
    expect(screen.getByLabelText('CSV匯出預覽')).toHaveTextContent('預計匯出 1 筆記錄');
    const previewText = screen.getByLabelText('CSV匯出檔名預覽').textContent;
    expect(previewText).toBe(`下載檔名：${getCsvFilename({ scope: 'category', category: '交通' })}`);

    fireEvent.click(screen.getByRole('button', { name: '匯出 CSV' }));

    expect(downloadCsv).toHaveBeenCalledTimes(1);
    expect(downloadCsv).toHaveBeenCalledWith(
      expect.objectContaining({
        filename: getCsvFilename({ scope: 'category', category: '交通' }),
        options: { scope: 'category', category: '交通' },
        count: 1,
      }),
    );
    expect(downloadCsv.mock.calls[0][0].filename).toBe(previewText?.replace('下載檔名：', ''));

    const csv = downloadCsv.mock.calls[0][0].csv as string;
    expect(csv).toContain('"日期","時間","名稱","分類","金額"');
    expect(csv).toContain('"捷運","交通"');
    expect(csv).not.toContain('"午餐","餐飲"');
  });
});
