import { CssSyntaxError, parse, type AtRule, type ChildNode, type Declaration, type Root, type Rule } from 'postcss';
import { parseClassSelector, type ClassSelector } from './selector.js';
import { unsupportedBy, type StylesheetWarning } from './unsupported.js';

/** One declaration as a rule holds it, every `var()` already resolved. */
export interface StyleDeclaration {
  readonly property: string;
  readonly value: string;
  readonly important: boolean;
}

/** A rule the renderer writes into the `style` of each element it selects. */
export interface InlineRule {
  readonly selector: ClassSelector;
  readonly declarations: readonly StyleDeclaration[];
  /** Its place among every inlined rule of every sheet, the base sheet's first: a later rule wins a tie. */
  readonly order: number;
}

/** Why a stylesheet was refused when the renderer was composed. */
export type StylesheetRefusal = 'unparsable' | 'selector-refused' | 'import-refused' | 'variable-undefined';

/**
 * A product stylesheet the renderer refused when it was composed, at the position of what it refused.
 * `sheet` is the index in `css`; `detail` names the selector, the variable or the parser's message.
 */
export class EmailStylesheetInvalid extends Error {
  constructor(
    readonly sheet: number,
    readonly line: number,
    readonly column: number,
    readonly reason: StylesheetRefusal,
    readonly detail: string,
  ) {
    super(`Email stylesheet ${sheet} at ${line}:${column}: ${reason} (${detail})`);
    this.name = 'EmailStylesheetInvalid';
  }
}

/**
 * One `@media` or `@supports` of a product's sheets, nested ones flattened into the chain around them: the rules
 * an element's style is computed from while the chain holds.
 */
export interface QueryRules {
  /** The chain's at-rules, outer first, as the head opens them: `@supports (x){@media (y){`. */
  readonly open: string;
  readonly close: string;
  /**
   * Every top-level rule, then the class-only rules of each query of the chain, outer first, each at its place in
   * the sheets' order and its variables read with the chain's own over the sheets'.
   */
  readonly rules: readonly InlineRule[];
  /** Of `rules`, the chain's queries': what they declare is written for an element even at the inline value. */
  readonly own: readonly InlineRule[];
}

/** The sheets one renderer composes: what it inlines, and the rules it keeps in the head's style. */
export interface ComposedStylesheet {
  readonly rules: readonly InlineRule[];
  /**
   * The base sheet's at-rules, a product's `@font-face` and other at-rules, and a product query's rules whose
   * selector is not class-only, made `!important`, in order, as the head's `<style>` holds them.
   */
  readonly head: string;
  /** A product's queries, in source order; the renderer writes each element's style under them as it differs. */
  readonly queries: readonly QueryRules[];
  /**
   * How many times a query class is written in its selector: once more than the classes of the base sheet's
   * widest rule, so a product query's style beats every base head rule on its element.
   */
  readonly queryWeight: number;
  /** Whether a head rule answers `prefers-color-scheme: dark`, so the email declares both schemes. */
  readonly darkScheme: boolean;
  /** Each declaration of a product's sheets that common mail clients drop, in order. */
  readonly warnings: readonly StylesheetWarning[];
}

/** The selectors whose custom properties every `var()` reads. */
const ROOTS = new Set([':root', '.zx-root']);

const DARK_QUERY = /prefers-color-scheme\s*:\s*dark/i;

interface Source {
  readonly root: Root;
  /** The index in the product's `css`; null for the base sheet. */
  readonly sheet: number | null;
}

function positionOf(node: ChildNode | Root): { line: number; column: number } {
  return { line: node.source?.start?.line ?? 1, column: node.source?.start?.column ?? 1 };
}

function refuse(source: Source, node: ChildNode, reason: StylesheetRefusal, detail: string): never {
  const { line, column } = positionOf(node);
  throw new EmailStylesheetInvalid(source.sheet ?? -1, line, column, reason, detail);
}

/** The text of `value` with each `var(--name, fallback)` replaced; `missing` is called for one with no value. */
/** Thrown inside a custom property's own value for a `var()` with nothing to stand for it; the property is then invalid. */
const UNRESOLVED = Symbol('unresolved');

function substitute(
  value: string,
  lookup: (name: string) => string | undefined,
  missing: (name: string) => never,
): string {
  let out = '';
  let index = 0;
  for (;;) {
    const start = value.toLowerCase().indexOf('var(', index);
    if (start < 0) return out + value.slice(index);
    out += value.slice(index, start);
    let depth = 1;
    let end = start + 4;
    for (; end < value.length && depth > 0; end += 1) {
      if (value[end] === '(') depth += 1;
      if (value[end] === ')') depth -= 1;
    }
    const inner = value.slice(start + 4, end - 1);
    const comma = inner.indexOf(',');
    const name = (comma < 0 ? inner : inner.slice(0, comma)).trim();
    const found = lookup(name);
    if (found !== undefined) out += found;
    else if (comma >= 0) out += substitute(inner.slice(comma + 1).trim(), lookup, missing);
    else missing(name);
    index = end;
  }
}

