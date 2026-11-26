// @vitest-environment node
import { describe, expect, it } from 'vitest';
import type { EmailBlock } from './block.js';
import { FIXTURE_LAYOUT_PROPS } from './fixtures.fixture.js';
import { createEmailRenderer, type RenderEmailInput } from './renderer.js';
import type { DefaultLayoutProps } from './layout.js';
import { DEFAULT_EMAIL_THEME, tint } from './theme.js';

const renderer = createEmailRenderer({ theme: DEFAULT_EMAIL_THEME });

const p = (id: string, text: string, attributes: Record<string, unknown> = {}): EmailBlock => ({
  id,
  type: 'paragraph',
  attributes,
  content: { text },
});
const image = (id: string, attributes: Record<string, unknown>): EmailBlock => ({
  id,
  type: 'image',
  attributes,
  content: { src: 'https://x.test/a.png', alt: 'A bay' },
});
const columns = (id: string, ratio: number[], lanes: EmailBlock[][], attributes = {}): EmailBlock => ({
  id,
  type: 'columns',
  attributes: { ratio, ...attributes },
  content: {},
  lanes,
});
const section = (id: string, attributes: Record<string, unknown>, lanes: EmailBlock[][]): EmailBlock => ({
  id,
  type: 'section',
  attributes,
  content: {},
  lanes,
});

function input(
  blocks: readonly EmailBlock[],
  overrides: Partial<RenderEmailInput<DefaultLayoutProps>> = {},
): RenderEmailInput<DefaultLayoutProps> {
  return {
    blocks,
    subject: 'Kitchen sink',
    preheader: 'Every block',
    locale: 'en',
    variables: { name: 'Lan', u: 'https://example.com/a' },
    variableTypes: { name: 'string', u: 'url' },
    layoutProps: FIXTURE_LAYOUT_PROPS,
    ...overrides,
  };
}

/** Every default block with every attribute it took before layout, in the body and both regions. */
const KITCHEN_SINK: readonly EmailBlock[] = [
  p('p1', 'Hi {{name}}, **bold** _italic_ and [a link]({{u}}).'),
  p('p2', 'Muted, centred, large gap.', { tone: 'muted', align: 'center', spaceAfter: 'large' }),
  p('p3', 'Right, small gap.', { align: 'right', spaceAfter: 'small' }),
  { id: 'h1', type: 'heading', attributes: { level: 1, align: 'center' }, content: { text: 'Heading **one**' } },
  { id: 'q1', type: 'quote', attributes: {}, content: { text: 'A quote from {{name}}' } },
  { id: 'b1', type: 'button', attributes: {}, content: { label: 'Inline button', href: '{{u}}' } },
  { id: 'b2', type: 'button', attributes: { width: 'full' }, content: { label: 'Full button', href: '{{u}}' } },
  { id: 'k1', type: 'code', attributes: { align: 'center' }, content: { code: '482 913' } },
  { id: 'l1', type: 'list', attributes: {}, content: { items: ['One **bold**', 'Two [link]({{u}})'] } },
  { id: 'c1', type: 'callout', attributes: { align: 'center' }, content: { text: 'A callout with **marks**.' } },
  { id: 'd1', type: 'divider', attributes: { spaceAfter: 'large' }, content: {} },
  image('i1', { width: 300, align: 'center' }),
  image('i2', {}),
  {
    id: 't1',
    type: 'table',
    attributes: { header: true },
    content: {
      rows: [
        ['Day', 'Place'],
        ['1', '{{name}}'],
      ],
    },
  },
  columns('cols', [2, 1, 1], [[p('a', 'Left lane'), image('li', {})], [p('b', 'Middle')], [p('c', 'Right')]]),
  { id: 'html', type: 'html', attributes: {}, content: { html: '<p style="margin:0">Raw <b>html</b></p>' } },
];

describe('the renderer with no layout', () => {
  it('renders an email with no layout attribute byte-identical to the html before layout', async () => {
    const region = {
      blocks: [p('r1', 'Region line'), columns('rc', [1, 1], [[p('x', 'L')], [p('y', 'R')]])],
      variables: {},
      variableTypes: {},
    };
    const { html } = renderer.render(input(KITCHEN_SINK, { regions: { header: region, footer: region } }));
    await expect(html).toMatchFileSnapshot('./__snapshots__/kitchen-sink.html.snap');
  });
});

