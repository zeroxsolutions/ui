// @vitest-environment node
import { describe, expect, it } from 'vitest';
import type { EmailBlock } from './block.js';
import { FIXTURE_LAYOUT_PROPS, FIXTURE_THEME } from './fixtures.fixture.js';
import { createEmailRenderer } from './renderer.js';

const paragraph: EmailBlock = { id: 'p1', type: 'paragraph', attributes: {}, content: { text: 'Hi' } };
const callout: EmailBlock = { id: 'c1', type: 'callout', attributes: {}, content: { text: 'Note' } };

function render(css: string, blocks: readonly EmailBlock[] = [paragraph]): { html: string; head: string } {
  const { html } = createEmailRenderer({ theme: FIXTURE_THEME, css }).render({
    blocks,
    subject: 's',
    preheader: null,
    locale: 'en',
    variables: {},
    variableTypes: {},
    layoutProps: { ...FIXTURE_LAYOUT_PROPS, footer: [] },
  });
  return { html, head: /<style>(.*)<\/style>/s.exec(html)?.[1] ?? '' };
}

/** The query classes the renderer gave the element whose classes open with `classes`. */
function queryClassesOf(html: string, classes: string): string[] {
  const found = new RegExp(`class="${classes}((?: [\\w-]+)*)"`).exec(html)?.[1] ?? '';
  return found.split(' ').filter((name) => name.startsWith('zx-q'));
}

/** The selector a query class is written with: the class once per class of the base sheet's widest rule, plus one. */
function selectorOf(name: string): string {
  return `.${name}`.repeat(3);
}

/** The declarations the head gives `name` under the query text that opens before it. */
function ruleOf(head: string, name: string): string | undefined {
  return new RegExp(`\\.${name}\\{([^}]*)\\}`).exec(head)?.[1];
}

