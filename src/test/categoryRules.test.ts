import { describe, expect, it } from 'vitest';
import { CATEGORY_RULE_VERSION, NOTE_PRESETS, detectCategoryByRules, getRuleStatusSummary, shouldApplyRuleCategory } from '../rules/categoryRules';

describe('category rule versioning', () => {
  it('detects category with rule version metadata', () => {
    const match = detectCategoryByRules('今天星巴克 120');

    expect(match.cat).toBe('餐飲');
    expect(match.explicit).toBe(true);
    expect(match.source).toBe('system');
    expect(match.ruleVersion).toBe(CATEGORY_RULE_VERSION);
  });

  it('does not allow system rules to overwrite user-picked categories', () => {
    expect(shouldApplyRuleCategory({ cat: '交通', categorySource: 'user' })).toBe(false);
    expect(shouldApplyRuleCategory({ cat: '交通', categorySource: 'system' })).toBe(true);
    expect(shouldApplyRuleCategory(null)).toBe(true);
  });

  it('keeps note presets versioned with rule summary', () => {
    const summary = getRuleStatusSummary();

    expect(NOTE_PRESETS.交通).toContain('捷運');
    expect(summary.categoryRuleVersion).toBe(CATEGORY_RULE_VERSION);
    expect(summary.protection).toContain('不覆蓋手動分類');
  });
});
