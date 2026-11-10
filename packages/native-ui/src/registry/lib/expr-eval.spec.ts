import { evaluateExpression as evaluateOnTheWeb } from '@zeroxsolutions/ui/registry/bases/base-ui/lib/expr-eval';
import { evaluateExpression } from './expr-eval';

describe('evaluateExpression', () => {
  it('evaluates sums, products, parentheses and decimals', () => {
    expect(evaluateExpression('100 + 8')).toBe(108);
    expect(evaluateExpression('(4 + 2) * 3')).toBe(18);
    expect(evaluateExpression('1.5 * 2 - 0.5')).toBe(2.5);
    expect(evaluateExpression('-4 / 2')).toBe(-2);
  });

  it('gives null for an empty text, a letter, an unclosed parenthesis and a division by zero', () => {
    expect(evaluateExpression('  ')).toBeNull();
    expect(evaluateExpression('2px')).toBeNull();
    expect(evaluateExpression('(1 + 2')).toBeNull();
    expect(evaluateExpression('1 / 0')).toBeNull();
  });

  it('answers what the web evaluator answers', () => {
    const texts = [
      '',
      '7',
      ' 12.5 ',
      '100 + 8',
      '(4+2)*3',
      '2 * (3 + 4) / 7',
      '-3 - -2',
      '+5',
      '1..2',
      '1 +',
      ')(',
      '3 4',
      '1/0',
      '0/0',
      'Infinity',
      '2e3',
    ];
    expect(texts.map(evaluateExpression)).toEqual(texts.map(evaluateOnTheWeb));
  });
});
