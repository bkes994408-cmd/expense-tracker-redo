import type { Category, Transaction } from '../domain/types';
import { CATEGORY_RULE_VERSION, detectCategoryByRules } from '../rules/categoryRules';

type CurrencyCode = NonNullable<Transaction['originalCurrency']>;

type ParsedAmountToken = {
  amount: number;
  sign: -1 | 1;
  currency?: CurrencyCode;
};

export type QuickEntryParseResult = {
  name: string;
  amount: number;
  cat: Category;
  type: 'income' | 'expense';
  matchedCategoryExplicitly: boolean;
  originalCurrency?: CurrencyCode;
  categorySource: 'system';
  categoryRuleVersion: string;
};

export type QuickEntryParseFailureReason = 'empty' | 'missing-amount' | 'invalid-amount' | 'missing-name';

export type QuickEntryDetailedParseResult =
  | {
      ok: true;
      value: QuickEntryParseResult;
    }
  | {
      ok: false;
      reason: QuickEntryParseFailureReason;
      message: string;
    };

const EXPENSE_HINTS = ['花', '買', '支付', '支出', '付款', '刷卡', '扣款'];
const INCOME_HINTS = ['收入', '入帳', '收到', '薪水', '薪資', '獎金', '退款', '回饋', '匯入'];
const LEADING_FILLERS = ['今天', '昨天', '昨日', '今晚', '今早', '剛剛', '剛才', '剛', '幫我記', '記帳', '記一下', '新增', '買了', '買', '花了', '花', '收到'];
const TYPE_ONLY_TOKENS = new Set(['收入', '支出', 'expense', 'income']);
const CURRENCY_TOKENS: Record<string, CurrencyCode> = {
  nt: 'NTD',
  ntd: 'NTD',
  twd: 'NTD',
  'nt$': 'NTD',
  'ntd$': 'NTD',
  '$': 'USD',
  usd: 'USD',
  'us$': 'USD',
  eur: 'EUR',
  '€': 'EUR',
  hkd: 'HKD',
  'hk$': 'HKD',
  cny: 'CNY',
  rmb: 'CNY',
  '¥': 'JPY',
  jpy: 'JPY',
  'jp¥': 'JPY',
  'cn¥': 'CNY',
  gbp: 'GBP',
  '£': 'GBP',
};

function normalize(input: string) {
  return input.trim().replace(/\s+/g, ' ');
}

function cleanupName(input: string) {
  let value = input.trim();
  for (const token of LEADING_FILLERS) {
    if (value.startsWith(token)) {
      value = value.slice(token.length).trim();
    }
  }
  return value.trim();
}

function detectCurrencyToken(token: string): CurrencyCode | undefined {
  return CURRENCY_TOKENS[token.trim().toLowerCase()];
}

function parseAmountToken(token: string): ParsedAmountToken | null {
  const trimmed = token.trim();
  if (!trimmed) return null;

  const match = trimmed.match(/^([+-]?)(nt\$|ntd\$|us\$|usd|eur|€|hkd|hk\$|cny|rmb|jpy|jp¥|cn¥|gbp|£|ntd|twd|\$|¥)?(\d+(?:\.\d+)?)(nt\$|ntd\$|us\$|usd|eur|€|hkd|hk\$|cny|rmb|jpy|jp¥|cn¥|gbp|£|ntd|twd|\$|¥)?$/i);
  if (!match) return null;

  const sign = match[1] === '-' ? -1 : 1;
  const prefixCurrency = match[2] ? detectCurrencyToken(match[2]) : undefined;
  const suffixCurrency = match[4] ? detectCurrencyToken(match[4]) : undefined;
  const value = Number.parseFloat(match[3]);
  if (!Number.isFinite(value)) return null;

  return {
    amount: Math.abs(value),
    sign,
    currency: prefixCurrency ?? suffixCurrency,
  };
}

function detectCategory(text: string): ReturnType<typeof detectCategoryByRules> {
  return detectCategoryByRules(text);
}

