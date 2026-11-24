import { escapeHtml } from '../../variables/interpolate.js';
import { computedStyle } from '../css/inline-styles.js';
import type { QueryWriter } from '../css/query-styles.js';
import type { StyledElement } from '../css/selector.js';
import type { InlineRule } from '../css/stylesheet.js';
import type { ElementChild } from './elements.js';

const VOID = new Set(['img', 'br', 'hr', 'meta']);

/**
 * `children` as HTML, each element's `style` written from `rules` as they select it under `parent`, and the query
 * classes `queries` gives it. Every attribute value and every text is escaped; raw markup is written as it is.
 */
export function serialiseElements(
  children: readonly ElementChild[],
  rules: readonly InlineRule[],
  parent: StyledElement | null = null,
  queries?: QueryWriter,
): string {
  return children
    .map((child) => {
      if ('text' in child) return escapeHtml(child.text);
      if ('raw' in child) return child.raw;
      const styled: StyledElement = { classes: child.classes, parent };
      const inline = computedStyle(rules, styled);
      const style = (child.ownStyle ?? '') + inline.map(({ property, value }) => `${property}:${value};`).join('');
      const classes = [...child.classes, ...(queries?.classesFor(styled, inline) ?? [])];
      const attributes = [
        ...child.attributes,
        ...(classes.length === 0 ? [] : [['class', classes.join(' ')] as const]),
        ...(style === '' ? [] : [['style', style] as const]),
      ]
        .map(([name, value]) => ` ${name}="${escapeHtml(value)}"`)
        .join('');
      if (VOID.has(child.tag)) return `<${child.tag}${attributes} />`;
      return `<${child.tag}${attributes}>${serialiseElements(child.children, rules, styled, queries)}</${child.tag}>`;
    })
    .join('');
}
