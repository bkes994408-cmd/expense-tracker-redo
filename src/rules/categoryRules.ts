import type { Category } from '../domain/types';

export const CATEGORY_RULE_VERSION = '2026.05.08-u5';
export const NOTE_SUGGESTION_RULE_VERSION = '2026.05.08-u5';

export type RuleSource = 'system' | 'user';

export type CategoryRuleMatch = {
  cat: Category;
  explicit: boolean;
  source: RuleSource;
  ruleVersion: string;
};

export const MERCHANT_CATEGORY_RULES: Array<{ cat: Category; keywords: string[] }> = [
  { cat: '餐飲', keywords: ['uber eats', 'foodpanda', '星巴克', 'starbucks', '路易莎', 'louisa', '麥當勞', 'mcdonald', '肯德基', 'kfc', '摩斯', 'mos burger', 'cama', '50嵐', '可不可', '八方雲集'] },
  { cat: '交通', keywords: ['uber', 'taxi', '計程車', '台鐵', '高鐵', '捷運', '公車', 'youbike'] },
  { cat: '購物', keywords: ['全聯', '家樂福', 'costco', '小北', '蝦皮', 'shopee', 'momo', 'pchome', '7-11', '7 eleven', 'seven eleven', '全家', 'familymart', '康是美', '屈臣氏'] },
  { cat: '娛樂', keywords: ['netflix', 'spotify', 'steam', 'disney+', 'playstation', 'xbox'] },
  { cat: '帳單', keywords: ['中華電信', '台灣大哥大', '遠傳', '國泰世華', '玉山銀行', '台新銀行', '水費', '電費'] },
  { cat: '健康', keywords: ['診所', '醫院', '牙醫', '藥局', '屈臣氏藥局'] },
  { cat: '收入', keywords: ['薪轉', '股利', '退款', '回饋', 'cashback'] },
];

export const CATEGORY_KEYWORDS: Record<Category, string[]> = {
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

export const NOTE_PRESETS: Record<Category, string[]> = {
  餐飲: ['早餐', '午餐', '晚餐', '咖啡', '飲料', '宵夜', '外送', '聚餐'],
  交通: ['捷運', '公車', '計程車', '停車費', '高鐵', '加油', '過路費', '共享單車'],
  購物: ['日用品', '服飾', '3C', '家電', '超市', '網購', '禮物', '生活雜貨'],
  娛樂: ['電影', '遊戲', '串流訂閱', 'KTV', '展覽', '旅遊娛樂', '演唱會', '聚會活動'],
  帳單: ['電費', '水費', '瓦斯費', '網路費', '手機費', '房租', '管理費', '保險費'],
  健康: ['看診', '藥品', '保健品', '健身房', '牙科', '物理治療', '健康檢查', '醫療耗材'],
  教育: ['學費', '線上課程', '書籍', '補習', '證照報名', '教材', '語言學習', '研討會'],
  其他: ['人情支出', '手續費', '捐款', '罰單', '寵物支出', '家庭支出', '緊急支出', '其他雜支'],
  收入: ['薪資', '獎金', '兼職', '退款', '投資收益', '利息', '獎學金', '其他收入'],
};

export function detectMerchantCategoryByRules(text: string): CategoryRuleMatch | null {
  const lowered = text.toLowerCase();
  for (const rule of MERCHANT_CATEGORY_RULES) {
    if (rule.keywords.some((keyword) => lowered.includes(keyword.toLowerCase()))) {
      return { cat: rule.cat, explicit: true, source: 'system', ruleVersion: CATEGORY_RULE_VERSION };
    }
  }
  return null;
}

export function detectCategoryByRules(text: string): CategoryRuleMatch {
  const merchantMatch = detectMerchantCategoryByRules(text);
  if (merchantMatch) return merchantMatch;

  const lowered = text.toLowerCase();
  for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS) as [Category, string[]][]) {
    if (keywords.some((keyword) => lowered.includes(keyword.toLowerCase()))) {
      return { cat, explicit: true, source: 'system', ruleVersion: CATEGORY_RULE_VERSION };
    }
  }
  return { cat: '其他', explicit: false, source: 'system', ruleVersion: CATEGORY_RULE_VERSION };
}

export function shouldApplyRuleCategory(existing: { cat?: Category; categorySource?: RuleSource } | null | undefined): boolean {
  if (!existing?.cat) return true;
  return existing.categorySource !== 'user';
}

export function getRuleStatusSummary() {
  return {
    categoryRuleVersion: CATEGORY_RULE_VERSION,
    noteSuggestionRuleVersion: NOTE_SUGGESTION_RULE_VERSION,
    protection: '規則更新只影響新交易或使用者主動重新套用；不覆蓋手動分類。',
  };
}