function detectType(name: string, category: Category, signedType?: 'income' | 'expense'): 'income' | 'expense' {
  if (signedType) return signedType;
  if (category === '收入') return 'income';
  const lowered = name.toLowerCase();
  if (INCOME_HINTS.some((hint) => lowered.includes(hint.toLowerCase()))) return 'income';
  if (EXPENSE_HINTS.some((hint) => lowered.includes(hint.toLowerCase()))) return 'expense';
  return 'expense';
}

function buildDefaultName(type: 'income' | 'expense') {
  return type === 'income' ? '快速收入' : '快速支出';
}

export function parseQuickEntryDetailed(input: string): QuickEntryDetailedParseResult {
  const normalized = normalize(input);
  if (!normalized) {
    return { ok: false, reason: 'empty', message: '請先輸入內容，例如：今天午餐 120' };
  }

  const tokens = normalized.split(' ');
  const reversedAmountIndex = [...tokens].reverse().findIndex((token) => parseAmountToken(token) !== null);
  if (reversedAmountIndex === -1) {
    return { ok: false, reason: 'missing-amount', message: '我看不懂金額，請補上數字，例如：買咖啡 90' };
  }

  const amountIndex = tokens.length - 1 - reversedAmountIndex;
  const parsedAmount = parseAmountToken(tokens[amountIndex]);
  if (!parsedAmount || parsedAmount.amount <= 0) {
    return { ok: false, reason: 'invalid-amount', message: '金額要大於 0，例如：收到退款 300' };
  }

  const beforeAmount = tokens.slice(0, amountIndex);
  const afterAmount = tokens.slice(amountIndex + 1);

  const adjacentCurrencies = [beforeAmount.at(-1), afterAmount.at(0)]
    .map((token) => (token ? detectCurrencyToken(token) : undefined))
    .filter((token): token is CurrencyCode => Boolean(token));
  const originalCurrency = parsedAmount.currency ?? adjacentCurrencies[0];

  const remainingTokens = [...beforeAmount, ...afterAmount];
  if (beforeAmount.length > 0 && detectCurrencyToken(beforeAmount.at(-1) ?? '')) {
    remainingTokens.splice(beforeAmount.length - 1, 1);
  } else if (afterAmount.length > 0 && detectCurrencyToken(afterAmount[0])) {
    remainingTokens.splice(beforeAmount.length, 1);
  }

  const remaining = remainingTokens.join(' ').trim();
  const signedType = parsedAmount.sign < 0 ? 'expense' : undefined;

  const explicitCategory = afterAmount.length > 0 ? detectCategory(afterAmount.join(' ')) : { cat: '其他' as Category, explicit: false, source: 'system' as const, ruleVersion: CATEGORY_RULE_VERSION };
  const inferredCategory = explicitCategory.explicit ? explicitCategory : detectCategory(remaining);

  let name = remaining;
  if (explicitCategory.explicit && afterAmount.length > 0) {
    name = beforeAmount.filter((token) => !detectCurrencyToken(token)).join(' ').trim();
  }
  name = cleanupName(name || remaining);

  const onlyTypeWord = TYPE_ONLY_TOKENS.has(name.toLowerCase());
  const type = detectType(name || remaining, inferredCategory.cat, signedType);

  if (!name || onlyTypeWord) {
    if (
      parsedAmount.sign < 0
      || detectCurrencyToken(beforeAmount.at(-1) ?? '')
      || detectCurrencyToken(afterAmount.at(0) ?? '')
      || TYPE_ONLY_TOKENS.has((remaining || '').toLowerCase())
    ) {
      name = buildDefaultName(type);
    }
  }

  if (!name) {
    return { ok: false, reason: 'missing-name', message: '我有看到金額，但缺少項目名稱，例如：午餐 120' };
  }

  const cat = type === 'income' && !inferredCategory.explicit ? '收入' : inferredCategory.cat;

  return {
    ok: true,
    value: {
      name,
      amount: parsedAmount.amount,
      cat,
      type,
      matchedCategoryExplicitly: explicitCategory.explicit || inferredCategory.explicit,
      originalCurrency,
      categorySource: 'system',
      categoryRuleVersion: inferredCategory.ruleVersion,
    },
  };
}

export function parseQuickEntry(input: string): QuickEntryParseResult | null {
  const result = parseQuickEntryDetailed(input);
  return result.ok ? result.value : null;
}
