import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ReportTab } from '../pages/reports/ReportTab';
import { INITIAL_BUDGETS } from '../domain/initialData';
import { f, r, t } from './testTheme';

describe('ReportTab real-data coverage', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-04-15T10:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('有真實交易資料時會正確呈現趨勢、分類占比與月對月變化率', () => {
    render(
      <ReportTab
        txns={[
          { id: 1, name: '三月午餐', cat: '餐飲', amount: -100, date: '2026-03-10', time: '12:00' },
          { id: 2, name: '四月午餐', cat: '餐飲', amount: -300, date: '2026-04-02', time: '12:00' },
          { id: 3, name: '四月捷運', cat: '交通', amount: -200, date: '2026-04-09', time: '08:30' },
          { id: 4, name: '四月購物', cat: '購物', amount: -400, date: '2026-04-12', time: '09:30' },
          { id: 5, name: '四月娛樂', cat: '娛樂', amount: -350, date: '2026-04-13', time: '20:00' },
          { id: 6, name: '四月帳單', cat: '帳單', amount: -200, date: '2026-04-14', time: '18:00' },
          { id: 7, name: '四月健康', cat: '健康', amount: -180, date: '2026-04-11', time: '10:00' },
          { id: 8, name: '四月教育', cat: '教育', amount: -180, date: '2026-04-10', time: '11:00' },
          { id: 9, name: '四月其他', cat: '其他', amount: -90, date: '2026-04-06', time: '17:00' },
        ]}
        summaryTxns={[
          { id: 2, name: '四月午餐', cat: '餐飲', amount: -300, date: '2026-04-02', time: '12:00' },
          { id: 3, name: '四月捷運', cat: '交通', amount: -200, date: '2026-04-09', time: '08:30' },
          { id: 4, name: '四月購物', cat: '購物', amount: -400, date: '2026-04-12', time: '09:30' },
          { id: 5, name: '四月娛樂', cat: '娛樂', amount: -350, date: '2026-04-13', time: '20:00' },
          { id: 6, name: '四月帳單', cat: '帳單', amount: -200, date: '2026-04-14', time: '18:00' },
          { id: 7, name: '四月健康', cat: '健康', amount: -180, date: '2026-04-11', time: '10:00' },
          { id: 8, name: '四月教育', cat: '教育', amount: -180, date: '2026-04-10', time: '11:00' },
          { id: 9, name: '四月其他', cat: '其他', amount: -90, date: '2026-04-06', time: '17:00' },
        ]}
        budgets={{ ...INITIAL_BUDGETS, 餐飲: 250, 交通: 210, 購物: 300, 娛樂: 300, 帳單: 220, 健康: 150, 教育: 200, 其他: 100 }}
        goals={[
          { id: 1, name: '旅行基金', target: 10000, saved: 8000, icon: '✈️', color: '#6366F1' },
          { id: 2, name: '筆電基金', target: 50000, saved: 10000, icon: '💻', color: '#6366F1' },
          { id: 3, name: '緊急預備金', target: 10000, saved: 8500, icon: '🛟', color: '#6366F1' },
          { id: 4, name: '家電基金', target: 20000, saved: 18000, icon: '🏠', color: '#6366F1' },
          { id: 5, name: '閱讀基金', target: 20000, saved: 1000, icon: '📚', color: '#6366F1' },
        ]}
        t={t}
        r={r}
        f={f}
      currency="NTD"
      />,
    );

    expect(screen.getByLabelText('月支出目前選取月份')).toHaveTextContent('2026-04：NT$1,900');
    expect(screen.getByLabelText('月對月變化率')).toHaveTextContent('環比（月對月）：↑ 1800.0%（2026-03 → 2026-04）');
    expect(screen.getByLabelText('報表決策摘要提示')).toHaveTextContent('口徑：本月預算/目標 + 近期趨勢區間；依目前資料即時計算。');
    expect(screen.getByLabelText('報表預算摘要')).toHaveTextContent('本月總預算使用率：110%');
    expect(screen.getByLabelText('報表預算摘要')).toHaveTextContent('已超支分類：4（餐飲、購物、娛樂 +1）');
    expect(screen.getByLabelText('報表預算摘要')).toHaveTextContent('接近超支提醒：4（交通、帳單、教育 +1）');
    expect(screen.getByLabelText('報表目標摘要')).toHaveTextContent('目標整體進度：41%');
    expect(screen.getByLabelText('報表目標摘要')).toHaveTextContent('目前最接近完成：🏠 家電基金（90%）');
    expect(screen.getByLabelText('報表目標摘要')).toHaveTextContent('即將完成（≥80%）：🏠 家電基金（90%）、🛟 緊急預備金（85%）、✈️ 旅行基金（80%）');

    expect(screen.getAllByText('餐飲').length).toBeGreaterThan(0);
    expect(screen.getAllByText('交通').length).toBeGreaterThan(0);
    expect(screen.getByText('2026-04：NT$1,900')).toBeInTheDocument();

    fireEvent.click(screen.getByTitle('2026-03：NT$100'));
    expect(screen.getByLabelText('月支出目前選取月份')).toHaveTextContent('2026-03：NT$100');
  });

  it('前一個月為 0 時顯示無法計算月對月', () => {
    render(
      <ReportTab
        txns={[{ id: 10, name: '四月支出', cat: '餐飲', amount: -250, date: '2026-04-03', time: '12:00' }]}
        t={t}
        r={r}
        f={f}
      currency="NTD"
      />,
    );

    expect(screen.getByLabelText('月對月變化率')).toHaveTextContent('環比（月對月）：2026-03 為 0，無法計算變化率。');

    fireEvent.click(screen.getByText('季'));
    expect(screen.getByLabelText('報表時間區間摘要')).toHaveTextContent('季分析');
    expect(screen.getByLabelText('月對月變化率')).toHaveTextContent('環比（季對季）：2026-Q1 為 0，無法計算變化率。');
  });

  it('預算/目標未設定時顯示摘要 empty state', () => {
    render(
      <ReportTab
        txns={[{ id: 10, name: '四月支出', cat: '餐飲', amount: -250, date: '2026-04-03', time: '12:00' }]}
        summaryTxns={[{ id: 10, name: '四月支出', cat: '餐飲', amount: -250, date: '2026-04-03', time: '12:00' }]}
        budgets={INITIAL_BUDGETS}
        goals={[]}
        t={t}
        r={r}
        f={f}
      currency="NTD"
      />,
    );

    expect(screen.getByLabelText('報表預算摘要')).toHaveTextContent('尚未設定預算，請到「預算」分頁設定後回來查看使用率。');
    expect(screen.getByLabelText('報表目標摘要')).toHaveTextContent('目前沒有儲蓄目標，請到「目標」分頁新增後回來查看整體進度。');
  });

  it('沒有即將完成目標時顯示合理文案', () => {
    render(
      <ReportTab
        txns={[{ id: 10, name: '四月支出', cat: '餐飲', amount: -250, date: '2026-04-03', time: '12:00' }]}
        summaryTxns={[{ id: 10, name: '四月支出', cat: '餐飲', amount: -250, date: '2026-04-03', time: '12:00' }]}
        goals={[
          { id: 1, name: '旅行基金', target: 10000, saved: 7000, icon: '✈️', color: '#6366F1' },
          { id: 2, name: '筆電基金', target: 50000, saved: 10000, icon: '💻', color: '#6366F1' },
        ]}
        t={t}
        r={r}
        f={f}
      currency="NTD"
      />, 
    );

    expect(screen.getByLabelText('報表目標摘要')).toHaveTextContent('即將完成（≥80%）：目前無');
  });
});
