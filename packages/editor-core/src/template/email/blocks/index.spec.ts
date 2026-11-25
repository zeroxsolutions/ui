// @vitest-environment node
import { describe, expect, it } from 'vitest';
import type { EmailBlock, RenderProblem } from '../block.js';
import { FIXTURE_LAYOUT_PROPS, FIXTURE_THEME } from '../fixtures.fixture.js';
import { createEmailRenderer } from '../renderer.js';
import { defaultBlocks, type DefaultBlockType } from './index.js';

interface Rendered {
  /** The body's markup alone, from the body region's table on. */
  readonly html: string;
  readonly text: string;
  readonly problems: readonly RenderProblem[];
}

const renderer = createEmailRenderer({ theme: FIXTURE_THEME });

/** One block of `type` rendered in an email with no footer lines, so the body is all the text there is. */
function render(
  type: DefaultBlockType,
  attributes: unknown,
  content: unknown,
  variables: Record<string, string> = {},
  variableTypes: Record<string, 'string' | 'url'> = {},
  lanes?: EmailBlock[][],
): Rendered {
  const rendered = renderer.render({
    blocks: [{ id: 'b1', type, attributes, content, ...(lanes === undefined ? {} : { lanes }) }],
    subject: 's',
    preheader: null,
    locale: 'en',
    variables,
    variableTypes,
    layoutProps: { ...FIXTURE_LAYOUT_PROPS, footer: [] },
  });
  const body = rendered.html.indexOf('zx-region-body');
  return { html: body < 0 ? '' : rendered.html.slice(body), text: rendered.text, problems: rendered.problems };
}

const paragraph = (id: string, text: string): EmailBlock => ({
  id,
  type: 'paragraph',
  attributes: {},
  content: { text },
});

