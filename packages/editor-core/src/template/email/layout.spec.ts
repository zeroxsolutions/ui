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
  it('puts the body inside a 600px card in the border colour and radius', () => {
    const { html } = layout();
    expect(styleOf(html, 'zx-card')).toBe(
      'width:100%;max-width:600px;background:#FFFFFF;border:1px solid #E4E4E7;border-radius:10px;',
    );
    expect(html).toContain('BODY');
  });

  it('puts the logo first, at its width, with its alt text', () => {
    const { html } = layout();
    expect(html.indexOf('logo@2x.png')).toBeLessThan(html.indexOf('BODY'));
    expect(html).toContain('alt="Example"');
    expect(html).toContain('width="120"');
  });

  it('writes each footer line under a rule, 12px in the muted foreground', () => {
    const { html, text } = layout();
    expect(styleOf(html, 'zx-footer')).toBe('padding:10px 0 0;border-top:1px solid #E4E4E7;');
    expect(styleOf(html, 'zx-text zx-footer-line')).toBe(
      'font-family:Inter, Arial, Helvetica, sans-serif;margin:0 0 4px;font-size:12px;line-height:17px;color:#63636D;',
    );
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

  it('carries the narrow-screen rules in a head style, keyed by class as Gmail keeps them', () => {
    const { html } = layout();
    const head = html.slice(0, html.indexOf('</head>'));
    expect(head).toContain('@media only screen and (max-width:600px)');
    // Full-bleed on a phone: no gutter around the card and no frame on it, the card's background edge to edge.
    expect(head).toContain('.zx-outer{padding:0 !important;}');
    expect(head).toContain('.zx-card{border:0 !important;border-radius:0 !important;}');
    expect(html).toContain('class="zx-card"');
    expect(html).toContain('class="zx-outer"');
    expect(html).toContain('class="zx-inner"');
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
        h.raw({ markup: `<p class="s">${subject}</p>` }),
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
    });

    it("escapes a person's value that reaches raw markup through the subject", () => {
      const { html } = drawn('Hi {{who}}');
      expect(html).toContain('<p class="s">Hi &lt;img src=x onerror=alert(1)&gt;</p>');
    });
  });
});
