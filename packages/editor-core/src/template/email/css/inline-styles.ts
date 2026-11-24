import { selectorMatches, type StyledElement } from './selector.js';
import type { InlineRule, StyleDeclaration } from './stylesheet.js';

interface Candidate {
  readonly declaration: StyleDeclaration;
  readonly specificity: number;
  readonly order: number;
  readonly index: number;
}

/**
 * The `style` attribute's text for `element`: each declaration of the rules that select it, in cascade order
 * (importance, then specificity, then source order), a property kept once at its winning place. A longhand
 * after a shorthand stays beside it, so the inline style reads as the cascade did. Empty when no rule selects it.
 */
export function inlineStyle(rules: readonly InlineRule[], element: StyledElement): string {
  const candidates: Candidate[] = [];
  for (const rule of rules) {
    if (!selectorMatches(rule.selector, element)) continue;
    rule.declarations.forEach((declaration, index) =>
      candidates.push({ declaration, specificity: rule.selector.specificity, order: rule.order, index }),
    );
  }
  candidates.sort(
    (left, right) =>
      Number(left.declaration.important) - Number(right.declaration.important) ||
      left.specificity - right.specificity ||
      left.order - right.order ||
      left.index - right.index,
  );
  const winners = new Map<string, StyleDeclaration>();
  for (const { declaration } of candidates) {
    winners.delete(declaration.property);
    winners.set(declaration.property, declaration);
  }
  return [...winners.values()]
    .map(({ property, value, important }) => `${property}:${value}${important ? ' !important' : ''};`)
    .join('');
}
