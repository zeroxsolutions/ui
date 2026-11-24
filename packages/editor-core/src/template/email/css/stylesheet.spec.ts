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

  it('lets an important declaration beat a later, more specific one, and keeps its !important', () => {
    expect(styleOf('.a{color:red !important}', ['.a.b{color:blue}'], element(['a', 'b']))).toBe(
      'color:red !important;',
    );
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

  it('applies each selector of a list', () => {
    expect(styleOf('', ['.a, .b{color:red}'], element(['b']))).toBe('color:red;');
  });

  it('resolves var() from :root and .zx-root, falling back where a variable has no value', () => {
    const css =
      ':root{--brand:#123456}.zx-root{--gap:var(--unit)}:root{--unit:4px}.a{color:var(--brand);padding:var(--gap) var(--none, 2px)}';
    expect(styleOf('', [css], element(['a']))).toBe('color:#123456;padding:4px 2px;');
  });

  it('keeps @media and @font-face in the head, adding !important to a product rule', () => {
    const { rules, head } = composeStylesheets('@media (max-width:600px){.a{color:red !important}}', [
      '@font-face{font-family:X;src:url(x.woff2)}@media (max-width:600px){.b{color:blue}}',
    ]);
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

  it('refuses @import, a var() with no value and CSS that does not parse', () => {
    expect(refusal(['@import url(x.css);'])).toMatchObject({ sheet: 0, reason: 'import-refused' });
    expect(refusal(['.a{color:var(--missing)}'])).toMatchObject({ reason: 'variable-undefined', detail: '--missing' });
    expect(refusal([':root{--a:var(--b);--b:var(--a)}.x{color:var(--a)}'])).toMatchObject({
      reason: 'variable-undefined',
    });
    expect(refusal(['.a{color:red}', '.a{'])).toMatchObject({ sheet: 1, line: 1, reason: 'unparsable' });
  });
});
