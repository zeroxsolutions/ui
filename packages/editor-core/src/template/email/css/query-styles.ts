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

/** One declaration a query class is written with, at the place the cascade gave it. */
interface Piece {
  readonly query: number;
  readonly name: string;
  /** Its selector's specificity, raised over every query rule's for an `!important` one. */
  readonly weight: number;
  readonly order: number;
  readonly index: number;
  readonly text: string;
}

/**
 * Writes a product's queries per element: each element whose style a query changes gets a class of its own,
 * `zx-q<query>-<n>`, one per distinct style in that query, and the head gets those declarations under the
 * query's chain, made `!important` to beat the inline style. Two queries that hold at once cascade as their
 * rules would: each declaration's selector repeats the class once per class of the rule it came from, so a more
 * specific rule still wins, and the head writes the declarations in their rules' order, so at equal specificity
 * the later rule wins, a nested query's included.
 */
export function createQueryWriter(queries: readonly QueryRules[]) {
  const classes = queries.map(() => new Map<string, string>());
  const owners = queries.map((query) => new Set<unknown>(query.own));
  // An important declaration outweighs any query rule's specificity, as importance comes first in a cascade.
  const heaviest = Math.max(0, ...queries.flatMap((query) => query.rules.map((rule) => rule.selector.specificity)));
  const pieces: Piece[] = [];

  return {
    /** The query classes `element` takes, given the style it is inlined with. */
    classesFor(element: StyledElement, inline: readonly StyleDeclaration[]): string[] {
      return queries.flatMap((query, index) => {
        const changed = written(inline, cascade(query.rules, element), owners[index]).map((cascaded) => ({
          weight: cascaded.specificity + (cascaded.declaration.important ? heaviest : 0),
          order: cascaded.order,
          index: cascaded.index,
          text: `${cascaded.declaration.property}:${cascaded.declaration.value} !important`,
        }));
        if (changed.length === 0) return [];
        const signature = changed
          .map((piece) => `${piece.weight}/${piece.order}/${piece.index}/${piece.text}`)
          .join('\n');
        let name = classes[index].get(signature);
        if (name === undefined) {
          name = `zx-q${index}-${classes[index].size}`;
          classes[index].set(signature, name);
          for (const piece of changed) pieces.push({ ...piece, query: index, name });
        }
        return [name];
      });
    },
    /** The head's rules for the classes given so far, in cascade order, each query's under its chain. */
    head(): string {
      const sorted = [...pieces].sort(
        (left, right) =>
          left.weight - right.weight ||
          left.order - right.order ||
          left.index - right.index ||
          left.query - right.query,
      );
      let out = '';
      let previous: Piece | null = null;
      for (const piece of sorted) {
        const sameQuery = previous?.query === piece.query;
        const sameRule = sameQuery && previous?.name === piece.name && previous.weight === piece.weight;
        if (sameRule) out += `;${piece.text}`;
        else {
          if (previous !== null) out += sameQuery ? '}' : `}${queries[previous.query].close}`;
          if (!sameQuery) out += queries[piece.query].open;
          out += `${`.${piece.name}`.repeat(Math.max(1, piece.weight))}{${piece.text}`;
        }
        previous = piece;
      }
      if (previous !== null) out += `}${queries[previous.query].close}`;
      return out.replaceAll('</', '<\\/');
    },
  };
}

export type QueryWriter = ReturnType<typeof createQueryWriter>;
