import type { Category, Transaction } from '../domain/types';

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

const MERCHANT_CATEGORY_RULES: Array<{ cat: Category; keywords: string[] }> = [
  { cat: '餐飲', keywords: ['uber eats', 'foodpanda', '星巴克', 'starbucks', '路易莎', 'louisa', '麥當勞', 'mcdonald', '肯德基', 'kfc', '摩斯', 'mos burger', 'cama', '50嵐', '可不可', '八方雲集'] },
  { cat: '交通', keywords: ['uber', 'taxi', '計程車', '台鐵', '高鐵', '捷運', '公車', 'youbike'] },
  { cat: '購物', keywords: ['全聯', '家樂福', 'costco', '小北', '蝦皮', 'shopee', 'momo', 'pchome', '7-11', '7 eleven', 'seven eleven', '全家', 'familymart', '康是美', '屈臣氏'] },
  { cat: '娛樂', keywords: ['netflix', 'spotify', 'steam', 'disney+', 'playstation', 'xbox'] },
  { cat: '帳單', keywords: ['中華電信', '台灣大哥大', '遠傳', '國泰世華', '玉山銀行', '台新銀行', '水費', '電費'] },
  { cat: '健康', keywords: ['診所', '醫院', '牙醫', '藥局', '屈臣氏藥局'] },
  { cat: '收入', keywords: ['薪轉', '股利', '退款', '回饋', 'cashback'] },
];

const CATEGORY_KEYWORDS: Record<Category, string[]> = {
  餐飲: ['餐飲', '早餐', '午餐', '晚餐', '咖啡', '飲料', '宵夜', '外送', '星巴克', 'coffee', 'brunch', 'lunch', 'dinner', 'breakfast', 'tea', '麥當勞', '肯德基', '早餐店', '便當', '餐盒', '奶茶'],
  交通: ['交通', '捷運', '公車', 'uber', 'taxi', '計程車', '高鐵', '停車', '加油', '火車', '車票', '機票', '過路費', 'youbike', '打車'],
  購物: ['購物', '網購', '超市', '日用品', '服飾', '3c', '家電', 'costco', '全聯', '家樂福', '蝦皮', 'momo', 'pchome', '便利商店', '超商', '7-11', '全家'],
  娛樂: ['娛樂', '電影', '遊戲', 'netflix', 'spotify', '串流', '演唱會', 'ktv', 'steam', 'disney+', 'youtube premium', 'ps5', 'switch'],
  帳單: ['帳單', '房租', '租金', '電費', '水費', '瓦斯', '網路費', '手機費', '保險', '管理費', '卡費', 'credit card', '月費', '訂閱費'],
  健康: ['健康', '看診', '藥', '藥局', '健身房', '牙醫', '醫院', '診所', '維他命', '保健品'],
  教育: ['教育', '學費', '書', '課程', '補習', '證照', '講座', '英文課', '線上課程', '教材'],
  其他: ['其他', '雜支', '手續費', '捐款'],
  收入: ['收入', '薪水', '薪資', '獎金', '退款', '回饋', '利息', '股利', '報酬', 'income', 'bonus', 'salary', 'cashback', 'refund'],
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

function detectMerchantCategory(text: string): { cat: Category; explicit: boolean } | null {
  const lowered = text.toLowerCase();
  for (const rule of MERCHANT_CATEGORY_RULES) {
    if (rule.keywords.some((keyword) => lowered.includes(keyword.toLowerCase()))) {
      return { cat: rule.cat, explicit: true };
    }
  }
  return null;
}

function detectCategory(text: string): { cat: Category; explicit: boolean } {
  const merchantMatch = detectMerchantCategory(text);
  if (merchantMatch) return merchantMatch;

  const lowered = text.toLowerCase();
  for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS) as [Category, string[]][]) {
    if (keywords.some((keyword) => lowered.includes(keyword.toLowerCase()))) {
      return { cat, explicit: true };
    }
  }
  return { cat: '其他', explicit: false };
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

  const explicitCategory = afterAmount.length > 0 ? detectCategory(afterAmount.join(' ')) : { cat: '其他' as Category, explicit: false };
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
    },
  };
}

export function parseQuickEntry(input: string): QuickEntryParseResult | null {
  const result = parseQuickEntryDetailed(input);
  return result.ok ? result.value : null;
}
