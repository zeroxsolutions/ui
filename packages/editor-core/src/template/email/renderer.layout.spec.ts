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
      section('s1', { width: 'wide', padding: 'none' }, [[image('w', {})]]),
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

  it('never draws an image wider than the width it sits in', () => {
    expect(widths(html([image('a', {}), image('b', { width: 900 })]))).toEqual([566, 566]);
    expect(widths(html([section('s', { width: 'wide', padding: 'none' }, [[image('c', {})]])]))).toEqual([598]);
  });

  it('draws an image with no width at the width it sits in: the card, a lane, a padded section', () => {
    expect(widths(html([columns('c', [1, 1], [[image('l', {})], [image('r', {})]])]))).toEqual([275, 283]);
    expect(widths(html([section('s', { padding: 'medium' }, [[image('i', {})]])]))).toEqual([534]);
  });

  it('draws a legacy pixel width as stored, within the width it sits in', () => {
    expect(widths(html([image('a', { width: 48 }), image('b', { width: 1 }), image('c', { width: 200 })]))).toEqual([
      48, 1, 200,
    ]);
    expect(widths(html([columns('c', [1, 1], [[image('l', { width: 200 })], [image('r', { width: 400 })]])]))).toEqual([
      200, 283,
    ]);
    expect(widths(html([section('s', { padding: 'large' }, [[image('i', { width: 540 })]])]))).toEqual([518]);
  });

  it('draws a fraction off the drag step as stored', () => {
    expect(widths(html([image('i', { width: 0.333 })]))).toEqual([188]);
  });

  it('draws a hero and a card inside a padded section at the section width', () => {
    const feature = { image: 'https://x.test/h.png', alt: 'A bay', heading: 'Hi', text: 'Welcome' };
    const drawn = html([
      section('s', { padding: 'medium' }, [
        [
          { id: 'h', type: 'hero', attributes: {}, content: feature },
          { id: 'c', type: 'card', attributes: {}, content: feature },
        ],
      ]),
    ]);
    const images = [
      ...drawn.matchAll(/<img [^>]*width="(\d+)" class="zx-image zx-image-fluid zx-(hero|card-block)-image"/g),
    ];
    expect(images.map((m) => [m[2], Number(m[1])])).toEqual([
      ['hero', 534],
      ['card-block', 532],
    ]);
  });

  it('draws table widths that do not make the whole, or of another count, as equal columns', () => {
    const table = (columnWidths: number[]): EmailBlock => ({
      id: 't',
      type: 'table',
      attributes: { columnWidths },
      content: { rows: [['a', 'b']] },
    });
    for (const widths of [
      [0.3, 0.3],
      [0.2, 0.3, 0.5],
    ]) {
      expect(html([table(widths)])).not.toMatch(/<td width="\d+%"/);
    }
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
