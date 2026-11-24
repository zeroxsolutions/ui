// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { inlineStyle } from './inline-styles.js';
import type { StyledElement } from './selector.js';
import { composeStylesheets, EmailStylesheetInvalid } from './stylesheet.js';

function element(classes: string[], parent: StyledElement | null = null): StyledElement {
  return { classes, parent };
}

/** The style `classes` gets from the product's `sheets` over `base`. */
function styleOf(base: string, sheets: string[], target: StyledElement): string {
  return inlineStyle(composeStylesheets(base, sheets).rules, target);
}

function refusal(sheets: string[]): EmailStylesheetInvalid {
  try {
    composeStylesheets('', sheets);
  } catch (error) {
    if (error instanceof EmailStylesheetInvalid) return error;
    throw error;
  }
  throw new Error('the sheets were accepted');
}

describe('inlining a stylesheet', () => {
  it('lets a later rule of equal specificity win, the product sheet after the base', () => {
    expect(styleOf('.a{color:red}', ['.a{color:blue}'], element(['a']))).toBe('color:blue;');
  });

  it('lets a compound selector beat a later single class', () => {
    expect(styleOf('.a.b{color:red}', ['.b{color:blue}'], element(['a', 'b']))).toBe('color:red;');
  });

  it('lets an important declaration beat a later, more specific one, and inlines it without !important', () => {
    expect(styleOf('', ['.a{color:red !important}', '.a.b{color:blue}'], element(['a', 'b']))).toBe('color:red;');
  });

  it("warns of an inlined !important, which would beat the head's dark and narrow-screen rules", () => {
    expect(composeStylesheets('', ['.a{\n  color:red !important}']).warnings).toEqual([
      expect.objectContaining({ sheet: 0, line: 2, column: 3, property: 'color', feature: 'important-dropped' }),
    ]);
    expect(composeStylesheets('', ['@media all{.a{color:red !important}}']).warnings).toEqual([]);
  });

  it('matches a descendant at any depth, and a child one level down only', () => {
    const root = element(['r']);
    const deep = element(['t'], element(['m'], root));
    expect(styleOf('.r .t{color:red}', [], deep)).toBe('color:red;');
    expect(styleOf('.r > .t{color:red}', [], deep)).toBe('');
    expect(styleOf('.r>.t{color:red}', [], element(['t'], root))).toBe('color:red;');
  });

  it("keeps a product's longhand after the base's shorthand, so the longhand wins", () => {
    expect(styleOf('.a{padding:0 0 10px}', ['.a{padding-bottom:30px}'], element(['a']))).toBe(
      'padding:0 0 10px;padding-bottom:30px;',
    );
  });

  it('keeps a property written twice in one rule, the first a fallback for a client that drops the second', () => {
    expect(styleOf('', ['.a{background:#fff;background:oklch(0.9 0 0)}'], element(['a']))).toBe(
      'background:#fff;background:oklch(0.9 0 0);',
    );
    expect(styleOf('.a{background:#000}', ['.a{background:#fff;background:red}'], element(['a']))).toBe(
      'background:#fff;background:red;',
    );
  });

  it("reads Tailwind's escaped class names", () => {
    expect(
      styleOf('', ['.md\\:p-4{padding:4px}.w-1\\/2{width:50%}.--x{color:red}'], element(['md:p-4', 'w-1/2', '--x'])),
    ).toBe('padding:4px;width:50%;color:red;');
  });

  it('applies each selector of a list', () => {
    expect(styleOf('', ['.a, .b{color:red}'], element(['b']))).toBe('color:red;');
  });

  it('resolves var() from :root and .zx-root, falling back where a variable has no value', () => {
    const css =
      ':root{--brand:#123456}.zx-root{--gap:var(--unit)}:root{--unit:4px}.a{color:VAR(--brand);padding:var(--gap) var(--none, 2px)}';
    expect(styleOf('', [css], element(['a']))).toBe('color:#123456;padding:4px 2px;');
  });

  it("reads a product query's class-only rules, and the top-level rules with its variables, for its elements", () => {
    const css =
      ':root{--bg:#fff}@supports (display:grid){@media (prefers-color-scheme:dark){:root{--bg:#000}.b{color:red}}}' +
      '.a{background:var(--bg);padding:4px}';
    const { head, queries } = composeStylesheets('', [css]);
    expect(styleOf('', [css], element(['a']))).toBe('background:#fff;padding:4px;');
    expect(head).toBe('');
    expect(queries.map(({ open, close }) => [open, close])).toEqual([
      ['@supports (display:grid){', '}'],
      ['@supports (display:grid){@media (prefers-color-scheme:dark){', '}}'],
    ]);
    expect(inlineStyle(queries[1].rules, element(['a', 'b']))).toBe('color:red;background:#000;padding:4px;');
  });

  it("keeps the base sheet's queries as written, and a product query's other selectors and at-rules", () => {
    const { rules, head, queries } = composeStylesheets('@media (max-width:600px){.a{color:red !important}}', [
      '@font-face{font-family:X;src:url(x.woff2)}@media (max-width:600px){.b{color:blue}p, .c{margin:0}}',
    ]);
    expect(rules).toEqual([]);
    expect(head).toBe(
      '@media (max-width:600px){.a{color:red !important}}@font-face{font-family:X;src:url(x.woff2)}' +
        '@media (max-width:600px){p{margin:0 !important}}',
    );
    expect(queries).toHaveLength(1);
  });

  it('keeps a query inside another at-rule, such as @layer, in the head as written', () => {
    const { head, queries } = composeStylesheets('', ['@layer x{@media (max-width:600px){.b{color:blue}}}']);
    expect(head).toBe('@layer x{@media (max-width:600px){.b{color:blue !important}}}');
    expect(queries).toEqual([]);
  });

  it('keeps an at-rule inside a product query, with its rules, which the renderer does not compute', () => {
    const { head } = composeStylesheets('', ['@media (max-width:600px){@layer x{.b{color:blue}}.c{color:red}}']);
    expect(head).toBe('@media (max-width:600px){@layer x{.b{color:blue !important}}}');
  });

  it("computes a query's .zx-root rule as any class rule, and refuses a :root one that styles", () => {
    const { queries } = composeStylesheets('', ['@media (max-width:600px){.zx-root{--x:1px;color:red}}']);
    expect(inlineStyle(queries[0].rules, element(['zx-root']))).toBe('color:red;');
    expect(refusal(['@media (max-width:600px){\n  :root{--x:1px;color:red}}'])).toMatchObject({
      line: 2,
      reason: 'selector-refused',
      detail: ':root',
    });
  });

  it('keeps a product rule from ending the head style', () => {
    expect(composeStylesheets('', ['@media all{.a{font-family:"</style><b>"}}']).head).not.toContain('</style>');
  });

  it('reads whether a head rule answers a dark colour scheme', () => {
    expect(composeStylesheets('', ['@media (prefers-color-scheme: dark){.a{color:red}}']).darkScheme).toBe(true);
    expect(composeStylesheets('', ['@media (max-width:600px){.a{color:red}}']).darkScheme).toBe(false);
  });

  it.each([
    ['p{color:red}', 'p'],
    ['#x{color:red}', '#x'],
    ['.a[href]{color:red}', '.a[href]'],
    ['.a:hover{color:red}', '.a:hover'],
    ['.a + .b{color:red}', '.a + .b'],
    ['*{color:red}', '*'],
    ['.a > > .b{color:red}', '.a > > .b'],
    [':root{color:red}', ':root'],
  ])('refuses the inlined selector of %s at its position', (css, selector) => {
    expect(refusal(['.ok{color:red}', `\n  ${css}`])).toMatchObject({
      sheet: 1,
      line: 2,
      column: 3,
      reason: 'selector-refused',
      detail: selector,
    });
  });

  it('accepts any selector inside @media, where Gmail drops what it cannot read', () => {
    expect(() => composeStylesheets('', ['@media (max-width:600px){p, .a:hover{color:red}}'])).not.toThrow();
  });

  it('takes the fallback of a var() whose variable is in a cycle, as a browser does', () => {
    const css =
      ':root{--a:var(--b, red);--b:var(--a, blue);--c:var(--a)}.x{color:var(--a, green);border-color:var(--c, gray)}';
    expect(composeStylesheets('', [css]).rules[0].declarations.map((declaration) => declaration.value)).toEqual([
      'green',
      'gray',
    ]);
  });

  it('refuses @import, a var() with no value and CSS that does not parse', () => {
    expect(refusal(['@import url(x.css);'])).toMatchObject({ sheet: 0, reason: 'import-refused' });
    expect(refusal(['.a{color:var(--missing)}'])).toMatchObject({ reason: 'variable-undefined', detail: '--missing' });
    expect(refusal([':root{--a:var(--b);--b:var(--a)}.x{color:var(--a)}'])).toMatchObject({
      reason: 'variable-undefined',
    });
    expect(refusal([':root{--a:var(--b, red);--b:var(--a, blue)}.x{color:var(--a)}'])).toMatchObject({
      reason: 'variable-undefined',
    });
    expect(refusal(['.a{color:red}', '.a{'])).toMatchObject({ sheet: 1, line: 1, reason: 'unparsable' });
  });
});
