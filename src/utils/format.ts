import type { CurrencyCode, Transaction } from '../domain/types';

export type DisplayCurrency = CurrencyCode;

type CurrencyFormatConfig = {
  locale: string;
  symbol: string;
  fractionDigits: number;
};

const CURRENCY_CONFIG: Record<DisplayCurrency, CurrencyFormatConfig> = {
  NTD: { locale: 'zh-TW', symbol: 'NT$', fractionDigits: 0 },
  USD: { locale: 'en-US', symbol: 'US$', fractionDigits: 2 },
  JPY: { locale: 'ja-JP', symbol: 'JP¥', fractionDigits: 0 },
  EUR: { locale: 'de-DE', symbol: '€', fractionDigits: 2 },
  HKD: { locale: 'zh-HK', symbol: 'HK$', fractionDigits: 2 },
  CNY: { locale: 'zh-CN', symbol: 'CN¥', fractionDigits: 2 },
  GBP: { locale: 'en-GB', symbol: '£', fractionDigits: 2 },
};

export const CURRENCY_SYMBOL: Record<DisplayCurrency, string> = Object.fromEntries(
  Object.entries(CURRENCY_CONFIG).map(([code, config]) => [code, config.symbol]),
) as Record<DisplayCurrency, string>;

export function formatAmount(n: number, currency: DisplayCurrency = 'NTD') {
  const config = CURRENCY_CONFIG[currency];
  return Math.abs(n).toLocaleString(config.locale, {
    minimumFractionDigits: config.fractionDigits,
    maximumFractionDigits: config.fractionDigits,
  });
}

export function formatMoney(n: number, currency: DisplayCurrency = 'NTD') {
  return `${CURRENCY_CONFIG[currency].symbol}${formatAmount(n, currency)}`;
}

export function formatSignedMoney(n: number, currency: DisplayCurrency = 'NTD') {
  return `${n > 0 ? '+' : ''}${formatMoney(n, currency)}`;
}

export const fmt = (n: number, currency: DisplayCurrency = 'NTD') => formatAmount(n, currency);

export const fmtD = (d: string) => {
  if (d === '2026-04-05') return '今天';
  if (d === '2026-04-04') return '昨天';
  return d.slice(5).replace('-', '/');
};

export function groupByDate(list: Transaction[]) {
  const m: Record<string, Transaction[]> = {};
  list.forEach((x) => {
    if (!m[x.date]) m[x.date] = [];
    m[x.date].push(x);
  });
  return Object.entries(m).sort(([a], [b]) => b.localeCompare(a));
}