describe("a product's query rules, drawn per element", () => {
  it('gives an element the style its query makes, with the variables the query redefines', () => {
    const css = ':root{--c:#111111}.zx-text{color:var(--c)}@media (prefers-color-scheme:dark){:root{--c:#EEEEEE}}';
    const { html, head } = render(css);
    const [dark] = queryClassesOf(html, 'zx-text zx-tone-default');
    expect(head).toContain(`@media (prefers-color-scheme:dark){${selectorOf(dark)}{color:#EEEEEE !important}}`);
  });

  it('keeps the queries in their order, so the later one wins a shared property when both hold', () => {
    const css =
      ':root{--c:#111111}.zx-text{color:var(--c)}@media (prefers-color-scheme:dark){:root{--c:#EEEEEE}}' +
      '@media (max-width:600px){.zx-text{color:red}}';
    const { html, head } = render(css);
    const [dark, narrow] = queryClassesOf(html, 'zx-text zx-tone-default');
    expect(ruleOf(head, dark)).toBe('color:#EEEEEE !important');
    expect(ruleOf(head, narrow)).toBe('color:red !important');
    expect(head.indexOf(`.${dark}{`)).toBeLessThan(head.indexOf(`.${narrow}{`));
  });

  it('draws both a narrow and a dark query on one element, the dark one last as it is written', () => {
    const css =
      '@media (max-width:600px){.zx-text{color:red}}@media (prefers-color-scheme:dark){.zx-text{color:white}}';
    const { html, head } = render(css);
    const [narrow, dark] = queryClassesOf(html, 'zx-text zx-tone-default');
    expect(ruleOf(head, narrow)).toBe('color:red !important');
    expect(ruleOf(head, dark)).toBe('color:white !important');
    expect(head.indexOf(`.${narrow}{`)).toBeLessThan(head.indexOf(`.${dark}{`));
  });

  it("leaves an element alone where an important top-level declaration beats the query's", () => {
    const { html, head } = render(
      '.zx-text{color:blue !important}@media (prefers-color-scheme:dark){.zx-text{color:red}}',
    );
    expect(queryClassesOf(html, 'zx-text zx-tone-default')).toEqual([]);
    expect(head).not.toContain('color:red');
  });

  it('keeps a more specific longhand over the shorthand a query sets', () => {
    const css =
      '.zx-region-body .zx-callout{border-color:green}@media (prefers-color-scheme:dark){.zx-callout{border:2px solid red}}';
    const { html, head } = render(css, [callout]);
    const [dark] = queryClassesOf(html, 'zx-callout');
    expect(ruleOf(head, dark)).toBe('border:2px solid red !important;border-color:green !important');
  });

  it("writes a query's own declaration that equals the inline one, over the base's head rules", () => {
    const { html, head } = render('@media only screen and (max-width:600px){.zx-text{font-size:14px}}');
    const [narrow] = queryClassesOf(html, 'zx-text zx-tone-default');
    expect(ruleOf(head, narrow)).toBe('font-size:14px !important');
    expect(head).toContain(`${selectorOf(narrow)}{font-size:14px !important}`);
    expect(head.indexOf(selectorOf(narrow))).toBeGreaterThan(head.indexOf('.zx-text{font-size:16px !important'));
  });

  it('lets the later query decide a property two set on one element, whatever their specificity', () => {
    const css =
      '@media (max-width:600px){.zx-region-body .zx-text{color:red}}@media (min-width:1px){.zx-text{color:blue}}';
    const { html, head } = render(css);
    const [narrow, wide] = queryClassesOf(html, 'zx-text zx-tone-default');
    expect(head).toContain(`@media (max-width:600px){${selectorOf(narrow)}{color:red !important}}`);
    expect(head).toContain(`@media (min-width:1px){${selectorOf(wide)}{color:blue !important}}`);
    expect(head.indexOf(selectorOf(narrow))).toBeLessThan(head.indexOf(selectorOf(wide)));
  });

  it('computes a nested query with its outer rules, so an outer rule after it still wins as written', () => {
    const css = '@media (max-width:600px){@media (min-width:1px){.zx-text{color:red}}.zx-text{color:blue}}';
    const { html, head } = render(css);
    const [outer, inner] = queryClassesOf(html, 'zx-text zx-tone-default');
    expect(ruleOf(head, outer)).toBe('color:blue !important');
    expect(ruleOf(head, inner)).toBe('color:blue !important');
  });

  it("reads an outer query's rule with the variables a nested query redefines", () => {
    const css = '@media (min-width:1px){.zx-text{color:var(--c,black)} @media (min-width:2px){:root{--c:blue}}}';
    const { html, head } = render(css);
    const [outer, inner] = queryClassesOf(html, 'zx-text zx-tone-default');
    expect(ruleOf(head, outer)).toBe('color:black !important');
    expect(head).toContain(
      `@media (min-width:1px){@media (min-width:2px){${selectorOf(inner)}{color:blue !important}}}`,
    );
  });

  it('writes one class of a fixed width for a selector of many classes', () => {
    const wide = '.zx-text'.repeat(2000);
    const { html, head } = render(`@media (max-width:600px){${wide}{color:red !important}}`);
    const [narrow] = queryClassesOf(html, 'zx-text zx-tone-default');
    expect(head).toContain(`${selectorOf(narrow)}{color:red !important}`);
    expect(html).not.toContain('.zx-text.zx-text');
    expect(html.length).toBeLessThan(render('').html.length + 300);
  });

  it('carries no property a shorthand does not set, such as border-collapse after border', () => {
    const css = '.zx-callout{border-collapse:separate}@media (prefers-color-scheme:dark){.zx-callout{border:0}}';
    const { html, head } = render(css, [callout]);
    const [dark] = queryClassesOf(html, 'zx-callout');
    expect(ruleOf(head, dark)).toBe('border:0 !important');
  });

  it('reads a :root inside a nested query, and writes the chain of queries around the rule', () => {
    const css =
      ':root{--c:#111111}.zx-text{color:var(--c)}' +
      '@supports (display:block){@media (prefers-color-scheme:dark){:root{--c:#EEEEEE}}}';
    const { html, head } = render(css);
    const [dark] = queryClassesOf(html, 'zx-text zx-tone-default');
    expect(head).toContain(
      `@supports (display:block){@media (prefers-color-scheme:dark){${selectorOf(dark)}{color:#EEEEEE !important}}}`,
    );
  });

  it('draws a dark rule of no variables on the element it selects', () => {
    const { html, head } = render('@media (prefers-color-scheme:dark){.zx-callout{border-color:#00BC7D}}', [callout]);
    const [dark] = queryClassesOf(html, 'zx-callout');
    expect(ruleOf(head, dark)).toBe('border-color:#00BC7D !important');
  });

  it('gives no element a query class without a product sheet', () => {
    expect(render('').html).not.toContain('zx-q');
  });
});
