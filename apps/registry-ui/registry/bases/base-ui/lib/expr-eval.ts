/**
 * Tiny recursive-descent evaluator for simple arithmetic so a field accepts
 * `100 + 8` / `(4 + 2) * 3` and commits the result. Supports `+ - * /`,
 * parentheses and decimals; returns null for anything else.
 */
export function evaluateExpression(expr: string): number | null {
  const trimmed = expr.trim();
  if (!trimmed) return null;
  // Only digits, decimal points, whitespace and the basic operators.
  if (!/^[\d\s.+\-*/()]+$/.test(trimmed)) return null;
  try {
    let pos = 0;
    const peek = () => trimmed[pos];
    const consume = (ch: string) => {
      if (trimmed[pos] !== ch) throw new Error('unexpected');
      pos++;
    };

    function skipWs() {
      while (pos < trimmed.length && trimmed[pos] === ' ') pos++;
    }

    function parseNumber(): number {
      skipWs();
      const start = pos;
      if (trimmed[pos] === '-' || trimmed[pos] === '+') pos++;
      while (
        pos < trimmed.length &&
        ((trimmed[pos] >= '0' && trimmed[pos] <= '9') || trimmed[pos] === '.')
      )
        pos++;
      if (pos === start) throw new Error('expected number');
      return Number(trimmed.slice(start, pos));
    }

    function parsePrimary(): number {
      skipWs();
      if (peek() === '(') {
        consume('(');
        const val = parseAddSub();
        skipWs();
        consume(')');
        return val;
      }
      return parseNumber();
    }

    function parseMulDiv(): number {
      let left = parsePrimary();
      skipWs();
      while (pos < trimmed.length && (peek() === '*' || peek() === '/')) {
        const op = peek();
        pos++;
        const right = parsePrimary();
        left = op === '*' ? left * right : left / right;
        skipWs();
      }
      return left;
    }

    function parseAddSub(): number {
      let left = parseMulDiv();
      skipWs();
      while (pos < trimmed.length && (peek() === '+' || peek() === '-')) {
        const op = peek();
        pos++;
        const right = parseMulDiv();
        left = op === '+' ? left + right : left - right;
        skipWs();
      }
      return left;
    }

    const result = parseAddSub();
    skipWs();
    if (pos !== trimmed.length) return null;
    if (typeof result !== 'number' || !isFinite(result)) return null;
    return result;
  } catch {
    return null;
  }
}
