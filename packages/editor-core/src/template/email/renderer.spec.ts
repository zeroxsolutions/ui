// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { variableTokens } from '../variables/variable-tokens.js';
import { hrefProblem } from '../markup/href.js';
import { markupSamples } from '../markup/inline-markup.fixture.js';
import { parseInlineMarkup } from '../markup/inline-markup.js';
import { defineBlock, type EmailBlock } from './block.js';
import { createRenderContext } from './context.js';
import { FIXTURE_LAYOUT_PROPS, FIXTURE_THEME } from './fixtures.fixture.js';
import { EmailStylesheetInvalid } from './css/stylesheet.js';
import type { DefaultLayoutProps, EmailLayout, LayoutInput } from './layout.js';
import type { EmailNode } from './primitives/nodes.js';
import type { RegionInput } from './region.js';
import {
  BlockTypeCollision,
  createEmailRenderer,
  sameBlockContent,
  type RenderedEmail,
  type RenderEmailInput,
} from './renderer.js';
import { EmailThemeInvalid } from './theme.js';

const itinerary = defineBlock({
  type: 'itinerary',
  attributes: z.object({}).strict(),
  content: z.object({ stops: z.array(z.string().min(1)).min(1) }).strict(),
  readAttributes: () => ({}),
  readContent: (raw) => {
    const parsed = z.object({ stops: z.array(z.string()) }).safeParse(raw);
    return parsed.success ? parsed.data : { stops: [] };
  },
  holdsText: true,
  holdsLanes: false,
  async translate(source, translateOne) {
    return { stops: await Promise.all(source.stops.map(translateOne)) };
  },
  render({ content }, ctx) {
    return {
      html: `<tr><td data-itinerary>${content.stops.map((stop) => ctx.html(stop)).join(' &rarr; ')}</td></tr>`,
      text: `${content.stops.map((stop) => ctx.text(stop)).join(' -> ')}\n\n`,
    };
  },
  sample: { attributes: {}, content: { stops: ['{{from}}', 'Hoi An'] }, variableTypes: { from: 'string' } },
});

const paragraph = (id: string, text: string): EmailBlock => ({
  id,
  type: 'paragraph',
  attributes: {},
  content: { text },
});

function input(
  blocks: readonly EmailBlock[],
  overrides: Partial<RenderEmailInput<DefaultLayoutProps>> = {},
): RenderEmailInput<DefaultLayoutProps> {
  return {
    blocks,
    subject: 'Verify your email',
    preheader: null,
    locale: 'en',
    variables: { name: 'Mai', verify_url: 'https://x.test/v' },
    variableTypes: { name: 'string', verify_url: 'url' },
    layoutProps: FIXTURE_LAYOUT_PROPS,
    ...overrides,
  };
}