/**
 * Every custom property a top-level `:root` or `.zx-root` rule declares, a later sheet's over an earlier one's.
 * One declared inside `@media` holds only where the query does, so it is read only for that query's rules.
 */
function customProperties(sources: readonly Source[]): CustomProperties {
  const found: CustomProperties = new Map();
  for (const source of sources) {
    for (const rule of source.root.nodes) {
      if (rule.type !== 'rule' || !rule.selectors.some((selector) => ROOTS.has(selector.trim()))) continue;
      rule.each((declaration) => {
        if (declaration.type === 'decl' && declaration.prop.startsWith('--')) {
          found.set(declaration.prop, { value: declaration.value.trim(), source, node: declaration });
        }
      });
    }
  }
  return found;
}

type CustomProperties = Map<string, { value: string; source: Source; node: ChildNode }>;

/** Resolves `var()` against one set of custom properties: the sheets' top-level ones, or a query's over them. */
function createScope(custom: CustomProperties) {
  const resolving = new Set<string>();
  const cyclic = new Set<string>();
  // Undefined for a property a browser reads as invalid, so the `var()` that asked for it takes its fallback.
  const resolved = new Map<string, string | undefined>();
  const lookup = (name: string): string | undefined => {
    if (resolved.has(name)) return resolved.get(name);
    const declared = custom.get(name);
    if (declared === undefined) return undefined;
    if (resolving.has(name)) {
      // A browser reads every property in a cycle as invalid, whatever fallbacks the cycle's own values hold.
      const stack = [...resolving];
      for (const member of stack.slice(stack.indexOf(name))) cyclic.add(member);
      return undefined;
    }
    resolving.add(name);
    let value: string | undefined;
    try {
      value = substitute(declared.value, lookup, () => {
        throw UNRESOLVED;
      });
    } catch (error) {
      if (error !== UNRESOLVED) throw error;
    }
    resolving.delete(name);
    if (cyclic.has(name)) value = undefined;
    resolved.set(name, value);
    return value;
  };
  return {
    resolveIn: (source: Source, node: ChildNode, value: string): string =>
      substitute(value, lookup, (name) => refuse(source, node, 'variable-undefined', name)),
  };
}

/** The nearest `@media` or `@supports` around `node`, or null at the top of its sheet. */
function enclosingQuery(node: ChildNode): AtRule | null {
  // The root has no parent, so the walk ends there.
  let parent = node.parent as ChildNode | undefined;
  while (parent !== undefined) {
    if (parent.type === 'atrule' && ['media', 'supports'].includes(parent.name.toLowerCase())) return parent;
    parent = parent.parent as ChildNode | undefined;
  }
  return null;
}

/** The custom properties a query's own `:root` or `.zx-root` rules declare, by name. */
function queryProperties(source: Source, rule: AtRule): CustomProperties {
  const found: CustomProperties = new Map();
  rule.each((child) => {
    if (child.type !== 'rule' || !child.selectors.some((selector) => ROOTS.has(selector.trim()))) return;
    child.each((declaration) => {
      if (declaration.type === 'decl' && declaration.prop.startsWith('--')) {
        found.set(declaration.prop, { value: declaration.value.trim(), source, node: declaration });
      }
    });
  });
  return found;
}

/** A top-level rule as written, kept to read its variables again under each query. */
interface WrittenRule {
  readonly source: Source;
  readonly rule: Rule;
  readonly selectors: readonly { readonly selector: ClassSelector; readonly order: number }[];
}

/** A product query as it is read, before the top-level rules it is computed with are all known. */
interface QueryEntry {
  readonly chain: readonly AtRule[];
  readonly scope: Scope;
  /** The class-only rules of each query of the chain, outer first; an outer one is filled as it is read. */
  readonly levels: readonly (readonly WrittenRule[])[];
}

type Scope = ReturnType<typeof createScope>;

const CONDITIONAL = new Set(['media', 'supports']);

/**
 * The base sheet and a product's sheets, in that order, read into the rules a renderer inlines, the text it keeps
 * in the head, and a product's queries. A query's class-only rules are not written as they are: the renderer
 * computes each element's style under the query, as a browser would cascade it, and writes what differs from the
 * inlined style under a class of the element's own.
 *
 * @throws {EmailStylesheetInvalid} for a sheet that does not parse, a top-level selector that is not class-only,
 * an `@import`, or a `var()` with no value
 */
