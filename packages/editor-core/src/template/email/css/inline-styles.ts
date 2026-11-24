import { selectorMatches, type StyledElement } from './selector.js';
import type { InlineRule, StyleDeclaration } from './stylesheet.js';

interface Candidate {
  readonly declaration: StyleDeclaration;
  readonly specificity: number;
  readonly order: number;
  readonly index: number;
}

/**
 * The declarations the rules that select `element` give it, in cascade order (importance, then specificity, then
 * source order), a property kept once at its winning place. A longhand after a shorthand stays beside it, and a
 * property written twice in one rule keeps both, the first a fallback for a client that drops the second.
 */
export function computedStyle(rules: readonly InlineRule[], element: StyledElement): StyleDeclaration[] {
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
  const winners = new Map<string, Candidate[]>();
  for (const candidate of candidates) {
    const held = winners.get(candidate.declaration.property);
    const sameRule = held?.at(-1)?.order === candidate.order && held.at(-1)?.specificity === candidate.specificity;
    winners.delete(candidate.declaration.property);
    winners.set(candidate.declaration.property, sameRule && held !== undefined ? [...held, candidate] : [candidate]);
  }
  return [...winners.values()].flat().map(({ declaration }) => declaration);
}

/** The `style` attribute's text for `element`; empty when no rule selects it. */
export function inlineStyle(rules: readonly InlineRule[], element: StyledElement): string {
  // `!important` decides the cascade and is not written: inline, it would beat the head's own rules.
  return computedStyle(rules, element)
    .map(({ property, value }) => `${property}:${value};`)
    .join('');
}