describe('createEmailRenderer', () => {
  it('renders around stored blocks and lanes of a shape it cannot read, rather than throwing', () => {
    const renderer = createEmailRenderer({ theme: FIXTURE_THEME });
    const hostile = [
      null,
      paragraph('p1', 'kept'),
      { id: 'c1', type: 'columns', attributes: { ratio: [1, 1] }, content: {}, lanes: 'ab' },
      { id: 'c2', type: 'columns', attributes: { ratio: [1, 1] }, content: {}, lanes: [[null], 'x'] },
    ] as unknown as EmailBlock[];
    const rendered = renderer.render(input(hostile));
    expect(rendered.text).toContain('kept');
  });

  it('level 1: paints the default blocks and layout in the theme it is given', () => {
    const renderer = createEmailRenderer({ theme: FIXTURE_THEME });
    const rendered = renderer.render(
      input([
        paragraph('p1', 'Hi {{name}},'),
        { id: 'b1', type: 'button', attributes: {}, content: { label: 'Verify', href: '{{verify_url}}' } },
      ]),
    );
    expect(rendered.html).toContain('background:#007A55');
    expect(rendered.html).toContain('Hi Mai,');
    expect(rendered.text).toContain('Verify: https://x.test/v');
    expect(rendered.problems).toEqual([]);
  });

  it('refuses a theme a mail client cannot read when it is composed', () => {
    expect(() => createEmailRenderer({ theme: { ...FIXTURE_THEME, radius: -1 } })).toThrow(EmailThemeInvalid);
  });

  it("level 2: replaces one type's render and keeps its write check", () => {
    const renderer = createEmailRenderer({
      theme: FIXTURE_THEME,
      blocks: {
        button: ({ content }, ctx) => ({
          html: `<tr><td data-own>${ctx.html(content.label)}</td></tr>`,
          text: 'own\n',
        }),
      },
    });
    const block: EmailBlock = {
      id: 'b1',
      type: 'button',
      attributes: {},
      content: { label: 'Go', href: '{{verify_url}}' },
    };
    expect(renderer.render(input([block])).html).toContain('<td data-own>Go</td>');
    expect(renderer.contentOf('button', { label: 'Go' })).toBeNull();
  });

  it("level 2: frames the body in the layout it is given, with that layout's props", () => {
    const renderer = createEmailRenderer({
      theme: FIXTURE_THEME,
      layout: ({ body, props, h }: LayoutInput<{ brand: string }>) =>
        h.section({ class: `brand-${props.brand}` }, [h.region('body', body)]),
    });
    const rendered = renderer.render({ ...input([paragraph('p1', 'x')]), layoutProps: { brand: 'own' } });
    expect(rendered.html).toMatch(
      /^<!doctype html><html lang="en"><head>.*<\/head><body class="zx-body"[^>]*><table [^>]*><tr><td class="brand-own">/,
    );
    expect(rendered.html).not.toContain('class="zx-card"');
    expect(rendered.text).toBe('x');
  });

  it('names the change when a layout still returns HTML and text', () => {
    const layout = (() => ({ html: '<p>x</p>', text: 'x' })) as unknown as EmailLayout<DefaultLayoutProps>;
    expect(() => createEmailRenderer({ layout }).render(input([paragraph('p1', 'x')]))).toThrow(/returns primitives/);
  });

  it("level 1: lets a product's rule beat the base sheet's by coming later", () => {
    const renderer = createEmailRenderer({
      theme: FIXTURE_THEME,
      css: [
        '.zx-button{border-radius:0}',
        ':root{--brand:#123456}.zx-block-button .zx-button{background:var(--brand)}',
      ],
    });
    const { html } = renderer.render(
      input([{ id: 'b1', type: 'button', attributes: {}, content: { label: 'Go', href: '{{verify_url}}' } }]),
    );
    const style = /class="zx-button zx-width-inline" style="([^"]*)"/.exec(html)?.[1];
    expect(style).toContain('border-radius:0;');
    expect(style).toContain('background:#123456;');
    expect(style).not.toContain('border-radius:10px');
  });

  it("writes a product's media rule under a class of the element it selects", () => {
    const { html } = createEmailRenderer({ css: '@media (max-width:600px){.zx-callout{padding:8px}}' }).render(
      input([{ id: 'c1', type: 'callout', attributes: {}, content: { text: 'Note' } }]),
    );
    expect(html).toContain('class="zx-callout zx-q0-0"');
    expect(html).toContain('@media (max-width:600px){.zx-q0-0.zx-q0-0.zx-q0-0{padding:8px !important}}</style>');
  });

  it('refuses a stylesheet it cannot inline when it is composed', () => {
    expect(() => createEmailRenderer({ css: ['.ok{}', 'p{color:red}'] })).toThrow(
      new EmailStylesheetInvalid(1, 1, 1, 'selector-refused', 'p'),
    );
  });

  it('draws with the ZUI palette, light and dark, when it is given no theme', () => {
    const { html } = createEmailRenderer().render(input([paragraph('p1', 'x')]));
    expect(html).toContain('color:#09090B;');
    expect(html).toContain('<meta name="color-scheme" content="light dark">');
  });

  it('places the rows a render writes as HTML, unstyled, where the block sits', () => {
    const renderer = createEmailRenderer({
      blocks: { divider: () => ({ html: '<tr><td data-own>own</td></tr>', text: 'own\n\n' }) },
    });
    const { html, text } = renderer.render(
      input([paragraph('p1', 'a'), { id: 'd', type: 'divider', attributes: {}, content: {} }]),
    );
    expect(html).toContain('</td></tr><tr><td data-own>own</td></tr></table>');
    expect(text).toBe('a\n\nown\n\nExample Company Limited, 1 Example Street.\nSent because you created an account.');
  });

  it('level 3: parses, translates and renders a type the defaults do not have', async () => {
    const renderer = createEmailRenderer({ theme: FIXTURE_THEME, extraBlocks: [itinerary] });
    expect(renderer.types).toContain('itinerary');
    expect(renderer.contentOf('itinerary', { stops: ['Hue'] })).toEqual({ stops: ['Hue'] });
    expect(renderer.contentOf('itinerary', { stops: [] })).toBeNull();
    await expect(
      renderer.translateContent('itinerary', { stops: ['a'] }, async (s) => s.toUpperCase()),
    ).resolves.toEqual({
      stops: ['A'],
    });
    const rendered = renderer.render(
      input([{ id: 'i1', type: 'itinerary', attributes: {}, content: { stops: ['Hue', 'Hoi An'] } }]),
    );
    expect(rendered.text).toContain('Hue -> Hoi An');
  });

  it('refuses an extra type that collides with a default or another extra', () => {
    const clash = defineBlock({ ...itinerary, type: 'paragraph' });
    expect(() => createEmailRenderer({ theme: FIXTURE_THEME, extraBlocks: [clash] })).toThrow(
      new BlockTypeCollision('paragraph'),
    );
    expect(() => createEmailRenderer({ theme: FIXTURE_THEME, extraBlocks: [itinerary, itinerary] })).toThrow(
      BlockTypeCollision,
    );
  });

  it('renders a columns block one level deep and skips one nested in a lane', () => {
    const renderer = createEmailRenderer({ theme: FIXTURE_THEME });
    const inner: EmailBlock = {
      id: 'c2',
      type: 'columns',
      attributes: { ratio: [1, 1] },
      content: {},
      lanes: [[paragraph('deep', 'deep')], []],
    };
    const outer: EmailBlock = {
      id: 'c1',
      type: 'columns',
      attributes: { ratio: [1, 1] },
      content: {},
      lanes: [[paragraph('l', 'left')], [inner]],
    };
    const rendered = renderer.render(input([outer]));
    expect(rendered.text).toContain('left');
    expect(rendered.text).not.toContain('deep');
    expect(rendered.problems).toContainEqual({ blockId: 'c2', kind: 'block-nested-too-deep' });
  });

  it('renders the rest of the mail around a type it does not know, and reports it', () => {
    const renderer = createEmailRenderer({ theme: FIXTURE_THEME });
    const rendered = renderer.render(
      input([paragraph('p1', 'kept'), { id: 'x1', type: 'poll', attributes: {}, content: {} }]),
    );
    expect(rendered.text).toContain('kept');
    expect(rendered.problems).toEqual([{ blockId: 'x1', kind: 'unknown-block-type', name: 'poll' }]);
  });

  it('reports a missing value once, though both arms read it', () => {
    const renderer = createEmailRenderer({ theme: FIXTURE_THEME });
    const rendered = renderer.render(input([paragraph('p1', 'Hi {{city}}')]));
    expect(rendered.problems).toEqual([{ blockId: 'p1', kind: 'variable-missing', name: 'city' }]);
  });

  it('fills the subject and preheader on the text arm, and the layout escapes them', () => {
    const renderer = createEmailRenderer({ theme: FIXTURE_THEME });
    const rendered = renderer.render(
      input([], {
        subject: 'For {{name}} <3',
        preheader: 'Valid {{expiry}}',
        variables: { name: '<Mai>', expiry: '30 minutes' },
      }),
    );
    expect(rendered.subject).toBe('For <Mai> <3');
    expect(rendered.preheader).toBe('Valid 30 minutes');
    expect(rendered.html).toContain('<title>For &lt;Mai&gt; &lt;3</title>');
  });

  it('answers an empty preheader for a template with none', () => {
    expect(createEmailRenderer({ theme: FIXTURE_THEME }).render(input([])).preheader).toBe('');
  });

  it('answers null from a write check of a type it does not know', () => {
    const renderer = createEmailRenderer({ theme: FIXTURE_THEME });
    expect(renderer.contentOf('poll' as 'paragraph', {})).toBeNull();
  });

  it('renders each region through the same blocks, with its own values', () => {
    const { html, text } = createEmailRenderer({ theme: FIXTURE_THEME }).render(
      input([paragraph('b1', 'Hi {{name}},')], {
        regions: {
          header: {
            blocks: [paragraph('h1', 'Header for {{name}}')],
            variables: { name: 'Header' },
            variableTypes: { name: 'string' },
          },
          footer: {
            blocks: [paragraph('f1', 'Sent to {{recipient}}')],
            variables: { recipient: 'mai@x.test' },
            variableTypes: { recipient: 'string' },
          },
        },
      }),
    );
    expect(html).toContain('Header for Header');
    expect(html).toContain('Hi Mai,');
    expect(html).toContain('Sent to mai@x.test');
    expect(html.indexOf('Header for Header')).toBeLessThan(html.indexOf('Hi Mai,'));
    expect(html.indexOf('Hi Mai,')).toBeLessThan(html.indexOf('Sent to mai@x.test'));
    expect(html.indexOf('Sent to mai@x.test')).toBeLessThan(html.indexOf('Example Company Limited'));
    expect(text).toBe(
      'Header for Header\n\nHi Mai,\n\nSent to mai@x.test\nExample Company Limited, 1 Example Street.\nSent because you created an account.',
    );
  });

  it("keeps the body and a region from reading each other's values", () => {
    const { problems } = createEmailRenderer({ theme: FIXTURE_THEME }).render(
      input([paragraph('b1', 'Hi {{recipient}}')], {
        regions: {
          footer: {
            blocks: [paragraph('f1', 'Hi {{name}}')],
            variables: { recipient: 'r' },
            variableTypes: { recipient: 'string' },
          },
        },
      }),
    );
    expect(problems).toEqual([
      { blockId: 'b1', kind: 'variable-missing', name: 'recipient' },
      { blockId: 'f1', kind: 'variable-missing', name: 'name', region: 'footer' },
    ]);
  });

  it('reports one block id missing a value in the header and in the body as two problems, header first', () => {
    const { problems } = createEmailRenderer({ theme: FIXTURE_THEME }).render(
      input([paragraph('x', '{{gone}}')], {
        regions: { header: { blocks: [paragraph('x', '{{gone}}')], variables: {}, variableTypes: {} } },
      }),
    );
    expect(problems).toEqual([
      { blockId: 'x', kind: 'variable-missing', name: 'gone', region: 'header' },
      { blockId: 'x', kind: 'variable-missing', name: 'gone' },
    ]);
  });

  it('renders a region of a shape it cannot read as empty, rather than throwing', () => {
    const rendered = createEmailRenderer({ theme: FIXTURE_THEME }).render(
      input([paragraph('b1', 'Hi')], {
        regions: { footer: { blocks: 'nope' as unknown as EmailBlock[], variables: {}, variableTypes: {} } },
      }),
    );
    expect(rendered.problems).toEqual([]);
    expect(rendered.html).toContain('Hi');
  });

  it('renders a region that is not an object as empty, rather than throwing', () => {
    const rendered = createEmailRenderer({ theme: FIXTURE_THEME }).render(
      input([paragraph('b1', 'Hi')], { regions: { footer: null as unknown as RegionInput } }),
    );
    expect(rendered.problems).toEqual([]);
    expect(rendered.html).toContain('Hi');
  });

  it('renders a region with no variables or variableTypes, rather than throwing', () => {
    const rendered = createEmailRenderer({ theme: FIXTURE_THEME }).render(
      input([paragraph('b1', 'Hi')], {
        regions: { footer: { blocks: [paragraph('f1', 'Hi {{name}}')] } as unknown as RegionInput },
      }),
    );
    expect(rendered.problems).toEqual([{ blockId: 'f1', kind: 'variable-missing', name: 'name', region: 'footer' }]);
  });

  it('tags an unknown type in a footer region', () => {
    const rendered = createEmailRenderer({ theme: FIXTURE_THEME }).render(
      input([], {
        regions: {
          footer: {
            blocks: [{ id: 'x1', type: 'poll', attributes: {}, content: {} }],
            variables: {},
            variableTypes: {},
          },
        },
      }),
    );
    expect(rendered.problems).toEqual([{ blockId: 'x1', kind: 'unknown-block-type', name: 'poll', region: 'footer' }]);
  });

  it('tags a block nested too deep in a footer region', () => {
    const inner: EmailBlock = {
      id: 'c2',
      type: 'columns',
      attributes: { ratio: [1, 1] },
      content: {},
      lanes: [[paragraph('deep', 'deep')], []],
    };
    const outer: EmailBlock = {
      id: 'c1',
      type: 'columns',
      attributes: { ratio: [1, 1] },
      content: {},
      lanes: [[paragraph('l', 'left')], [inner]],
    };
    const rendered = createEmailRenderer({ theme: FIXTURE_THEME }).render(
      input([], { regions: { footer: { blocks: [outer], variables: {}, variableTypes: {} } } }),
    );
    expect(rendered.problems).toContainEqual({ blockId: 'c2', kind: 'block-nested-too-deep', region: 'footer' });
  });

  it('hands a custom layout both regions, an absent one empty', () => {
    const seen: (readonly EmailNode[])[] = [];
    const renderer = createEmailRenderer<{ tag: string }>({
      theme: FIXTURE_THEME,
      layout: ({ body, regions, h }) => {
        seen.push(regions.header, regions.footer);
        return h.card({}, [h.region('body', body), h.region('footer', regions.footer)]);
      },
    });
    const { html } = renderer.render({
      ...input([paragraph('b1', 'Hi')]),
      layoutProps: { tag: 'x' },
      regions: { footer: { blocks: [paragraph('f1', 'Foot')], variables: {}, variableTypes: {} } },
    });
    expect(html).toContain('Hi');
    expect(seen[0]).toEqual([]);
    expect(html).toContain('Foot');
    expect(seen[1]).toHaveLength(1);
  });
});

