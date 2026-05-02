const OP_PRECEDENCE: Record<string, number> = {
  '+': 1,
  '-': 1,
  '*': 2,
  '/': 2,
};

function isOperator(token: string): boolean {
  return token in OP_PRECEDENCE;
}

function tokenize(input: string): string[] | null {
  const normalized = input.replace(/×/g, '*').replace(/÷/g, '/').replace(/\s+/g, '');
  if (!normalized) return null;
  if (!/^[\d+\-*/.]+$/.test(normalized)) return null;

  const tokens: string[] = [];
  let i = 0;

  while (i < normalized.length) {
    const ch = normalized[i];
    if (isOperator(ch)) {
      const prev = tokens[tokens.length - 1];
      const isUnary = (ch === '+' || ch === '-') && (!prev || isOperator(prev));
      if (isUnary) {
        let j = i + 1;
        let num = ch;
        let dotCount = 0;
        while (j < normalized.length && /[\d.]/.test(normalized[j])) {
          if (normalized[j] === '.') dotCount += 1;
          num += normalized[j];
          j += 1;
        }

        if (num === '+' || num === '-' || dotCount > 1 || !/^[-+]?\d*\.?\d+$/.test(num)) return null;
        tokens.push(num);
        i = j;
        continue;
      }

      tokens.push(ch);
      i += 1;
      continue;
    }

    if (!/[\d.]/.test(ch)) return null;

    let j = i;
    let num = '';
    let dotCount = 0;
    while (j < normalized.length && /[\d.]/.test(normalized[j])) {
      if (normalized[j] === '.') dotCount += 1;
      num += normalized[j];
      j += 1;
    }

    if (dotCount > 1 || !/^\d*\.?\d+$/.test(num)) return null;
    tokens.push(num);
    i = j;
  }

  return tokens;
}

export function evaluateExpression(input: string): number | null {
  const tokens = tokenize(input);
  if (!tokens || tokens.length === 0) return null;

  const values: number[] = [];
  const ops: string[] = [];

  const apply = (): boolean => {
    const op = ops.pop();
    const b = values.pop();
    const a = values.pop();

    if (!op || a === undefined || b === undefined) return false;

    if (op === '+') values.push(a + b);
    else if (op === '-') values.push(a - b);
    else if (op === '*') values.push(a * b);
    else {
      if (b === 0) return false;
      values.push(a / b);
    }

    return true;
  };

  for (const token of tokens) {
    if (isOperator(token)) {
      while (ops.length > 0 && OP_PRECEDENCE[ops[ops.length - 1]] >= OP_PRECEDENCE[token]) {
        if (!apply()) return null;
      }
      ops.push(token);
    } else {
      const num = Number.parseFloat(token);
      if (!Number.isFinite(num)) return null;
      values.push(num);
    }
  }

  while (ops.length > 0) {
    if (!apply()) return null;
  }

  if (values.length !== 1 || !Number.isFinite(values[0])) return null;

  return values[0];
}
