// @vitest-environment node
import { describe, expect, it } from 'vitest';
import type { EmailBlock, RenderedBlock, RenderProblem } from '../block.js';
import { createRenderContext, type RenderState } from '../context.js';
import { FIXTURE_LAYOUT_PROPS, FIXTURE_THEME } from '../fixtures.fixture.js';
import { createEmailRenderer } from '../renderer.js';
import { defaultBlocks, type DefaultBlockType } from './index.js';

interface Rendered extends RenderedBlock {
  readonly problems: RenderProblem[];
}

function render(
  type: DefaultBlockType,
  attributes: unknown,
  content: unknown,
  variables: RenderState['variables'] = {},
  variableTypes: RenderState['variableTypes'] = {},
  lanes: RenderedBlock[] = [],
): Rendered {
  const problems: RenderProblem[] = [];
  const definition = defaultBlocks[type];
  const ctx = createRenderContext(
    { theme: FIXTURE_THEME, locale: 'en', variables, variableTypes, problems, region: 'body' },
    'b1',
    (index) => lanes[index] ?? { html: '', text: '' },
  );
  const view = {
    id: 'b1',
    attributes: definition.readAttributes(attributes),
    content: definition.readContent(content),
  };
  return { ...(definition.render as (v: typeof view, c: typeof ctx) => RenderedBlock)(view, ctx), problems };
}

