import { describe, expect, it } from 'vitest';
import type { Transaction } from '../domain/types';
import { CATEGORY_RULE_VERSION, NOTE_PRESETS, detectCategoryByRules, getRuleStatusSummary, reapplyCategoryRulesToTransactions, shouldApplyRuleCategory } from '../rules/categoryRules';

describe('category rule versioning', () => {
  it('detects category with rule version metadata', () => {
    const match = detectCategoryByRules('今天星巴克 120');

    expect(match.cat).toBe('餐飲');
    expect(match.explicit).toBe(true);
    expect(match.source).toBe('system');
    expect(match.ruleVersion).toBe(CATEGORY_RULE_VERSION);
  });

  it('does not allow system rules to overwrite user-picked or legacy categories', () => {
    expect(shouldApplyRuleCategory({ cat: '交通', categorySource: 'user' })).toBe(false);
    expect(shouldApplyRuleCategory({ cat: '交通', categorySource: 'system' })).toBe(true);
    expect(shouldApplyRuleCategory({ cat: '交通' })).toBe(false);
    expect(shouldApplyRuleCategory(null)).toBe(true);
  });

  it('reapplies category rules only to system-classified transactions', () => {
    const txns: Transaction[] = [
      { id: 1, name: 'uber', cat: '餐飲', amount: -280, date: '2026-05-09', time: '10:00', categorySource: 'system', categoryRuleVersion: 'old' },
      { id: 2, name: '星巴克', cat: '交通', amount: -120, date: '2026-05-09', time: '11:00', categorySource: 'user' },
      { id: 3, name: '薪水', cat: '收入', amount: 42000, date: '2026-05-09', time: '12:00' },
    ];

    const result = reapplyCategoryRulesToTransactions(txns);

    expect(result.scanned).toBe(3);
    expect(result.eligible).toBe(1);
    expect(result.changed).toBe(1);
    expect(result.skippedManual).toBe(2);
    expect(result.changedNames).toEqual(['uber']);
    expect(result.transactions[0]).toMatchObject({ cat: '交通', categorySource: 'system', categoryRuleVersion: CATEGORY_RULE_VERSION });
    expect(result.transactions[1]).toMatchObject({ cat: '交通', categorySource: 'user' });
    expect(result.transactions[2].cat).toBe('收入');
    expect(result.transactions[2].categorySource).toBeUndefined();
  });

  it('keeps note presets versioned with rule summary', () => {
    const summary = getRuleStatusSummary();

    expect(NOTE_PRESETS.交通).toContain('捷運');
    expect(summary.categoryRuleVersion).toBe(CATEGORY_RULE_VERSION);
    expect(summary.protection).toContain('不覆蓋手動分類');
  });
});
