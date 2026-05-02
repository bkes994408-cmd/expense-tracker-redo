import { describe, expect, it } from 'vitest';
import { adaptAmountForDisplay, createCurrencyDisplayContext, getDisplayCurrencySemanticHint } from '../utils/currencyDisplay';

describe('currencyDisplay adapter semantics', () => {
  it('會同時帶出 display/base currency 語意，且目前不做換算', () => {
    const result = adaptAmountForDisplay({
      amount: 1234,
      displayCurrency: 'USD',
      baseCurrency: 'NTD',
      originalCurrency: 'JPY',
    });

    expect(result.displayAmount).toBe(1234);
    expect(result.rawAmount).toBe(1234);
    expect(result.converted).toBe(false);
    expect(result.displayCurrency).toBe('USD');
    expect(result.baseCurrency).toBe('NTD');
    expect(result.originalCurrency).toBe('JPY');
    expect(result.formattedMoney).toBe('US$1,234.00');
  });

  it('幣別口徑提示會反映目前 display currency 並明確標示未換算', () => {
    const hint = getDisplayCurrencySemanticHint(createCurrencyDisplayContext('JPY'));
    expect(hint).toContain('顯示幣別 JP¥');
    expect(hint).toContain('基準幣別 NT$');
    expect(hint).toContain('未換算');
  });

  it('originalCurrency 缺省時會 fallback 到 baseCurrency，且仍維持 converted=false', () => {
    const result = adaptAmountForDisplay({
      amount: 520,
      displayCurrency: 'USD',
      baseCurrency: 'NTD',
    });

    expect(result.originalCurrency).toBe('NTD');
    expect(result.displayCurrency).toBe('USD');
    expect(result.converted).toBe(false);
  });
});
