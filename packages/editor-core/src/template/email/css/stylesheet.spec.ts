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

  it('inlines a custom property from :root, and draws its @media value in a head rule of that query', () => {
    const css =
      ':root{--bg:#fff}@media (prefers-color-scheme:dark){:root{--bg:#000}}.a{background:var(--bg);padding:4px}';
    expect(styleOf('', [css], element(['a']))).toBe('background:#fff;padding:4px;');
    expect(composeStylesheets('', [css]).head).toMatch(
      /^@media \(prefers-color-scheme:dark\)\{\.a\{background:#000 !important\}\}@media/,
    );
  });

  it("lets a query's own rule for a selector beat the redraw of its variable", () => {
    const css = ':root{--c:#111}.a{color:var(--c)}@media (prefers-color-scheme:dark){:root{--c:#eee}.a{color:red}}';
    expect(composeStylesheets('', [css]).head).toBe(
      '@media (prefers-color-scheme:dark){.a{color:#eee !important}}' +
        '@media (prefers-color-scheme:dark){:root{--c:#eee !important}.a{color:red !important}}',
    );
  });

  it('redraws every rule of a property a query changes, so a more specific one still wins', () => {
    const css = ':root{--c:#111}@media (prefers-color-scheme:dark){:root{--c:#eee}}.a{color:var(--c)}.a.b{color:green}';
    expect(composeStylesheets('', [css]).head).toMatch(
      /^@media \(prefers-color-scheme:dark\)\{\.a\{color:#eee !important\}\.a\.b\{color:green !important\}\}/,
    );
  });

  it('reads the custom properties of every query a declaration sits in, the innermost last', () => {
    const css =
      ':root{--c:#111}@supports (display:grid){@media (prefers-color-scheme:dark){:root{--c:#eee}.x{color:var(--c)}}}';
    expect(composeStylesheets('', [css]).head).toContain('.x{color:#eee !important}');
  });

  it('reads a custom property an @media redefines first inside that query', () => {
    const css = ':root{--c:#111}@media (prefers-color-scheme: dark){:root{--c:#eee}.zx-callout{color:var(--c)}}';
    expect(composeStylesheets('', [css]).head).toContain('.zx-callout{color:#eee !important}');
  });

  it('keeps @media and @font-face in the head, adding !important to a product rule', () => {
    const { rules, head } = composeStylesheets('@media (max-width:600px){.a{color:red !important}}', [
      '@font-face{font-family:X;src:url(x.woff2)}@media (max-width:600px){.b{color:blue}}',
    ]);
    expect(composeStylesheets('', ['@supports (display:grid){.c{color:red}}']).head).toBe(
      '@supports (display:grid){.c{color:red !important}}',
    );
    expect(rules).toEqual([]);
    expect(head).toBe(
      '@media (max-width:600px){.a{color:red !important}}@font-face{font-family:X;src:url(x.woff2)}@media (max-width:600px){.b{color:blue !important}}',
    );
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
