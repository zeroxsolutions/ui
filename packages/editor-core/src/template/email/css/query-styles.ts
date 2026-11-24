import { cascade, type Cascaded } from './inline-styles.js';
import type { StyledElement } from './selector.js';
import type { QueryRules, StyleDeclaration } from './stylesheet.js';

/** Properties named after a shorthand that the shorthand does not set. */
const NOT_LONGHANDS = new Set(['border-collapse', 'border-spacing']);

/** Each property's values, fallbacks included, as one comparable text. */
function valuesByProperty(style: readonly StyleDeclaration[]): Map<string, string> {
  const values = new Map<string, string[]>();
  for (const { property, value } of style) values.set(property, [...(values.get(property) ?? []), value]);
  return new Map([...values].map(([property, list]) => [property, list.join('\n')]));
}

/**
 * What a query writes for an element: each property whose value differs from the inline one, each property one
 * of the query's own rules wins, even at the inline value, since the base's head rules beat that, and after each
 * of these the longhands of it the cascade put later, so a more specific longhand still wins over the shorthand.
 */
function written(
  inline: readonly StyleDeclaration[],
  active: readonly Cascaded[],
  own: ReadonlySet<unknown>,
): Cascaded[] {
  const before = valuesByProperty(inline);
  const after = valuesByProperty(active.map(({ declaration }) => declaration));
  const kept = new Set(
    [...after].filter(([property, value]) => before.get(property) !== value).map(([property]) => property),
  );
  for (const { declaration, rule } of active) if (own.has(rule)) kept.add(declaration.property);
  const seen: string[] = [];
  return active.filter(({ declaration: { property } }) => {
    const longhand = !NOT_LONGHANDS.has(property) && seen.some((shorthand) => property.startsWith(`${shorthand}-`));
    if (kept.has(property)) seen.push(property);
    return kept.has(property) || longhand;
  });
}

/**
 * Writes a product's queries per element: each element whose style a query changes gets one class of its own
 * for that query, `zx-q<query>-<n>`, one per distinct style in it, and the head gets that style under the
 * query's chain, `!important` to beat the inline style. Its selector repeats the class `weight` times, more than
 * the classes of any base head rule, so the query's style beats them on its element. Queries are written in
 * source order, so when two hold at once, a property both set on one element is decided by their order, not by
 * the specificity of their rules; a nested query is computed with the rules of the queries around it.
 */
export function createQueryWriter(queries: readonly QueryRules[], weight: number) {
  const classes = queries.map(() => new Map<string, string>());
  const owners = queries.map((query) => new Set<unknown>(query.own));

  return {
    /** The query classes `element` takes, given the style it is inlined with. */
    classesFor(element: StyledElement, inline: readonly StyleDeclaration[]): string[] {
      return queries.flatMap((query, index) => {
        const changed = written(inline, cascade(query.rules, element), owners[index]);
        if (changed.length === 0) return [];
        const body = changed.map(({ declaration: { property, value } }) => `${property}:${value} !important`).join(';');
        let name = classes[index].get(body);
        if (name === undefined) {
          name = `zx-q${index}-${classes[index].size}`;
          classes[index].set(body, name);
        }
        return [name];
      });
    },
    /** The head's rules for the classes given so far, each query's under its chain, in source order. */
    head(): string {
      return queries
        .map((query, index) => {
          const given = [...classes[index]];
          if (given.length === 0) return '';
          const rules = given.map(([body, name]) => `${`.${name}`.repeat(weight)}{${body}}`).join('');
          return `${query.open}${rules}${query.close}`;
        })
        .join('')
        .replaceAll('</', '<\\/');
    },
  };
}

export type QueryWriter = ReturnType<typeof createQueryWriter>;
