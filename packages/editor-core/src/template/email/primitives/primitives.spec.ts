// @vitest-environment node
import { describe, expect, it } from 'vitest';
import type { RenderProblem } from '../block.js';
import { createRenderContext } from '../context.js';
import { composeStylesheets } from '../css/stylesheet.js';
import { FIXTURE_THEME } from '../fixtures.fixture.js';
import { expandNodes } from './elements.js';
import { createPrimitives, literalReader, type EmailNode, type EmailPrimitives } from './nodes.js';
import { plainTextOf } from './plain-text.js';
import { serialiseElements } from './serialise.js';

interface Drawn {
  readonly html: string;
  readonly text: string;
  readonly problems: RenderProblem[];
}

/** `build`'s nodes drawn with a block's context and `css`, in a cell's flow or among a region's rows. */
function draw(
  build: (h: EmailPrimitives) => EmailNode | EmailNode[],
  { css = '', place = 'flow' }: { css?: string; place?: 'flow' | 'stack' } = {},
): Drawn {
  const problems: RenderProblem[] = [];
  const ctx = createRenderContext(
    {
      theme: FIXTURE_THEME,
      locale: 'en',
      variables: { name: '<Mai>', u: 'https://x.test/a?b=1&c=2', bad: 'javascript:alert(1)' },
      variableTypes: { name: 'string', u: 'url', bad: 'url' },
      problems,
      region: 'body',
    },
    'b1',
    () => ({ html: '', text: '' }),
  );
  const built = build(ctx.h);
  const nodes = Array.isArray(built) ? built : [built];
  const { rules } = composeStylesheets(css, []);
  return { html: serialiseElements(expandNodes(nodes, place), rules), text: plainTextOf(nodes), problems };
}