describe('layout in the email', () => {
  const html = (blocks: readonly EmailBlock[]): string => renderer.render(input(blocks)).html;
  /** The drawn width of each image block, the layout's logo left out. */
  const widths = (markup: string): number[] =>
    [...markup.matchAll(/<img [^>]*width="(\d+)" class="zx-image zx-image-fluid"/g)].map((m) => Number(m[1]));

  it('draws a section as a table row on its background, inside its padding', () => {
    const drawn = html([section('s1', { background: 'teal', padding: 'large' }, [[p('in', 'Inside')]])]);
    const surface = tint(DEFAULT_EMAIL_THEME.colors.hues!.teal!, DEFAULT_EMAIL_THEME.colors.background, 0.15);
    expect(drawn).toMatch(
      new RegExp(
        `<td class="zx-section zx-section-bg-teal zx-section-pad-large" style="[^"]*background:${surface};[^"]*padding:24px;`,
      ),
    );
    expect(drawn).toContain('Inside');
  });

  it("reaches the card's inner edges with a wide section, and no further", () => {
    const drawn = html([
      p('a', 'Before'),
      section('s1', { width: 'wide', padding: 'none' }, [[image('w', { width: 1 })]]),
      p('b', 'After'),
    ]);
    expect(drawn).toContain('<td class="zx-inner zx-inner-flush-bottom"');
    expect(drawn).toContain('<td class="zx-inner-wide"');
    expect(drawn).toContain('<td class="zx-inner zx-inner-flush-top"');
    const tables = [...drawn.matchAll(/width="(\d+)"/g)].map((m) => Number(m[1])).filter((width) => width !== 600);
    expect(Math.max(...tables)).toBeLessThanOrEqual(598);
  });

  it('draws an image at 0.5 at 283px at the top and at half its lane in a lane', () => {
    expect(widths(html([image('i', { width: 0.5 })]))).toEqual([283]);
    expect(widths(html([columns('c', [1, 1], [[image('i', { width: 0.5 })], [p('r', 'R')]])]))).toEqual([138]);
  });

  it('never draws an image wider than 566px', () => {
    expect(widths(html([image('a', { width: 1 }), image('b', { width: 900 })]))).toEqual([566, 566]);
    expect(widths(html([section('s', { width: 'wide', padding: 'none' }, [[image('c', { width: 1 })]])]))).toEqual([
      566,
    ]);
  });

  it('sets the vertical alignment on each lane cell', () => {
    const drawn = html([columns('c', [1, 1], [[p('l', 'L')], [p('r', 'R')]], { valign: 'center' })]);
    expect(drawn.match(/width="50%" valign="middle" class="[^"]*zx-valign-center/g)).toHaveLength(2);
  });

  it('draws table columnWidths as width percentages', () => {
    const drawn = html([
      {
        id: 't',
        type: 'table',
        attributes: { columnWidths: [0.3, 0.7] },
        content: {
          rows: [
            ['a', 'b'],
            ['c', 'd'],
          ],
        },
      },
    ]);
    expect(drawn.match(/<td width="30%"/g)).toHaveLength(1);
    expect(drawn.match(/<td width="70%"/g)).toHaveLength(1);
  });

  it('draws a colour run as a span of its class, repainted in dark mode', () => {
    const { html: drawn } = renderer.render(input([p('c', 'a {color=red}b{/color} {bg=amber}c{/bg}')]));
    const { colors, dark } = DEFAULT_EMAIL_THEME;
    expect(drawn).toContain(`<span class="zx-color-red" style="color:${colors.hues!.red};">b</span>`);
    expect(drawn).toContain(
      `<span class="zx-bg-amber" style="background:${tint(colors.hues!.amber!, colors.background, 0.15)};">c</span>`,
    );
    expect(drawn).toContain(`.zx-color-red{color:${dark!.hues!.red} !important;}`);
    expect(drawn).toContain(`.zx-bg-amber{background:${tint(dark!.hues!.amber!, dark!.background, 0.15)} !important;}`);
    expect(html([p('plain', 'no colour')])).not.toContain('zx-color-');
  });

  it('gives lead and small paragraphs their class and size', () => {
    expect(html([p('l', 'Lead', { size: 'lead' })])).toMatch(
      /class="zx-text zx-tone-default zx-text-lead" style="[^"]*font-size:18px;/,
    );
    expect(html([p('s', 'Small', { size: 'small' })])).toMatch(
      /class="zx-text zx-tone-default zx-text-small" style="[^"]*font-size:12px;/,
    );
  });

  it('spaces a block before and after it by its tokens', () => {
    expect(html([p('n', 'x', { spaceBefore: 'none', spaceAfter: 'none' })])).toContain(
      '<td class="zx-block zx-block-paragraph zx-align-left zx-space-none zx-space-before-none" style="text-align:left;padding:0;padding-top:0;">',
    );
    expect(html([p('l', 'x', { spaceBefore: 'large' })])).toContain(
      'class="zx-block zx-block-paragraph zx-align-left zx-space-medium zx-space-before-large" style="text-align:left;padding:0 0 10px;padding-top:20px;"',
    );
  });

  it('reports a section in a lane or in a section as nested too deep and draws nothing of it', () => {
    const inLane = renderer.render(
      input([columns('c', [1, 1], [[section('deep', {}, [[p('x', 'lost')]])], [p('r', 'kept')]])]),
    );
    expect(inLane.problems).toContainEqual({ blockId: 'deep', kind: 'block-nested-too-deep' });
    expect(inLane.text).not.toContain('lost');
    const inSection = renderer.render(
      input([section('s', {}, [[section('deep', {}, [[p('x', 'lost')]]), p('y', 'kept')]])]),
    );
    expect(inSection.problems).toContainEqual({ blockId: 'deep', kind: 'block-nested-too-deep' });
    expect(inSection.text).toContain('kept');
    expect(inSection.text).not.toContain('lost');
  });
});
