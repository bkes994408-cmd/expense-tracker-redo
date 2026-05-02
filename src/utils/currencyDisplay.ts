import { CURRENCY_SYMBOL, formatAmount, formatMoney, type DisplayCurrency } from './format';

export const DEFAULT_BASE_CURRENCY: DisplayCurrency = 'NTD';

export type CurrencyDisplayContext = {
  displayCurrency: DisplayCurrency;
  baseCurrency: DisplayCurrency;
};

export type DisplayAmountAdapterInput = CurrencyDisplayContext & {
  amount: number;
  originalCurrency?: DisplayCurrency;
};

export type DisplayAmountAdapterResult = CurrencyDisplayContext & {
  rawAmount: number;
  displayAmount: number;
  formattedAmount: string;
  formattedMoney: string;
  originalCurrency: DisplayCurrency;
  converted: false;
};

export function createCurrencyDisplayContext(displayCurrency: DisplayCurrency, baseCurrency: DisplayCurrency = DEFAULT_BASE_CURRENCY): CurrencyDisplayContext {
  return { displayCurrency, baseCurrency };
}

export function resolveOriginalCurrency(originalCurrency: DisplayCurrency | undefined, fallbackCurrency: DisplayCurrency = DEFAULT_BASE_CURRENCY): DisplayCurrency {
  return originalCurrency ?? fallbackCurrency;
}

export function adaptAmountForDisplay({ amount, displayCurrency, baseCurrency = DEFAULT_BASE_CURRENCY, originalCurrency }: DisplayAmountAdapterInput): DisplayAmountAdapterResult {
  const resolvedOriginalCurrency = resolveOriginalCurrency(originalCurrency, baseCurrency);
  return {
    rawAmount: amount,
    displayAmount: amount,
    formattedAmount: formatAmount(amount, displayCurrency),
    formattedMoney: formatMoney(amount, displayCurrency),
    displayCurrency,
    baseCurrency,
    originalCurrency: resolvedOriginalCurrency,
    converted: false,
  };
}

export function getDisplayCurrencySemanticHint(context: CurrencyDisplayContext) {
  return `顯示幣別 ${CURRENCY_SYMBOL[context.displayCurrency]}｜基準幣別 ${CURRENCY_SYMBOL[context.baseCurrency]}（僅顯示，未換算）`;
}