describe('the primitives', () => {
  it('draw text as a div styled by its classes, its value escaped on the html arm only', () => {
    const { html, text } = draw((h) => h.text({ class: 'own', text: 'Hi {{name}} <b>' }), {
      css: '.zx-text{color:red}.own{font-weight:600}',
    });
    expect(html).toBe('<div class="zx-text own" style="color:red;font-weight:600;">Hi &lt;Mai&gt; &lt;b&gt;</div>');
    expect(text).toBe('Hi <Mai> <b>\n\n');
  });

  it('draw inline markup as strong, em and a link the stylesheet colours', () => {
    const { html, text } = draw((h) => h.text({ markup: '**a** _b_ [c]({{u}})' }), { css: '.zx-link{color:green}' });
    expect(html).toBe(
      '<div class="zx-text"><strong>a</strong> <em>b</em> <a href="https://x.test/a?b=1&amp;c=2" class="zx-link" style="color:green;">c</a></div>',
    );
    expect(text).toBe('a b c (https://x.test/a?b=1&c=2)\n\n');
  });

  it("draw a refused link's label as text and report it", () => {
    const { html, problems } = draw((h) => h.text({ markup: '[c]({{bad}})' }));
    expect(html).toBe('<div class="zx-text">c</div>');
    expect(problems).toContainEqual({ blockId: 'b1', kind: 'href-scheme-refused', name: 'bad' });
  });

  it('end a text with one line break when asked', () => {
    expect(draw((h) => h.text({ text: 'x', textEnd: 'line' })).text).toBe('x\n');
  });

  it('escape a quoted value in the style attribute', () => {
    const { html } = draw((h) => h.text({ text: 'x' }), { css: '.zx-text{font-family:"Brand" Sans}' });
    expect(html).toContain('style="font-family:&quot;Brand&quot; Sans;"');
  });

  it('draw a button as a link, its label filled and its href checked', () => {
    const ok = draw((h) => h.button({ href: '{{u}}', label: 'Go {{name}}' }));
    expect(ok.html).toBe('<a href="https://x.test/a?b=1&amp;c=2" class="zx-button">Go &lt;Mai&gt;</a>');
    expect(ok.text).toBe('Go <Mai>: https://x.test/a?b=1&c=2\n\n');
    const refused = draw((h) => h.button({ href: '{{bad}}', label: 'Go' }));
    expect(refused.html).toBe('<a href="" class="zx-button">Go</a>');
    expect(refused.problems).toContainEqual({ blockId: 'b1', kind: 'href-scheme-refused', name: 'bad' });
  });

  it('draw an image with its alt and width, and none for a src that is not a web address', () => {
    expect(draw((h) => h.image({ src: '{{u}}', alt: 'A {{name}}', width: 120.4 })).html).toBe(
      '<img src="https://x.test/a?b=1&amp;c=2" alt="A &lt;Mai&gt;" width="120" class="zx-image" />',
    );
    expect(draw((h) => h.image({ src: '{{bad}}', alt: 'A', width: 1 })).html).toBe('');
    const linked = draw((h) => h.image({ src: '{{u}}', alt: 'A', width: 1, href: '{{u}}' }));
    expect(linked.html).toMatch(/^<a href="[^"]+" class="zx-image-link"><img /);
    expect(linked.text).toBe('A: https://x.test/a?b=1&c=2\n\n');
  });

  it('draw the layout values a literal factory is given as they are, escaped', () => {
    const h = createPrimitives(literalReader);
    const { rules } = composeStylesheets('', []);
    const html = serialiseElements(
      expandNodes([h.image({ src: 'data:image/png;base64,x', alt: '<a>', width: 1 })]),
      rules,
    );
    expect(html).toBe('<img src="data:image/png;base64,x" alt="&lt;a&gt;" width="1" class="zx-image" />');
  });

  it('draw a list, a code block, a divider and a spacer', () => {
    expect(draw((h) => h.list({ items: ['a', '**b**'] }))).toMatchObject({
      html: '<ul class="zx-text zx-list"><li>a</li><li><strong>b</strong></li></ul>',
      text: '- a\n- b\n\n',
    });
    expect(draw((h) => h.list({ items: ['a', 'b'], ordered: true })).text).toBe('1. a\n2. b\n\n');
    expect(draw((h) => h.code({ text: '{{name}}' }))).toMatchObject({
      html: '<div class="zx-code">&lt;Mai&gt;</div>',
      text: '<Mai>\n\n',
    });
    expect(draw((h) => h.divider())).toMatchObject({ html: '<div class="zx-divider">&nbsp;</div>', text: '\n' });
    expect(draw((h) => h.spacer({ height: 12 })).html).toBe(
      '<div class="zx-spacer" style="height:12px;line-height:12px;font-size:0;">&nbsp;</div>',
    );
  });

  it('draw a heading at its level', () => {
    expect(draw((h) => h.heading({ level: 2, text: 'Title' }))).toMatchObject({
      html: '<h2 class="zx-text zx-heading zx-heading-2">Title</h2>',
      text: 'Title\n\n',
    });
  });

  it('write raw markup as given with values escaped, and its tags dropped on the text arm', () => {
    expect(draw((h) => h.raw({ markup: '<p class="x">Hi {{name}}</p>' }))).toMatchObject({
      html: '<p class="x">Hi &lt;Mai&gt;</p>',
      text: 'Hi <Mai>\n\n',
    });
  });

  it('draw a section as a table of one cell, and as its own row among a stack of rows', () => {
    const section = (h: EmailPrimitives) => h.section({ class: 'row' }, [h.text({ text: 'x' })]);
    expect(draw(section).html).toBe(
      '<table role="presentation" cellpadding="0" cellspacing="0" width="100%"><tr><td class="row"><div class="zx-text">x</div></td></tr></table>',
    );
    expect(draw(section, { place: 'stack' }).html).toBe('<tr><td class="row"><div class="zx-text">x</div></td></tr>');
    expect(draw((h) => h.text({ text: 'x' }), { place: 'stack' }).html).toBe(
      '<tr><td><div class="zx-text">x</div></td></tr>',
    );
    expect(draw((h) => h.raw({ markup: '<tr><td>own</td></tr>' }), { place: 'stack' }).html).toBe(
      '<tr><td>own</td></tr>',
    );
  });

  it('style a node by its ancestors, so a region decides how its text reads', () => {
    const { html } = draw((h) => h.region('footer', [h.section({}, [h.text({ text: 'x' })])]), {
      css: '.zx-text{font-size:14px}.zx-region-footer .zx-text{font-size:12px}',
    });
    expect(html).toContain('<div class="zx-text" style="font-size:12px;">x</div>');
  });

  it('draw columns at their weights, the last lane marked, and their lanes stacked', () => {
    const { html, text } = draw((h) =>
      h.columns({}, [h.column({ weight: 2 }, [h.text({ text: 'L' })]), h.column({}, [h.text({ text: 'R' })])]),
    );
    expect(html).toContain('<td width="67%" valign="top" class="zx-lane">');
    expect(html).toContain('<td width="33%" valign="top" class="zx-lane zx-lane-last">');
    expect(text).toBe('L\n\nR\n\n');
  });

  it('draw no region for one with no blocks, and trim the text of one that has them', () => {
    expect(draw((h) => h.region('header', []))).toMatchObject({ html: '', text: '' });
    expect(draw((h) => h.region('footer', [h.text({ text: 'F' })], { textEnd: 'line' })).text).toBe('F\n');
  });

  it("draw the card in Outlook's fixed table and the page's gutter", () => {
    const { html } = draw((h) => h.card({}, [h.text({ text: 'x' })]));
    expect(html).toBe(
      '<table role="presentation" cellpadding="0" cellspacing="0" width="100%" class="zx-canvas"><tr><td align="center" class="zx-outer">' +
        '<!--[if mso]><table role="presentation" width="600" align="center" cellpadding="0" cellspacing="0"><tr><td><![endif]-->' +
        '<table role="presentation" cellpadding="0" cellspacing="0" class="zx-card"><tr><td class="zx-inner">' +
        '<table role="presentation" cellpadding="0" cellspacing="0" width="100%"><tr><td><div class="zx-text">x</div></td></tr></table>' +
        '</td></tr></table><!--[if mso]></td></tr></table><![endif]--></td></tr></table>',
    );
  });

  it('hide the preheader, and draw none when it is empty', () => {
    expect(draw((h) => h.preheader({ text: 'P {{name}}' }))).toMatchObject({
      html: '<div class="zx-preheader">P &lt;Mai&gt;</div>',
      text: '',
    });
    expect(draw((h) => h.preheader({ text: '' })).html).toBe('');
  });

  it('leave out a falsy child and a falsy class', () => {
    expect(draw((h) => h.section({ class: ['a', false, null] }, [false, h.divider()])).html).toContain(
      '<td class="a"><div class="zx-divider">',
    );
  });
});
