import { escapeHtml } from '../../variables/interpolate.js';
import { inlineStyle } from '../css/inline-styles.js';
import type { StyledElement } from '../css/selector.js';
import type { InlineRule } from '../css/stylesheet.js';
import type { ElementChild } from './elements.js';

const VOID = new Set(['img', 'br', 'hr', 'meta']);

/**
 * `children` as HTML, each element's `style` written from `rules` as they select it under `parent`. Every
 * attribute value and every text is escaped; raw markup is written as it is.
 */
export function serialiseElements(
  children: readonly ElementChild[],
  rules: readonly InlineRule[],
  parent: StyledElement | null = null,
): string {
  return children
    .map((child) => {
      if ('text' in child) return escapeHtml(child.text);
      if ('raw' in child) return child.raw;
      const styled: StyledElement = { classes: child.classes, parent };
      const style = (child.ownStyle ?? '') + inlineStyle(rules, styled);
      const attributes = [
        ...child.attributes,
        ...(child.classes.length === 0 ? [] : [['class', child.classes.join(' ')] as const]),
        ...(style === '' ? [] : [['style', style] as const]),
      ]
        .map(([name, value]) => ` ${name}="${escapeHtml(value)}"`)
        .join('');
      if (VOID.has(child.tag)) return `<${child.tag}${attributes} />`;
      return `<${child.tag}${attributes}>${serialiseElements(child.children, rules, styled)}</${child.tag}>`;
    })
    .join('');
}
