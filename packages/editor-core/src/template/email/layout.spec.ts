// @vitest-environment node
import { describe, expect, it } from 'vitest';
import type { EmailBlock } from './block.js';
import { FIXTURE_LAYOUT_PROPS, FIXTURE_THEME } from './fixtures.fixture.js';
import type { DefaultLayoutProps, LayoutInput } from './layout.js';
import type { RegionInput } from './region.js';
import { createEmailRenderer, type RenderedEmail, type RenderEmailInput } from './renderer.js';

const renderer = createEmailRenderer({ theme: FIXTURE_THEME });

const block = (id: string, text: string): EmailBlock => ({ id, type: 'paragraph', attributes: {}, content: { text } });
const region = (text: string): RegionInput => ({ blocks: [block(text, text)], variables: {}, variableTypes: {} });

/** The default layout around one paragraph, `BODY`. */
function layout(overrides: Partial<RenderEmailInput<DefaultLayoutProps>> = {}): RenderedEmail {
  return renderer.render({
    blocks: [block('b', 'BODY')],
    subject: 'Verify your email',
    preheader: null,
    locale: 'en',
    variables: {},
    variableTypes: {},
    layoutProps: FIXTURE_LAYOUT_PROPS,
    ...overrides,
  });
}

/** The inline style of the element whose class attribute is `classes`. */
function styleOf(html: string, classes: string): string {
  return new RegExp(`class="${classes}" style="([^"]*)"`).exec(html)?.[1] ?? '';
}

describe('defaultLayout', () => {
  it('puts the logo first, at its width, with its alt text', () => {
    const { html } = layout();
    expect(html.indexOf('logo@2x.png')).toBeLessThan(html.indexOf('BODY'));
    expect(html).toContain('alt="Example"');
    expect(html).toContain('width="120"');
  });

  it('writes each footer line after the body', () => {
    const { html, text } = layout();
    expect(html.indexOf('BODY')).toBeLessThan(html.indexOf('Example Company Limited'));
    expect(text).toBe('BODY\n\nExample Company Limited, 1 Example Street.\nSent because you created an account.');
  });

  it('escapes the subject, the preheader, the logo and the footer it prints', () => {
    const { html } = layout({
      subject: 'A <b>',
      preheader: 'P <i>',
      layoutProps: { logo: { url: 'https://x.test/"onerror="x', alt: '<a>', width: 1 }, footer: ['<script>'] },
    });
    expect(html).not.toMatch(/<b>|<i>|<a>|<script>|"onerror="/);
    expect(html).toContain('<title>A &lt;b&gt;</title>');
  });

  it('hides the preheader and writes none when it is empty', () => {
    expect(styleOf(layout({ preheader: 'Works for 30 minutes' }).html, 'zx-preheader')).toContain('display:none');
    expect(layout().html).not.toContain('zx-preheader"');
  });

  it('sets the lang attribute from the locale', () => {
    expect(layout({ locale: 'zh-Hans' }).html).toContain('<html lang="zh-Hans">');
  });

  it('sizes the card by style alone, so a phone client does not scale a 600px table down to fit', () => {
    // Outlook's own fixed table sits in a conditional comment every other client skips.
    const html = layout().html.replace(/<!--\[if mso\]>.*?<!\[endif\]-->/g, '');
    expect(html).not.toMatch(/<table[^>]*\swidth="600"/);
    expect(html).toContain('width:100%;max-width:600px');
  });

  it('draws the header after the logo and the footer blocks above the footer lines', () => {
    const { html, text } = layout({ regions: { header: region('HEAD'), footer: region('FOOT') } });
    expect(html.indexOf('logo@2x.png')).toBeLessThan(html.indexOf('HEAD'));
    expect(html.indexOf('HEAD')).toBeLessThan(html.indexOf('BODY'));
    expect(html.indexOf('BODY')).toBeLessThan(html.indexOf('FOOT'));
    expect(html.indexOf('FOOT')).toBeLessThan(html.indexOf('Example Company Limited'));
    expect(text).toBe(
      'HEAD\n\nBODY\n\nFOOT\nExample Company Limited, 1 Example Street.\nSent because you created an account.',
    );
  });

  it('draws no blank lines for a header over an empty body', () => {
    const { text } = layout({ blocks: [], regions: { header: region('HEAD') } });
    expect(text).toBe('HEAD\n\nExample Company Limited, 1 Example Street.\nSent because you created an account.');
  });

  describe("a layout's primitives", () => {
    const custom = createEmailRenderer({
      theme: FIXTURE_THEME,
      layout: ({ body, subject, h }: LayoutInput<null>) => [
        h.button({ href: 'javascript:alert(1)', label: 'Bad' }),
        h.button({ href: 'https://example.test/', label: 'Good' }),
        h.image({ src: 'javascript:alert(1)', alt: 'x', width: 10 }),
        h.image({ src: 'data:image/png;base64,AAAA', alt: 'logo', width: 10 }),
        h.image({ src: 'cid:logo', alt: 'logo', width: 10 }),
        h.raw({ markup: '<a href="https://example.test/">home</a>' }),
        h.raw`<td class="t" title="${subject}">${subject.slice(3)}</td>`,
        h.region('body', body),
      ],
    });
    const drawn = (subject: string) =>
      custom.render({
        blocks: [],
        subject,
        preheader: null,
        locale: 'en',
        variables: { who: '<img src=x onerror=alert(1)>' },
        variableTypes: { who: 'string' },
        layoutProps: null,
      });

    it("checks the links and images a layout draws as a block's are checked, a data image kept", () => {
      const { html } = drawn('Hi');
      expect(html).toContain('<a class="zx-button" style=');
      expect(html).toContain('href="https://example.test/"');
      expect(html).not.toContain('javascript:');
      expect(html).toContain('src="data:image/png;base64,AAAA"');
      expect(html).toContain('src="cid:logo"');
    });

    it("leaves the layout's own markup as written for a subject of no markup", () => {
      expect(drawn('"').html).toContain('<a href="https://example.test/">home</a>');
    });

    it('escapes every value a tagged raw holds, though the layout cut it or put it in an attribute', () => {
      const { html, text } = drawn('Hi {{who}}');
      expect(html).toContain(
        '<td class="t" title="Hi &lt;img src=x onerror=alert(1)&gt;">&lt;img src=x onerror=alert(1)&gt;</td>',
      );
      expect(drawn('" onmouseover="alert(1)').html).toContain(
        'title="&quot; onmouseover=&quot;alert(1)">nmouseover=&quot;alert(1)</td>',
      );
      expect(text).toContain('<img src=x onerror=alert(1)>');
    });
  });
});
