/** How one compound of a class selector relates to the one before it. */
export type Combinator = 'descendant' | 'child';

/**
 * A selector of classes only, the one form a renderer inlines: `.a`, `.a.b`, `.a .b`, `.a > .b`. The compounds
 * run outermost first; `combinators[i]` joins `compounds[i]` to `compounds[i + 1]`.
 */
export interface ClassSelector {
  readonly compounds: readonly (readonly string[])[];
  readonly combinators: readonly Combinator[];
  /** The number of classes it names, which is all that orders two class selectors. */
  readonly specificity: number;
}

/** What a selector names that a renderer does not inline. */
export type SelectorRefusal = 'element' | 'id' | 'attribute' | 'pseudo' | 'universal' | 'combinator';

/** One element as a selector sees it: its classes, and its parent. */
export interface StyledElement {
  readonly classes: readonly string[];
  readonly parent: StyledElement | null;
}

const CLASS_NAME = /^-?[_a-zA-Z][_a-zA-Z0-9-]*/;

/** The kind of selector part `char` starts, which no class selector holds. */
function refusalAt(char: string): SelectorRefusal {
  if (char === '#') return 'id';
  if (char === '[') return 'attribute';
  if (char === ':') return 'pseudo';
  if (char === '*') return 'universal';
  if (char === '+' || char === '~' || char === '|') return 'combinator';
  return 'element';
}

/** `text`, one selector of a list, read as classes and the combinators between them; or what it names besides. */
export function parseClassSelector(text: string): ClassSelector | { readonly refused: SelectorRefusal } {
  const compounds: string[][] = [];
  const combinators: Combinator[] = [];
  let index = 0;
  let pending: Combinator | null = null;
  const source = text.trim();
  while (index < source.length) {
    const char = source[index];
    if (/\s/.test(char)) {
      index += 1;
      if (compounds.length > 0 && pending === null) pending = 'descendant';
      continue;
    }
    if (char === '>') {
      if (compounds.length === 0) return { refused: 'combinator' };
      pending = 'child';
      index += 1;
      continue;
    }
    if (char !== '.') return { refused: refusalAt(char) };
    const compound: string[] = [];
    while (source[index] === '.') {
      const name = CLASS_NAME.exec(source.slice(index + 1));
      if (name === null) return { refused: 'element' };
      compound.push(name[0]);
      index += 1 + name[0].length;
    }
    const next = source[index];
    if (next !== undefined && !/\s/.test(next) && next !== '>') return { refused: refusalAt(next) };
    if (compounds.length > 0) combinators.push(pending ?? 'descendant');
    pending = null;
    compounds.push(compound);
  }
  if (compounds.length === 0 || pending === 'child') return { refused: 'combinator' };
  return { compounds, combinators, specificity: compounds.reduce((sum, compound) => sum + compound.length, 0) };
}

function holds(element: StyledElement, compound: readonly string[]): boolean {
  return compound.every((name) => element.classes.includes(name));
}

/** Whether `selector` selects `element`, read right to left as a browser reads it. */
export function selectorMatches(selector: ClassSelector, element: StyledElement): boolean {
  const last = selector.compounds.length - 1;
  if (!holds(element, selector.compounds[last])) return false;
  return ancestorsMatch(selector, last - 1, element.parent);
}

function ancestorsMatch(selector: ClassSelector, at: number, from: StyledElement | null): boolean {
  if (at < 0) return true;
  const combinator = selector.combinators[at];
  for (let element = from; element !== null; element = element.parent) {
    if (holds(element, selector.compounds[at]) && ancestorsMatch(selector, at - 1, element.parent)) return true;
    if (combinator === 'child') return false;
  }
  return false;
}
