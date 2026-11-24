import { computedStyle } from './inline-styles.js';
import type { StyledElement } from './selector.js';
import type { QueryRules, StyleDeclaration } from './stylesheet.js';

/** Each property's values, fallbacks included, as one comparable text. */
function valuesByProperty(style: readonly StyleDeclaration[]): Map<string, string> {
  const values = new Map<string, string[]>();
  for (const { property, value } of style) values.set(property, [...(values.get(property) ?? []), value]);
  return new Map([...values].map(([property, list]) => [property, list.join('\n')]));
}

/**
 * What an element's style is under `active` and not inline: each property whose value differs, and after it each
 * longhand of it the cascade put later, so a more specific longhand still wins over the shorthand.
 */
function differing(inline: readonly StyleDeclaration[], active: readonly StyleDeclaration[]): StyleDeclaration[] {
  const before = valuesByProperty(inline);
  const after = valuesByProperty(active);
  const changed = new Set([...after].filter(([property, value]) => before.get(property) !== value).map(([p]) => p));
  const seen: string[] = [];
  return active.filter(({ property }) => {
    const kept = changed.has(property) || seen.some((shorthand) => property.startsWith(`${shorthand}-`));
    if (changed.has(property)) seen.push(property);
    return kept;
  });
}

/**
 * Writes a product's queries per element: each element whose style a query changes gets a class of its own,
 * `zx-q<query>-<n>`, one per distinct style in that query, and the head gets the changed declarations under the
 * query's chain, made `!important` to beat the inline style. Queries stay in source order, so when two hold at
 * once, the later one wins a property both set, as in a browser.
 */
export function createQueryWriter(queries: readonly QueryRules[]) {
  const written = queries.map(() => new Map<string, string>());
  return {
    /** The query classes `element` takes, given the style it is inlined with. */
    classesFor(element: StyledElement, inline: readonly StyleDeclaration[]): string[] {
      return queries.flatMap((query, index) => {
        const changed = differing(inline, computedStyle(query.rules, element));
        if (changed.length === 0) return [];
        const body = changed.map(({ property, value }) => `${property}:${value} !important`).join(';');
        const classes = written[index];
        let name = classes.get(body);
        if (name === undefined) {
          name = `zx-q${index}-${classes.size}`;
          classes.set(body, name);
        }
        return [name];
      });
    },
    /** The head's rules for the classes given so far, each query's under its chain. */
    head(): string {
      return queries
        .map((query, index) => {
          const classes = [...written[index]];
          if (classes.length === 0) return '';
          return `${query.open}${classes.map(([body, name]) => `.${name}{${body}}`).join('')}${query.close}`;
        })
        .join('')
        .replaceAll('</', '<\\/');
    },
  };
}

export type QueryWriter = ReturnType<typeof createQueryWriter>;
