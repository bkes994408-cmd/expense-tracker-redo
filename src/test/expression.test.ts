import { describe, expect, it } from 'vitest';
import { evaluateExpression } from '../utils/expression';

describe('evaluateExpression', () => {
  it('可計算基本四則運算與優先順序', () => {
    expect(evaluateExpression('12+3×4')).toBe(24);
    expect(evaluateExpression('10-2*3')).toBe(4);
    expect(evaluateExpression('20÷5+1')).toBe(5);
  });

  it('支援小數與 unary 負號', () => {
    expect(evaluateExpression('1.5+2.25')).toBe(3.75);
    expect(evaluateExpression('-3+5')).toBe(2);
  });

  it('對非法輸入與除以零回傳 null', () => {
    expect(evaluateExpression('2+abc')).toBeNull();
    expect(evaluateExpression('2..3+1')).toBeNull();
    expect(evaluateExpression('2/0')).toBeNull();
    expect(evaluateExpression('')).toBeNull();
  });
});