export function composeStylesheets(base: string, sheets: readonly string[]): ComposedStylesheet {
  const sources: Source[] = [base, ...sheets].map((css, index) => {
    const sheet = index === 0 ? null : index - 1;
    try {
      return { root: parse(css), sheet };
    } catch (error) {
      if (error instanceof CssSyntaxError) {
        throw new EmailStylesheetInvalid(sheet ?? -1, error.line ?? 1, error.column ?? 1, 'unparsable', error.reason);
      }
      throw error;
    }
  });

  const globalProperties = customProperties(sources);
  const global = createScope(globalProperties);
  const scopes = new Map<AtRule, Scope>();
  /** The scope of `query`: each enclosing query's own custom properties over the sheets', the innermost last. */
  const scopeOf = (source: Source, query: AtRule | null): Scope => {
    if (query === null) return global;
    const held = scopes.get(query);
    if (held) return held;
    const chain: AtRule[] = [];
    for (let node: AtRule | null = query; node !== null; node = enclosingQuery(node)) chain.unshift(node);
    const own = chain.map((node) => queryProperties(source, node));
    const scope = own.every((properties) => properties.size === 0)
      ? global
      : createScope(new Map([...globalProperties, ...own.flatMap((properties) => [...properties])]));
    scopes.set(query, scope);
    return scope;
  };

  const rules: InlineRule[] = [];
  const head: string[] = [];
  const warnings: StylesheetWarning[] = [];
  const written: WrittenRule[] = [];
  const entries: QueryEntry[] = [];
  /** The product query rules `readQuery` computes per element, which the head therefore leaves out. */
  const computed = new Set<Rule>();
  let darkScheme = false;
  let position = 0;

  const warn = (source: Source, declaration: Declaration, value: string): void => {
    if (source.sheet === null) return;
    const { line, column } = positionOf(declaration);
    for (const { feature, clients } of unsupportedBy(declaration.prop, value)) {
      warnings.push({
        sheet: source.sheet,
        line,
        column,
        property: declaration.prop.toLowerCase(),
        value,
        feature,
        clients,
      });
    }
  };

  /** A rule's declarations, each value read through `scope`; `custom` properties are left out. */
  const declarationsOf = (source: Source, rule: Rule, scope: Scope): StyleDeclaration[] =>
    rule.nodes.flatMap((child): StyleDeclaration[] => {
      if (child.type === 'comment') return [];
      if (child.type !== 'decl') refuse(source, child, 'selector-refused', child.toString());
      if (child.prop.startsWith('--')) return [];
      const value = scope.resolveIn(source, child, child.value.trim());
      return [{ property: child.prop.toLowerCase(), value, important: child.important === true }];
    });

  const inlineRule = (source: Source, rule: Rule): void => {
    const declarations = declarationsOf(source, rule, global);
    rule.each((child) => {
      if (child.type !== 'decl' || child.prop.startsWith('--')) return;
      const value = global.resolveIn(source, child, child.value.trim());
      warn(source, child, value);
      if (child.important === true && source.sheet !== null) {
        // Inlined, it would beat the head's dark and narrow-screen rules, which a client reads after it.
        const { line, column } = positionOf(child);
        const property = child.prop.toLowerCase();
        warnings.push({
          sheet: source.sheet,
          line,
          column,
          property,
          value,
          feature: 'important-dropped',
          clients: [],
        });
      }
    });
    const selectors: { selector: ClassSelector; order: number }[] = [];
    for (const text of rule.selectors) {
      // `:root` holds custom properties only; a declaration there would select no element of the email.
      if (text.trim() === ':root') {
        if (declarations.length > 0) refuse(source, rule, 'selector-refused', text.trim());
        continue;
      }
      const selector = parseClassSelector(text);
      if ('refused' in selector) refuse(source, rule, 'selector-refused', text.trim());
      if (declarations.length === 0) continue;
      const order = position++;
      rules.push({ selector, declarations, order });
      selectors.push({ selector, order });
    }
    if (selectors.length > 0) written.push({ source, rule, selectors });
  };

  /** A product query's class-only rules, read for computing, and the queries nested in it, in source order. */
  const readQuery = (
    source: Source,
    query: AtRule,
    around: readonly AtRule[],
    outer: readonly (readonly WrittenRule[])[],
  ): void => {
    const chain = [...around, query];
    const scope = scopeOf(source, query);
    const guarded = chain.some((node) => node.name.toLowerCase() === 'supports');
    const own: WrittenRule[] = [];
    const levels = [...outer, own];
    entries.push({ chain, scope, levels });
    query.each((child) => {
      if (child.type === 'atrule' && CONDITIONAL.has(child.name.toLowerCase())) {
        readQuery(source, child, chain, levels);
        return;
      }
      if (child.type !== 'rule') return;
      computed.add(child);
      const declarations = declarationsOf(source, child, scope);
      // A rule under `@supports` is the author's own guard for the clients that lack the feature.
      if (!guarded) {
        child.each((node) => {
          if (node.type === 'decl' && !node.prop.startsWith('--')) {
            warn(source, node, scope.resolveIn(source, node, node.value.trim()));
          }
        });
      }
      const selectors: { selector: ClassSelector; order: number }[] = [];
      for (const text of child.selectors) {
        // As at the top: `:root` holds custom properties only, which the query's scope has read already.
        if (text.trim() === ':root') {
          if (declarations.length > 0) refuse(source, child, 'selector-refused', text.trim());
          continue;
        }
        const selector = parseClassSelector(text);
        if ('refused' in selector || declarations.length === 0) continue;
        selectors.push({ selector, order: position++ });
      }
      if (selectors.length > 0) own.push({ source, rule: child, selectors });
    });
  };

  /**
   * What an at-rule keeps in the head: the base sheet's as written; a product's with the class-only and `:root`
   * rules of its queries taken out, since the renderer computes those per element, and the rest made `!important`.
   * A query inside another at-rule, such as `@layer`, and an at-rule inside a query are not computed, so they stay.
   */
  const headRule = (source: Source, rule: AtRule): void => {
    if (CONDITIONAL.has(rule.name.toLowerCase()) && DARK_QUERY.test(rule.params)) darkScheme = true;
    rule.walkAtRules((nested) => {
      if (nested.name.toLowerCase() === 'media' && DARK_QUERY.test(nested.params)) darkScheme = true;
    });
    const product = source.sheet !== null;
    if (product && CONDITIONAL.has(rule.name.toLowerCase())) readQuery(source, rule, [], []);
    // Each declaration reads the custom properties of every query around it, over the sheets' top-level ones.
    const values: string[] = [];
    rule.walkDecls((declaration) => {
      values.push(scopeOf(source, enclosingQuery(declaration)).resolveIn(source, declaration, declaration.value));
    });
    const copy = rule.clone();
    // The clone walks as the rule does, so each copied rule is found at its original's index.
    const originals: Rule[] = [];
    rule.walkRules((inner) => {
      originals.push(inner);
    });
    const copies: Rule[] = [];
    copy.walkRules((inner) => {
      copies.push(inner);
    });
    let index = 0;
    copy.walkDecls((declaration) => {
      declaration.value = values[index];
      index += 1;
      if (product && enclosingQuery(declaration) !== null) declaration.important = true;
    });
    if (product) {
      copies.forEach((inner, at) => {
        if (!computed.has(originals[at])) return;
        const kept = inner.selectors.filter((text) => !ROOTS.has(text.trim()) && 'refused' in parseClassSelector(text));
        if (kept.length === 0) inner.remove();
        else inner.selectors = kept;
      });
      // Innermost first, so a query left empty by its own rules' removal empties the one around it too.
      const queries: AtRule[] = [];
      copy.walkAtRules((nested) => {
        if (CONDITIONAL.has(nested.name.toLowerCase())) queries.unshift(nested);
      });
      for (const nested of queries) if ((nested.nodes ?? []).length === 0) nested.remove();
      if (CONDITIONAL.has(copy.name.toLowerCase()) && (copy.nodes ?? []).length === 0) return;
    }
    head.push(copy.toString());
  };

  for (const source of sources) {
    for (const node of source.root.nodes) {
      if (node.type === 'comment') continue;
      if (node.type === 'rule') inlineRule(source, node);
      else if (node.type === 'atrule') {
        const name = node.name.toLowerCase();
        if (name === 'import') refuse(source, node, 'import-refused', node.params);
        if (name !== 'charset') headRule(source, node);
      } else refuse(source, node, 'unparsable', node.toString());
    }
  }

  const queries = entries.map(({ chain, scope, levels }): QueryRules => {
    const read = (list: readonly WrittenRule[]): InlineRule[] =>
      list.flatMap(({ source, rule, selectors }) => {
        const declarations = declarationsOf(source, rule, scope);
        return selectors.map(({ selector, order }) => ({ selector, declarations, order }));
      });
    const top = scope === global ? rules : read(written);
    const own = read(levels.flat());
    return {
      open: chain.map((node) => `@${node.name} ${node.params}{`).join(''),
      close: '}'.repeat(chain.length),
      rules: [...top, ...own],
      own,
    };
  });

  // A `</style>` in a product's rule would end the head's style, and the rest of it would print as the email.
  // The base sheet's widest rule, wherever it stands: a query class must outweigh its head rules.
  let widest = 0;
  sources[0].root.walkRules((rule) => {
    for (const text of rule.selectors) {
      const selector = parseClassSelector(text);
      if (!('refused' in selector)) widest = Math.max(widest, selector.specificity);
    }
  });

  return {
    rules,
    head: head.join('').replaceAll('</', '<\\/'),
    queries,
    queryWeight: widest + 1,
    darkScheme,
    warnings,
  };
}
