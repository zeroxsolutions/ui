import { CssSyntaxError, parse, type AtRule, type ChildNode, type Root, type Rule } from 'postcss';
import { parseClassSelector, type ClassSelector } from './selector.js';

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

/** The sheets one renderer composes: what it inlines, and the rules it keeps in the head's style. */
export interface ComposedStylesheet {
  readonly rules: readonly InlineRule[];
  /** The `@media`, `@font-face` and other at-rules, in order, as the head's `<style>` holds them. */
  readonly head: string;
  /** Whether a head rule answers `prefers-color-scheme: dark`, so the email declares both schemes. */
  readonly darkScheme: boolean;
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
 * One declared inside `@media` holds only where the query does, which an inline value cannot, so it is not read.
 */
function customProperties(sources: readonly Source[]): Map<string, { value: string; source: Source; node: ChildNode }> {
  const found = new Map<string, { value: string; source: Source; node: ChildNode }>();
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

/**
 * The base sheet and a product's sheets, in that order, read into the rules a renderer inlines and the text it
 * keeps in the head. A product's `@media` and `@supports` declarations are made `!important`, since an inline
 * style beats any rule that is not.
 *
 * @throws {EmailStylesheetInvalid} for a sheet that does not parse, an inlined selector that is not class-only,
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

  const custom = customProperties(sources);
  const resolving = new Set<string>();
  const resolved = new Map<string, string>();
  const resolveIn = (source: Source, node: ChildNode, value: string): string =>
    substitute(
      value,
      (name) => {
        const held = resolved.get(name);
        if (held !== undefined) return held;
        const declared = custom.get(name);
        if (declared === undefined) return undefined;
        // A browser reads every property in a cycle as invalid, its fallback included.
        if (resolving.has(name)) refuse(declared.source, declared.node, 'variable-undefined', name);
        resolving.add(name);
        const value = resolveIn(declared.source, declared.node, declared.value);
        resolving.delete(name);
        resolved.set(name, value);
        return value;
      },
      (name) => refuse(source, node, 'variable-undefined', name),
    );

  const rules: InlineRule[] = [];
  const head: string[] = [];
  let darkScheme = false;

  const inlineRule = (source: Source, rule: Rule): void => {
    const declarations: StyleDeclaration[] = [];
    for (const child of rule.nodes) {
      if (child.type === 'comment') continue;
      if (child.type !== 'decl') refuse(source, child, 'selector-refused', child.toString());
      if (child.prop.startsWith('--')) continue;
      declarations.push({
        property: child.prop.toLowerCase(),
        value: resolveIn(source, child, child.value.trim()),
        important: child.important === true,
      });
    }
    for (const text of rule.selectors) {
      // `:root` holds custom properties only; a declaration there would select no element of the email.
      if (text.trim() === ':root') {
        if (declarations.length > 0) refuse(source, rule, 'selector-refused', text.trim());
        continue;
      }
      const selector = parseClassSelector(text);
      if ('refused' in selector) refuse(source, rule, 'selector-refused', text.trim());
      if (declarations.length > 0) rules.push({ selector, declarations, order: rules.length });
    }
  };

  const headRule = (source: Source, rule: AtRule): void => {
    const name = rule.name.toLowerCase();
    if (name === 'media' && DARK_QUERY.test(rule.params)) darkScheme = true;
    const conditional = name === 'media' || name === 'supports';
    const copy = rule.clone();
    copy.walkDecls((declaration) => {
      declaration.value = resolveIn(source, declaration, declaration.value);
      if (conditional && source.sheet !== null) declaration.important = true;
    });
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

  // A `</style>` in a product's rule would end the head's style, and the rest of it would print as the email.
  return { rules, head: head.join('').replaceAll('</', '<\\/'), darkScheme };
}
