import { CURRENCY_SYMBOL, type DisplayCurrency } from './format';
import { DEFAULT_BASE_CURRENCY } from './currencyDisplay';

export type ExchangeRateProviderStatus = 'not-configured' | 'ready';
export type ExchangeRateHistoricalPolicy = 'not-defined' | 'transaction-date' | 'today' | 'monthly-average';

export type ExchangeRateReadinessSummary = {
  headline: string;
  detail: string;
  providerLabel: string;
  historicalPolicyLabel: string;
  conversionActive: boolean;
  copyText: string;
};

function getProviderLabel(status: ExchangeRateProviderStatus): string {
  return status === 'ready' ? '匯率來源已設定' : '尚未設定匯率來源';
}

function getHistoricalPolicyLabel(policy: ExchangeRateHistoricalPolicy): string {
  if (policy === 'transaction-date') return '交易日匯率';
  if (policy === 'today') return '今日匯率';
  if (policy === 'monthly-average') return '月均匯率';
  return '尚未定義歷史匯率口徑';
}

export function createExchangeRateReadinessSummary(input: {
  displayCurrency: DisplayCurrency;
  baseCurrency?: DisplayCurrency;
  providerStatus?: ExchangeRateProviderStatus;
  historicalPolicy?: ExchangeRateHistoricalPolicy;
}): ExchangeRateReadinessSummary {
  const baseCurrency = input.baseCurrency ?? DEFAULT_BASE_CURRENCY;
  const providerStatus = input.providerStatus ?? 'not-configured';
  const historicalPolicy = input.historicalPolicy ?? 'not-defined';
  const providerLabel = getProviderLabel(providerStatus);
  const historicalPolicyLabel = getHistoricalPolicyLabel(historicalPolicy);
  const conversionActive = providerStatus === 'ready' && historicalPolicy !== 'not-defined';
  const displayLabel = `${input.displayCurrency} ${CURRENCY_SYMBOL[input.displayCurrency]}`;
  const baseLabel = `${baseCurrency} ${CURRENCY_SYMBOL[baseCurrency]}`;

  const headline = conversionActive
    ? `顯示 ${displayLabel}，以 ${historicalPolicyLabel} 換算`
    : `顯示 ${displayLabel}，目前不自動換算`;
  const detail = conversionActive
    ? `基準幣別為 ${baseLabel}，金額會依已設定匯率來源與${historicalPolicyLabel}轉換。`
    : `基準幣別為 ${baseLabel}；${providerLabel}，${historicalPolicyLabel}。目前所有金額只切換符號與格式，不會自動換算。`;
  const copyText = [
    'Expense Tracker Redo 匯率狀態',
    `Display currency: ${input.displayCurrency}`,
    `Base currency: ${baseCurrency}`,
    `Provider: ${providerLabel}`,
    `Historical policy: ${historicalPolicyLabel}`,
    `Automatic conversion: ${conversionActive ? 'enabled' : 'disabled'}`,
  ].join('\n');

  return {
    headline,
    detail,
    providerLabel,
    historicalPolicyLabel,
    conversionActive,
    copyText,
  };
}