describe('sameBlockContent', () => {
  it('compares content by value, whatever order the keys arrive in', () => {
    expect(sameBlockContent({ label: 'a', href: 'b' }, { href: 'b', label: 'a' })).toBe(true);
    expect(sameBlockContent({ items: ['a', 'b'] }, { items: ['b', 'a'] })).toBe(false);
  });
});

describe('inline markup in text blocks', () => {
  const renderer = createEmailRenderer({ theme: FIXTURE_THEME });
  const draw = (
    text: string,
    variables: Record<string, string | null>,
    type: 'paragraph' | 'callout' | 'list' = 'paragraph',
  ): RenderedEmail => {
    const content = type === 'list' ? { items: [text] } : { text };
    return renderer.render(
      input([{ id: 'b1', type, attributes: {}, content }], {
        variables,
        variableTypes: { u: 'url', name: 'string' },
      }),
    );
  };

  it('draws bold, italic and a link', () => {
    const { html, text } = draw('**Hi** _{{name}}_ [open]({{u}})', { name: 'Mai', u: 'https://x.test/a?b=1&c=2' });
    expect(html).toContain('<strong>Hi</strong>');
    expect(html).toContain('<em>Mai</em>');
    expect(html).toContain('<a href="https://x.test/a?b=1&amp;c=2"');
    expect(html).toContain('>open</a>');
    expect(text).toContain('Hi Mai open (https://x.test/a?b=1&c=2)');
  });

  it('fills a value as text after the marks are drawn', () => {
    const { html } = draw('_{{name}}_', { name: '**<b>_x_</b>**' });
    expect(html).toContain('<em>**&lt;b&gt;_x_&lt;/b&gt;**</em>');
    expect(html).not.toContain('<strong>');
  });

  it("renders a refused link's label as plain text and reports it as a button does", () => {
    const scheme = draw('[open]({{u}})', { u: 'javascript:alert(1)' });
    expect(scheme.html).not.toContain('<a href');
    expect(scheme.html).toContain('open');
    expect(scheme.text).toContain('open');
    expect(scheme.text).not.toContain('javascript');
    expect(scheme.problems).toContainEqual({ blockId: 'b1', kind: 'href-scheme-refused', name: 'u' });
    const notUrl = draw('[open]({{name}})', { name: 'Mai' });
    expect(notUrl.html).not.toContain('<a href');
    expect(notUrl.problems).toContainEqual({ blockId: 'b1', kind: 'href-invalid', name: 'name' });
  });

  it('renders a link with a fixed href and an encoded inner token', () => {
    const { html, text } = draw('[Continue {{place}}](https://x.test/p?id={{place}})', { place: 'a&b c' });
    expect(html).toContain('<a href="https://x.test/p?id=a%26b%20c"');
    expect(html).toContain('>Continue a&amp;b c</a>');
    expect(text).toContain('Continue a&b c (https://x.test/p?id=a%26b%20c)');
  });

  it('renders malformed markup as its literal text without throwing', () => {
    const { html, text } = draw('**a', {});
    expect(html).toContain('**a');
    expect(text).toContain('**a');
  });

  it('keeps the literal text of a marker inside a token and fills only the real twin', () => {
    const variables = { a: 'A', ab: 'X', a_b: 'Y' };
    for (const [source, expected] of [
      ['{{a****b}} {{ab}}', '{{a****b}} X'],
      ['{{a\\_****b}} {{a_b}}', '{{a\\_****b}} Y'],
      ['{{a\\_b}} and {{a_b}}', '{{a\\_b}} and Y'],
      ['{****{a}} {{a}}', '{****{a}} A'],
      ['{{a}__} {{a}}', '{{a}__} A'],
      ['**[{**{a}**}]({{u}})** {{a}}', '**[{**{a}**}]()** A'],
    ] as const) {
      const { html, text } = draw(source, variables);
      expect(html).toContain(expected);
      expect(text).toContain(expected);
    }
  });

  it('fills, on the text arm, only the names a generated source spells as tokens, bar those in a refused href', () => {
    // Every name has a url value and type, so a link draws its target and a joined name would be filled too.
    // `~` survives the encoding an inner href token gets, so a filled name reads the same wherever it sits.
    const everyName = <T>(value: (name: string) => T): Record<string, T> =>
      new Proxy({} as Record<string, T>, {
        get: (_target, name) => (typeof name === 'string' ? value(name) : undefined),
        getOwnPropertyDescriptor: (_target, name) =>
          typeof name === 'string'
            ? { value: value(name), enumerable: true, configurable: true, writable: false }
            : undefined,
      });
    const variables = everyName((name) => `https://x.test/~${name}~`);
    const variableTypes = everyName(() => 'url' as const);
    const mismatches: unknown[] = [];
    for (const source of markupSamples(20000)) {
      const ctx = createRenderContext(
        { theme: FIXTURE_THEME, locale: 'en', variables, variableTypes, problems: [], region: 'body' },
        'b1',
        () => [],
      );
      const { text } = ctx.inline(source);
      const filled = Array.from(text.matchAll(/~(\w+)~/g), (match) => match[1]).sort();
      const parsed = parseInlineMarkup(source);
      const refused = parsed.ok
        ? parsed.runs.flatMap((run) =>
            run.kind === 'link' && hrefProblem(run.href, () => 'url') !== null ? variableTokens(run.href) : [],
          )
        : [];
      const expected = variableTokens(source);
      for (const name of refused) expected.splice(expected.indexOf(name), 1);
      if (filled.join() !== expected.sort().join()) mismatches.push({ source, text });
    }
    expect(mismatches.slice(0, 5)).toEqual([]);
  });

  it('draws marks in a callout and in each list item', () => {
    expect(draw('**Heads up**', {}, 'callout').html).toContain('<strong>Heads up</strong>');
    expect(draw('_soon_', {}, 'list').html).toContain('<li><em>soon</em></li>');
  });
});