/** The inline style of the first element whose class attribute starts with `classes`. */
function styleOf(html: string, classes: string): string {
  return new RegExp(`class="${classes}[^"]*" style="([^"]*)"`).exec(html)?.[1] ?? '';
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
    expect(text).toBe('Hi <Mai>,');
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
    const style = styleOf(html, 'zx-button');
    expect(style).toContain('background:#007A55');
    expect(style).toContain('color:#ECFDF5');
    expect(style).toContain('border-radius:10px');
    expect(style).toContain('display:inline-block');
    expect(text).toBe('Verify email: https://x.test/v?a=1&b=2');
  });

  it('stretch a full-width button', () => {
    const { html } = render(
      'button',
      { width: 'full' },
      { label: 'Go', href: '{{u}}' },
      { u: 'https://x.test' },
      { u: 'url' },
    );
    expect(styleOf(html, 'zx-button')).toContain('display:block');
    expect(styleOf(html, 'zx-button')).toContain('text-align:center');
  });

  it('render a code block large and letter-spaced, filling its value', () => {
    const { html, text } = render('code', {}, { code: '{{code}}' }, { code: '482 913' });
    expect(html).toContain('letter-spacing:4px');
    expect(html).toContain('482 913');
    expect(text).toBe('482 913');
  });

  it('render a list, one item per text line', () => {
    const { html, text } = render('list', {}, { items: ['One', 'Two {{n}}'] }, { n: '2' });
    expect(html).toContain('<li>One</li><li>Two 2</li>');
    expect(text).toBe('- One\n- Two 2');
  });

  it('render a callout boxed in the muted colour inside a border all round, with no accent edge', () => {
    const { html } = render('callout', {}, { text: 'Road closed' });
    expect(html).toContain('background:#F4F4F5;border:1px solid #E4E4E7;border-radius:10px;');
    expect(html).not.toContain('border-left');
  });

  it('render a divider as a rule in the border colour and a blank text line', () => {
    expect(render('divider', {}, {}).text).toBe('');
    expect(styleOf(render('divider', {}, {}).html, 'zx-divider')).toContain('border-top:1px solid #E4E4E7');
  });

  it("render a columns block's lanes at the ratio's own weights", () => {
    const lanes = [[paragraph('l', 'L')], [paragraph('r', 'R')]];
    const { html, text } = render('columns', { ratio: [2, 1] }, {}, {}, {}, lanes);
    expect(html).toContain('width="67%"');
    expect(html).toContain('width="33%"');
    expect(text).toBe('L\n\nR');
  });

  it('render nothing for a columns block whose ratio cannot be read', () => {
    const { html, text } = render('columns', { ratio: 'x' }, {});
    expect(html).not.toContain('zx-lane');
    expect(html).not.toContain('zx-block');
    expect(text).toBe('');
  });

  it('print an html block as written, escaping only its value, and strip its tags for the text arm', () => {
    const { html, text } = render('html', {}, { html: '<p class="x">Hi {{name}}</p>' }, { name: '<b>' });
    expect(html).toContain('<p class="x">Hi &lt;b&gt;</p>');
    expect(text).toBe('Hi <b>');
  });

  it('degrade content it cannot read to empty rather than throw', () => {
    expect(() => render('paragraph', {}, { text: 42 })).not.toThrow();
    expect(render('list', {}, null).text).toBe('');
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

  it('hold text in every type but a divider, a columns block and a spacer', () => {
    const holding = Object.values(defaultBlocks)
      .filter((definition) => definition.holdsText)
      .map((definition) => definition.type);
    expect(holding.sort()).toEqual([
      'button',
      'callout',
      'card',
      'code',
      'heading',
      'hero',
      'html',
      'image',
      'legalFooter',
      'list',
      'paragraph',
      'quote',
      'socialLinks',
      'table',
    ]);
  });

  it('mark body text, a button and each lane for the layout to resize on a narrow screen', () => {
    expect(render('paragraph', {}, { text: 'Hi' }).html).toContain('class="zx-text');
    expect(render('callout', {}, { text: 'Hi' }).html).toContain('class="zx-text');
    expect(render('list', {}, { items: ['a'] }).html).toContain('class="zx-text');
    expect(render('button', {}, { label: 'Go', href: '{{u}}' }, { u: 'https://x.test' }, { u: 'url' }).html).toContain(
      'class="zx-button',
    );
    const lanes = [[paragraph('l', 'L')], [paragraph('r', 'R')]];
    expect(render('columns', { ratio: [1, 1] }, {}, {}, {}, lanes).html.match(/class="zx-lane/g)).toHaveLength(2);
  });

  it('give each block its own row, named for its type and its gap and alignment', () => {
    expect(render('paragraph', { align: 'center', spaceAfter: 'small' }, { text: 'x' }).html).toContain(
      '<td class="zx-block zx-block-paragraph zx-align-center zx-space-small" style="text-align:center;padding:0 0 6px;">',
    );
    expect(render('divider', {}, {}).html).toContain('class="zx-block zx-block-divider zx-align-left zx-space-medium"');
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
  ])('draws a $type 12px over 17px in the muted foreground, and keeps it there on a phone', (block) => {
    const html = footerHtml(block);
    expect(html).toContain('font-size:12px;line-height:17px;color:#63636D;');
    expect(html).toContain('.zx-region-footer .zx-text{font-size:12px !important;line-height:17px !important;}');
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
    expect(html).toContain('class="zx-text zx-tone-muted"');
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

describe('a heading', () => {
  it('draws at level 2 unless it names another, its markup escaped', () => {
    expect(render('heading', {}, { text: '**Hi** <b>' }).html).toMatch(
      /<h2 class="zx-heading zx-heading-2"[^>]*><strong>Hi<\/strong> &lt;b&gt;<\/h2>/,
    );
    expect(render('heading', { level: 1 }, { text: 'Hi' }).html).toContain('<h1 class="zx-heading zx-heading-1"');
    expect(render('heading', { level: 3 }, { text: 'Hi' }).text).toBe('Hi');
  });

  it('takes levels 1 to 3 on write, and draws another stored level at the default', () => {
    expect(renderer.attributesOf('heading', { level: 4 })).toBeNull();
    expect(renderer.attributesOf('heading', { level: 3, align: 'center' })).toEqual({ level: 3, align: 'center' });
    expect(render('heading', { level: 6 }, { text: 'Hi' }).html).toContain('<h2 ');
  });
});

describe('a quote', () => {
  it('draws its text muted beside a rule, and as its text on the text arm', () => {
    const { html, text } = render('quote', {}, { text: '_Lovely_ stay' });
    expect(html).toMatch(/<td class="zx-quote" style="border-left:3px solid #E4E4E7;padding:0 0 0 12px;">/);
    expect(html).toContain('class="zx-text zx-tone-muted"');
    expect(text).toBe('Lovely stay');
  });
});

describe('an image', () => {
  const src = 'https://x.test/a.png';

  it('draws a hosted image at its width, shrinking to a narrow screen, linked and captioned', () => {
    const { html, text } = render(
      'image',
      { width: 300 },
      { src, alt: 'A bay', caption: 'Morning', href: '{{u}}' },
      { u: 'https://x.test/go' },
      { u: 'url' },
    );
    expect(html).toContain(
      '<a href="https://x.test/go" class="zx-image-link"><img src="https://x.test/a.png" alt="A bay" width="300" class="zx-image zx-image-fluid" style="display:block;border:0;height:auto;max-width:100%;" /></a>',
    );
    expect(html).toMatch(/class="zx-text zx-caption zx-tone-muted"[^>]*>Morning</);
    expect(text).toBe('A bay: https://x.test/go\n\nMorning');
  });

  it("draws at the card's content width by default and at most, and centred when its row is", () => {
    const { html } = render('image', { align: 'center' }, { src, alt: 'A bay' });
    expect(html).toContain('width="566"');
    expect(render('image', { width: 600 }, { src, alt: 'A bay' }).html).toContain('width="566"');
    expect(render('image', { width: 200 }, { src, alt: 'A bay' }).html).toContain('width="200"');
    expect(html).toMatch(/class="zx-image zx-image-fluid" style="[^"]*margin:0 auto;/);
  });

  it.each(['javascript:alert(1)', 'data:image/png;base64,AAAA', '//x.test/a.png'])(
    'draws nothing for the source %s',
    (unsafe) => {
      expect(render('image', {}, { src: unsafe, alt: 'x' }).html).not.toContain('<img');
    },
  );

  it('refuses on write a source that is not https or a variable, an empty alt, and a width past the card', () => {
    expect(renderer.contentOf('image', { src: 'http://x.test/a.png', alt: 'a' })).toBeNull();
    expect(renderer.contentOf('image', { src: 'javascript:x', alt: 'a' })).toBeNull();
    expect(renderer.contentOf('image', { src, alt: ' ' })).toBeNull();
    expect(renderer.contentOf('image', { src, alt: 'a', href: 'javascript:x' })).toBeNull();
    expect(renderer.attributesOf('image', { width: 567 })).toBeNull();
    expect(renderer.attributesOf('image', { width: 566 })).not.toBeNull();
    expect(renderer.contentOf('image', { src: '{{banner}}', alt: 'a', href: 'mailto:a@b.c' })).not.toBeNull();
  });
});

describe('a table', () => {
  it('draws its first row as headers where asked, each cell inline markup, borders on each cell', () => {
    const { html, text } = render(
      'table',
      { header: true },
      {
        rows: [
          ['Day', 'Place'],
          ['1', '**{{p}}**'],
        ],
      },
      { p: 'Hue' },
    );
    expect(html).toMatch(/<th scope="col" align="left" valign="top" class="zx-table-cell zx-table-head"/);
    expect(html).toContain('<strong>Hue</strong></td>');
    expect(html).toContain('border:1px solid #E4E4E7;');
    expect(html).not.toMatch(/<table class="zx-table"[^>]*role="presentation"/);
    expect(text).toBe('Day | Place\n1 | Hue');
  });

  it('pads a stored row to the widest and keeps to its bounds when drawn', () => {
    const rows = Array.from({ length: 25 }, (_, index) => (index === 0 ? ['a', 'b', 'c', 'd', 'e', 'f', 'g'] : ['x']));
    const { html } = render('table', {}, { rows });
    expect(html.match(/<tr><td align="left"/g)?.length).toBe(20);
    expect(html.match(/<td align="left" valign="top" class="zx-table-cell"/g)?.length).toBe(20 * 6);
  });

  it('refuses on write a table past 20 rows or 6 columns, rows of two widths, and malformed markup', () => {
    expect(renderer.contentOf('table', { rows: Array.from({ length: 21 }, () => ['a']) })).toBeNull();
    expect(renderer.contentOf('table', { rows: [['a', 'b', 'c', 'd', 'e', 'f', 'g']] })).toBeNull();
    expect(renderer.contentOf('table', { rows: [['a', 'b'], ['c']] })).toBeNull();
    expect(renderer.contentOf('table', { rows: [['**a']] })).toBeNull();
    expect(
      renderer.contentOf('table', {
        rows: [
          ['a', ''],
          ['', 'd'],
        ],
      }),
    ).not.toBeNull();
  });
});

describe('a spacer', () => {
  it('draws empty space of its height, medium by default', () => {
    expect(render('spacer', { height: 'large' }, {}).html).toMatch(/height:32px/);
    expect(render('spacer', {}, {}).html).toMatch(/height:16px/);
    expect(renderer.attributesOf('spacer', { height: 'huge' })).toBeNull();
  });
});

describe('social links', () => {
  const link = (label: string, href = 'https://x.test/p') => ({ label, icon: 'https://x.test/i.png', href });

  it('draws a linked icon per link, its label the alt text, and a line per link on the text arm', () => {
    const { html, text } = render(
      'socialLinks',
      { align: 'center', size: 'small' },
      { links: [link('{{b}} on X', 'https://x.test/x'), link('Blog', 'https://x.test/blog')] },
      { b: 'Acme' },
    );
    expect(html).toContain('<a href="https://x.test/x"');
    expect(html).toMatch(/<img src="https:\/\/x.test\/i.png" alt="Acme on X" width="24" height="24"/);
    expect(html).toMatch(/align="center"/);
    expect(text).toBe('Acme on X: https://x.test/x\nBlog: https://x.test/blog');
  });

  it('refuses on write no links, more than 8, and a link or icon a client would not open', () => {
    expect(renderer.contentOf('socialLinks', { links: [] })).toBeNull();
    expect(renderer.contentOf('socialLinks', { links: Array.from({ length: 9 }, () => link('a')) })).toBeNull();
    expect(renderer.contentOf('socialLinks', { links: [link('a', 'javascript:alert(1)')] })).toBeNull();
    expect(renderer.contentOf('socialLinks', { links: [{ ...link('a'), icon: 'data:x' }] })).toBeNull();
    expect(renderer.contentOf('socialLinks', { links: [link(' ')] })).toBeNull();
    expect(renderer.contentOf('socialLinks', { links: Array.from({ length: 8 }, () => link('a')) })).not.toBeNull();
  });

  it('draws no link a client would not open', () => {
    expect(render('socialLinks', {}, { links: [link('a', 'javascript:alert(1)')] }).html).not.toContain('javascript');
  });
});

const feature = {
  image: 'https://x.test/h.png',
  alt: 'A bay',
  heading: 'Hello {{n}}',
  text: 'Come **soon**',
  buttonLabel: 'Go',
  buttonHref: 'https://x.test/go',
};

describe.each([
  ['hero', 1, 566],
  ['card', 2, 564],
] as const)('a %s', (type, level, width) => {
  it('draws its image, heading, text and button, the heading escaped', () => {
    const { html, text } = render(type, {}, { ...feature, heading: 'Hello <b>{{n}}</b>' }, { n: 'Ann' });
    expect(html).toMatch(new RegExp(`<img src="https://x.test/h.png" alt="A bay" width="${width}"`));
    expect(html).toContain(`<h${level}`);
    expect(html).toContain('Hello &lt;b&gt;Ann&lt;/b&gt;');
    expect(html).toContain('<strong>soon</strong>');
    expect(html).toMatch(/<a href="https:\/\/x.test\/go"[^>]*>Go<\/a>/);
    expect(text).toContain('Go: https://x.test/go');
  });

  it('draws no button where its label or link is empty', () => {
    expect(render(type, {}, { ...feature, buttonLabel: '', buttonHref: '' }).html).not.toContain('zx-button');
    expect(render(type, {}, { ...feature, buttonHref: '' }).html).not.toContain('zx-button');
  });

  it('refuses on write a button label without its link, a missing image, alt or heading, and an unsafe link', () => {
    expect(renderer.contentOf(type, feature)).not.toBeNull();
    expect(renderer.contentOf(type, { ...feature, buttonLabel: '', buttonHref: '' })).not.toBeNull();
    expect(renderer.contentOf(type, { ...feature, buttonHref: '' })).toBeNull();
    expect(renderer.contentOf(type, { ...feature, buttonLabel: ' ' })).toBeNull();
    expect(renderer.contentOf(type, { ...feature, alt: '' })).toBeNull();
    expect(renderer.contentOf(type, { ...feature, heading: '' })).toBeNull();
    expect(renderer.contentOf(type, { ...feature, image: 'javascript:x' })).toBeNull();
    expect(renderer.contentOf(type, { ...feature, buttonHref: 'javascript:x' })).toBeNull();
  });
});

describe('a card', () => {
  it('frames its content in a bordered box', () => {
    const { html } = render('card', {}, feature);
    expect(html).toMatch(/class="zx-card-block" style="[^"]*border:1px solid #E4E4E7;/);
    // Its image's top corners follow the frame's, which are rounded.
    expect(html).toMatch(
      /class="zx-image zx-image-fluid zx-card-block-image" style="[^"]*border-radius:10px 10px 0 0;/,
    );
  });
});

describe('a legal footer', () => {
  const footer = {
    sender: 'You joined {{b}}.',
    reason: 'You asked for our news.',
    address: '1 Road, Town',
    unsubscribe: '{{u}}',
    unsubscribeLabel: '',
  };

  it('draws who sends it and why, the address and an unsubscribe link, muted and small', () => {
    const { html, text } = render('legalFooter', {}, footer, { b: 'Acme', u: 'https://x.test/u?a=1' }, { u: 'url' });
    expect(html).toContain('You joined Acme.');
    expect(html).toContain('You asked for our news.');
    expect(html).toContain('1 Road, Town');
    expect(html).toMatch(/<a href="https:\/\/x.test\/u\?a=1"[^>]*>Unsubscribe<\/a>/);
    expect(html).toContain('zx-legal-text zx-tone-muted');
    expect(text).toContain('Unsubscribe (https://x.test/u?a=1)');
  });

  it("draws a label it is given, kept plain even where it holds markup or a link's brackets", () => {
    const { html } = render(
      'legalFooter',
      {},
      { ...footer, unsubscribeLabel: '**Stop** [x](y)' },
      { u: 'https://x.test/u' },
      { u: 'url' },
    );
    expect(html).toMatch(/<a href="https:\/\/x.test\/u"[^>]*>\*\*Stop\*\* \[x\]\(y\)<\/a>/);
  });

  it('refuses on write no address, no unsubscribe link, or one a client would not open', () => {
    expect(renderer.contentOf('legalFooter', footer)).not.toBeNull();
    expect(renderer.contentOf('legalFooter', { ...footer, address: ' ' })).toBeNull();
    expect(renderer.contentOf('legalFooter', { ...footer, unsubscribe: '' })).toBeNull();
    expect(renderer.contentOf('legalFooter', { ...footer, unsubscribe: 'javascript:x' })).toBeNull();
  });
});
