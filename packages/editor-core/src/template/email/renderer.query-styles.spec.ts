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

/** The declarations the head gives `name` under the query text that opens before it. */
function ruleOf(head: string, name: string): string | undefined {
  return new RegExp(`\\.${name}\\{([^}]*)\\}`).exec(head)?.[1];
}

describe("a product's query rules, drawn per element", () => {
  it('gives an element the style its query makes, with the variables the query redefines', () => {
    const css = ':root{--c:#111111}.zx-text{color:var(--c)}@media (prefers-color-scheme:dark){:root{--c:#EEEEEE}}';
    const { html, head } = render(css);
    const [dark] = queryClassesOf(html, 'zx-text zx-tone-default');
    expect(head).toContain(`@media (prefers-color-scheme:dark){.${dark}{color:#EEEEEE !important}}`);
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
    expect(head).toContain(
      `@media (prefers-color-scheme:dark){.${dark}{border:2px solid red !important}` +
        `.${dark}.${dark}{border-color:green !important}}`,
    );
  });

  it("writes a query's own declaration that equals the inline one, so it still beats the base's head rules", () => {
    const { html, head } = render('@media only screen and (max-width:600px){.zx-text{font-size:14px}}');
    const [narrow] = queryClassesOf(html, 'zx-text zx-tone-default');
    expect(ruleOf(head, narrow)).toBe('font-size:14px !important');
    expect(head.indexOf(`.${narrow}{`)).toBeGreaterThan(head.indexOf('.zx-text{font-size:16px !important'));
  });

  it('keeps the specificity of a query rule, so a more specific one wins over a later query', () => {
    const css =
      '@media (max-width:600px){.zx-region-body .zx-text{color:red}}@media (min-width:1px){.zx-text{color:blue}}';
    const { html, head } = render(css);
    const [narrow, wide] = queryClassesOf(html, 'zx-text zx-tone-default');
    expect(head).toContain(`@media (min-width:1px){.${wide}{color:blue !important}}`);
    expect(head).toContain(`@media (max-width:600px){.${narrow}.${narrow}{color:red !important}}`);
  });

  it("lets a query's important declaration beat a more specific one in another query", () => {
    const css =
      '@media (max-width:600px){.zx-region-body .zx-text{color:red}}' +
      '@media (min-width:1px){.zx-text{color:blue !important}}';
    const { html, head } = render(css);
    const [narrow, wide] = queryClassesOf(html, 'zx-text zx-tone-default');
    const selectorOf = (name: string, value: string): string =>
      new RegExp(`((?:\\.${name})+)\\{color:${value} !important\\}`).exec(head)?.[1] ?? '';
    expect(selectorOf(wide, 'blue').length).toBeGreaterThan(selectorOf(narrow, 'red').length);
  });

  it('writes a nested query before an outer rule that follows it, so the later rule wins as written', () => {
    const css = '@media (max-width:600px){@media (min-width:1px){.zx-text{color:red}}.zx-text{color:blue}}';
    const { html, head } = render(css);
    const [outer, inner] = queryClassesOf(html, 'zx-text zx-tone-default');
    expect(head.indexOf(`.${inner}{color:red`)).toBeLessThan(head.indexOf(`.${outer}{color:blue`));
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
      `@supports (display:block){@media (prefers-color-scheme:dark){.${dark}{color:#EEEEEE !important}}}`,
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
