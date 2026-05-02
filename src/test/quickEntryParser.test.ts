import { describe, expect, it } from 'vitest';
import { parseQuickEntry, parseQuickEntryDetailed } from '../utils/quickEntryParser';

describe('quickEntryParser', () => {
  it('可解析最基本的支出輸入', () => {
    expect(parseQuickEntry('午餐 120')).toMatchObject({
      name: '午餐',
      amount: 120,
      cat: '餐飲',
      type: 'expense',
    });
  });

  it('可解析更自由的自然語句', () => {
    expect(parseQuickEntry('今天午餐 120')).toMatchObject({
      name: '午餐',
      amount: 120,
      cat: '餐飲',
      type: 'expense',
    });

    expect(parseQuickEntry('買咖啡 90')).toMatchObject({
      name: '咖啡',
      amount: 90,
      cat: '餐飲',
      type: 'expense',
    });

    expect(parseQuickEntry('收到退款 300')).toMatchObject({
      name: '退款',
      amount: 300,
      cat: '收入',
      type: 'income',
    });
  });

  it('可解析帶分類的輸入', () => {
    expect(parseQuickEntry('uber 280 交通')).toMatchObject({
      name: 'uber',
      amount: 280,
      cat: '交通',
      type: 'expense',
      matchedCategoryExplicitly: true,
    });
  });

  it('可解析收入與負數 shorthand', () => {
    expect(parseQuickEntry('收入 300')).toMatchObject({
      name: '快速收入',
      amount: 300,
      cat: '收入',
      type: 'income',
    });

    expect(parseQuickEntry('-50')).toMatchObject({
      name: '快速支出',
      amount: 50,
      cat: '其他',
      type: 'expense',
    });
  });

  it('可解析更多幣別語法', () => {
    expect(parseQuickEntry('USD 20 lunch')).toMatchObject({
      name: 'lunch',
      amount: 20,
      cat: '餐飲',
      type: 'expense',
      originalCurrency: 'USD',
    });

    expect(parseQuickEntry('€12 coffee')).toMatchObject({
      name: 'coffee',
      amount: 12,
      cat: '餐飲',
      type: 'expense',
      originalCurrency: 'EUR',
    });

    expect(parseQuickEntry('HK$88 早餐')).toMatchObject({
      name: '早餐',
      amount: 88,
      cat: '餐飲',
      type: 'expense',
      originalCurrency: 'HKD',
    });

    expect(parseQuickEntry('RMB 100 打車')).toMatchObject({
      name: '打車',
      amount: 100,
      cat: '交通',
      type: 'expense',
      originalCurrency: 'CNY',
    });

    expect(parseQuickEntry('£15 netflix')).toMatchObject({
      name: 'netflix',
      amount: 15,
      cat: '娛樂',
      type: 'expense',
      originalCurrency: 'GBP',
    });
  });

  it('可解析收入類輸入', () => {
    expect(parseQuickEntry('薪水 42000')).toMatchObject({
      name: '薪水',
      amount: 42000,
      cat: '收入',
      type: 'income',
    });
  });

  it('商家分類會優先推測更合理類別', () => {
    expect(parseQuickEntry('uber eats 320')).toMatchObject({
      name: 'uber eats',
      cat: '餐飲',
    });

    expect(parseQuickEntry('全聯 500')).toMatchObject({
      name: '全聯',
      cat: '購物',
    });

    expect(parseQuickEntry('路易莎 65')).toMatchObject({
      name: '路易莎',
      cat: '餐飲',
    });
  });

  it('英文關鍵字也能推測分類', () => {
    expect(parseQuickEntry('coffee 90')).toMatchObject({
      name: 'coffee',
      amount: 90,
      cat: '餐飲',
      type: 'expense',
    });
  });

  it('退款會推測為收入', () => {
    expect(parseQuickEntry('退款 120')).toMatchObject({
      name: '退款',
      amount: 120,
      cat: '收入',
      type: 'income',
    });
  });

  it('缺少金額時會給明確提示', () => {
    expect(parseQuickEntryDetailed('只有文字')).toMatchObject({
      ok: false,
      reason: 'missing-amount',
    });
  });

  it('只有金額時會提示缺少名稱', () => {
    expect(parseQuickEntryDetailed('120')).toMatchObject({
      ok: false,
      reason: 'missing-name',
    });
  });
});