describe('the default blocks', () => {
  it('print authored text in a text block as text, so no link or tag can be authored outside the html block', () => {
    const { html } = render(
      'paragraph',
      {},
      { text: 'Prices < 100 <a href="{{name}}">x</a>' },
      { name: 'javascript:alert(1)' },
    );
    expect(html).toContain('Prices &lt; 100 &lt;a href=&quot;javascript:alert(1)&quot;&gt;x&lt;/a&gt;');
    expect(html).not.toContain('<a ');
  });

  it('render a paragraph in the theme font and foreground, escaping its value on the html arm only', () => {
    const { html, text } = render('paragraph', {}, { text: 'Hi {{name}},' }, { name: '<Mai>' });
    expect(html).toContain('font-family:Inter, Arial, Helvetica, sans-serif');
    expect(html).toContain('color:#09090B');
    expect(html).toContain('Hi &lt;Mai&gt;,');
    expect(text).toBe('Hi <Mai>,\n\n');
  });

  it('align a paragraph and space it after by its attributes', () => {
    const { html } = render('paragraph', { align: 'center', spaceAfter: 'large' }, { text: 'x' });
    expect(html).toContain('text-align:center');
    expect(html).toContain('padding:0 0 20px');
  });

  it('draw a muted paragraph in the muted foreground, and one with no tone in the foreground', () => {
    expect(render('paragraph', { tone: 'muted' }, { text: 'x' }).html).toContain('color:#63636D');
    expect(render('paragraph', { tone: 'default' }, { text: 'x' }).html).toContain('color:#09090B');
    expect(render('paragraph', {}, { text: 'x' }).html).toContain('color:#09090B');
  });

  it('refuse a tone the paragraph does not draw, and read a stored one leniently', () => {
    expect(defaultBlocks.paragraph.attributes.safeParse({ tone: 'loud' }).success).toBe(false);
    expect(render('paragraph', { tone: 'loud' }, { text: 'x' }).html).toContain('color:#09090B');
  });

  it('render a button in the primary colours and radius, its href from the url variable', () => {
    const { html, text } = render(
      'button',
      {},
      { label: 'Verify email', href: '{{verify_url}}' },
      { verify_url: 'https://x.test/v?a=1&b=2' },
      { verify_url: 'url' },
    );
    expect(html).toContain('href="https://x.test/v?a=1&amp;b=2"');
    expect(html).toContain('background:#007A55');
    expect(html).toContain('color:#ECFDF5');
    expect(html).toContain('border-radius:10px');
    expect(html).toContain('display:inline-block');
    expect(text).toBe('Verify email: https://x.test/v?a=1&b=2\n\n');
  });

  it('stretch a full-width button', () => {
    const { html } = render(
      'button',
      { width: 'full' },
      { label: 'Go', href: '{{u}}' },
      { u: 'https://x.test' },
      { u: 'url' },
    );
    expect(html).toContain('display:block');
  });

  it('render a code block large and letter-spaced, filling its value', () => {
    const { html, text } = render('code', {}, { code: '{{code}}' }, { code: '482 913' });
    expect(html).toContain('letter-spacing:4px');
    expect(html).toContain('482 913');
    expect(text).toBe('482 913\n\n');
  });

  it('render a list, one item per text line', () => {
    const { html, text } = render('list', {}, { items: ['One', 'Two {{n}}'] }, { n: '2' });
    expect(html).toContain('<li>One</li><li>Two 2</li>');
    expect(text).toBe('- One\n- Two 2\n\n');
  });

  it('render a callout boxed in the muted colour with a primary edge', () => {
    const { html } = render('callout', {}, { text: 'Road closed' });
    expect(html).toContain('background:#F4F4F5');
    expect(html).toContain('border-left:4px solid #007A55');
  });

  it('render a divider as a rule in the border colour and a blank text line', () => {
    expect(render('divider', {}, {})).toMatchObject({ text: '\n' });
    expect(render('divider', {}, {}).html).toContain('border-top:1px solid #E4E4E7');
  });

  it("render a columns block's lanes at the ratio's own weights", () => {
    const lanes = [
      { html: '<tr><td>L</td></tr>', text: 'L\n' },
      { html: '<tr><td>R</td></tr>', text: 'R\n' },
    ];
    const { html, text } = render('columns', { ratio: [2, 1] }, {}, {}, {}, lanes);
    expect(html).toContain('width="67%"');
    expect(html).toContain('width="33%"');
    expect(text).toBe('L\nR\n');
  });

  it('render nothing for a columns block whose ratio cannot be read', () => {
    expect(render('columns', { ratio: 'x' }, {})).toMatchObject({ html: '', text: '' });
  });

  it('print an html block as written, escaping only its value, and strip its tags for the text arm', () => {
    const { html, text } = render('html', {}, { html: '<p class="x">Hi {{name}}</p>' }, { name: '<b>' });
    expect(html).toContain('<p class="x">Hi &lt;b&gt;</p>');
    expect(text).toBe('Hi <b>\n\n');
  });

  it('degrade content it cannot read to empty rather than throw', () => {
    expect(() => render('paragraph', {}, { text: 42 })).not.toThrow();
    expect(render('list', {}, null).text).toBe('\n\n');
  });

  it('refuse, on a write, an attribute another type owns', () => {
    expect(defaultBlocks.paragraph.attributes.safeParse({ width: 'full' }).success).toBe(false);
    expect(defaultBlocks.button.attributes.safeParse({ width: 'full' }).success).toBe(true);
  });

  it('accept, on a write, the empty attributes every stored block has today', () => {
    for (const type of ['paragraph', 'button', 'code', 'list', 'callout', 'divider', 'html'] as const) {
      expect(defaultBlocks[type].attributes.safeParse({}).success).toBe(true);
    }
  });

  it('require a columns ratio of two to four weights of at most twelve', () => {
    const ratio = (value: unknown): boolean => defaultBlocks.columns.attributes.safeParse({ ratio: value }).success;
    expect(ratio([1, 1])).toBe(true);
    expect(ratio([1])).toBe(false);
    expect(ratio([1, 1, 1, 1, 1])).toBe(false);
    expect(ratio([13, 1])).toBe(false);
    expect(defaultBlocks.columns.attributes.safeParse({}).success).toBe(false);
  });

  it("translate a button's label and copy its href", async () => {
    const translated = await defaultBlocks.button.translate({ label: 'Verify', href: '{{u}}' }, async (s) => `[${s}]`);
    expect(translated).toEqual({ label: '[Verify]', href: '{{u}}' });
  });

  it('translate each list item in order', async () => {
    const seen: string[] = [];
    await defaultBlocks.list.translate({ items: ['a', 'b'] }, async (s) => {
      seen.push(s);
      return s;
    });
    expect(seen).toEqual(['a', 'b']);
  });

  it('copy a code block and an html block, which hold no sentence', async () => {
    const never = async (): Promise<string> => {
      throw new Error('translated');
    };
    await expect(defaultBlocks.code.translate({ code: '{{c}}' }, never)).resolves.toEqual({ code: '{{c}}' });
    await expect(defaultBlocks.html.translate({ html: '<p>x</p>' }, never)).resolves.toEqual({ html: '<p>x</p>' });
  });

  it('hold text in every type but a divider and a columns block', () => {
    const holding = Object.values(defaultBlocks)
      .filter((definition) => definition.holdsText)
      .map((definition) => definition.type);
    expect(holding.sort()).toEqual(['button', 'callout', 'code', 'html', 'list', 'paragraph']);
  });

  it('mark body text, a button and each lane for the layout to resize on a narrow screen', () => {
    expect(render('paragraph', {}, { text: 'Hi' }).html).toContain('class="zx-text"');
    expect(render('callout', {}, { text: 'Hi' }).html).toContain('class="zx-text"');
    expect(render('list', {}, { items: ['a'] }).html).toContain('class="zx-text"');
    expect(render('button', {}, { label: 'Go', href: '{{u}}' }, { u: 'https://x.test' }, { u: 'url' }).html).toContain(
      'class="zx-button"',
    );
    const lanes = [
      { html: '<tr><td>L</td></tr>', text: 'L\n' },
      { html: '<tr><td>R</td></tr>', text: 'R\n' },
    ];
    expect(render('columns', { ratio: [1, 1] }, {}, {}, {}, lanes).html.match(/class="zx-lane"/g)).toHaveLength(2);
  });
});

