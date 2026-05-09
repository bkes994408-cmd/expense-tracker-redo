import { describe, expect, it } from 'vitest';
import { createExchangeRateReadinessSummary } from '../utils/exchangeRatePolicy';

describe('exchangeRatePolicy helpers', () => {
  it('summarizes current display-only currency behavior before rate provider exists', () => {
    const summary = createExchangeRateReadinessSummary({ displayCurrency: 'USD', baseCurrency: 'NTD' });

    expect(summary.headline).toContain('目前不自動換算');
    expect(summary.detail).toContain('尚未設定匯率來源');
    expect(summary.detail).toContain('尚未定義歷史匯率口徑');
    expect(summary.detail).toContain('只切換符號與格式');
    expect(summary.conversionActive).toBe(false);
    expect(summary.copyText).toContain('Automatic conversion: disabled');
  });

  it('can describe a future ready provider and historical policy without changing callers', () => {
    const summary = createExchangeRateReadinessSummary({
      displayCurrency: 'JPY',
      baseCurrency: 'NTD',
      providerStatus: 'ready',
      historicalPolicy: 'transaction-date',
    });

    expect(summary.headline).toContain('交易日匯率');
    expect(summary.providerLabel).toBe('匯率來源已設定');
    expect(summary.historicalPolicyLabel).toBe('交易日匯率');
    expect(summary.conversionActive).toBe(true);
  });
});