describe('text in the footer region', () => {
  const renderer = createEmailRenderer({ theme: FIXTURE_THEME });
  const footerHtml = (block: EmailBlock): string =>
    renderer.render({
      blocks: [],
      subject: 's',
      preheader: null,
      locale: 'en',
      variables: {},
      variableTypes: {},
      layoutProps: { ...FIXTURE_LAYOUT_PROPS, footer: [] },
      regions: { footer: { blocks: [block], variables: {}, variableTypes: {} } },
    }).html;

  it.each([
    { id: 'p', type: 'paragraph', attributes: {}, content: { text: 'Foot' } },
    { id: 'l', type: 'list', attributes: {}, content: { items: ['Foot'] } },
    { id: 'c', type: 'callout', attributes: {}, content: { text: 'Foot' } },
  ])('draws a $type 12px over 17px in the muted foreground, with no phone resize', (block) => {
    const html = footerHtml(block);
    expect(html).toContain('font-size:12px;line-height:17px;color:#63636D;');
    expect(html).not.toContain('class="zx-text"');
  });

  it('draws a paragraph in a footer lane at the footer size', () => {
    const html = footerHtml({
      id: 'cols',
      type: 'columns',
      attributes: { ratio: [1, 1] },
      content: {},
      lanes: [[{ id: 'a', type: 'paragraph', attributes: {}, content: { text: 'Left' } }], []],
    });
    expect(html).toContain('font-size:12px;line-height:17px;color:#63636D;');
    expect(html).not.toContain('class="zx-text"');
  });

  it('keeps a muted paragraph muted in the body, at the body size', () => {
    const html = renderer.render({
      blocks: [{ id: 'p', type: 'paragraph', attributes: { tone: 'muted' }, content: { text: 'Body' } }],
      subject: 's',
      preheader: null,
      locale: 'en',
      variables: {},
      variableTypes: {},
      layoutProps: FIXTURE_LAYOUT_PROPS,
    }).html;
    expect(html).toContain('font-size:14px;line-height:20px;color:#63636D;');
    expect(html).toContain('class="zx-text"');
  });
});

describe('inline markup on write', () => {
  const renderer = createEmailRenderer({ theme: FIXTURE_THEME });

  it('refuses malformed markup on write, in a paragraph, a callout and a list item', () => {
    expect(renderer.contentOf('paragraph', { text: '**a' })).toBeNull();
    expect(renderer.contentOf('callout', { text: '**a' })).toBeNull();
    expect(renderer.contentOf('list', { items: ['fine', '**a'] })).toBeNull();
    expect(renderer.contentOf('paragraph', { text: '{{a\\_b}}' })).toBeNull();
    expect(renderer.contentOf('paragraph', { text: '**a**' })).not.toBeNull();
  });

  it('keeps a button label plain', () => {
    expect(renderer.contentOf('button', { label: '**a', href: '{{u}}' })).not.toBeNull();
  });
});
