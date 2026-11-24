// @vitest-environment node
import { describe, expect, it } from 'vitest';
import type { RenderedBlock } from './block.js';
import { FIXTURE_LAYOUT_PROPS, FIXTURE_THEME } from './fixtures.fixture.js';
import { defaultLayout, type DefaultLayoutProps, type LayoutInput } from './layout.js';

const NO_REGIONS = {
  header: { html: '', text: '' },
  footer: { html: '', text: '' },
} as const satisfies LayoutInput<DefaultLayoutProps>['regions'];

function layout(overrides: Partial<LayoutInput<DefaultLayoutProps>> = {}): RenderedBlock {
  return defaultLayout({
    body: { html: '<tr><td>BODY</td></tr>', text: 'BODY\n\n' },
    regions: NO_REGIONS,
    subject: 'Verify your email',
    preheader: '',
    locale: 'en',
    theme: FIXTURE_THEME,
    props: FIXTURE_LAYOUT_PROPS,
    ...overrides,
  });
}

describe('defaultLayout', () => {
  it('puts the body inside a 600px card in the border colour and radius', () => {
    const { html } = layout();
    expect(html).toContain('max-width:600px');
    expect(html).toContain('border:1px solid #E4E4E7');
    expect(html).toContain('border-radius:10px');
    expect(html).toContain('<tr><td>BODY</td></tr>');
  });

  it('puts the logo first, at its width, with its alt text', () => {
    const { html } = layout();
    expect(html.indexOf('logo@2x.png')).toBeLessThan(html.indexOf('BODY'));
    expect(html).toContain('alt="Example"');
    expect(html).toContain('width="120"');
  });

  it('writes each footer line under a rule, 12px in the muted foreground', () => {
    const { html, text } = layout();
    expect(html).toContain('color:#63636D');
    expect(html).toContain('font-size:12px');
    expect(html.indexOf('BODY')).toBeLessThan(html.indexOf('Example Company Limited'));
    expect(text).toBe('BODY\n\nExample Company Limited, 1 Example Street.\nSent because you created an account.');
  });

  it('escapes the subject, the preheader, the logo and the footer it prints', () => {
    const { html } = layout({
      subject: 'A <b>',
      preheader: 'P <i>',
      props: { logo: { url: 'https://x.test/"onerror="x', alt: '<a>', width: 1 }, footer: ['<script>'] },
    });
    expect(html).not.toMatch(/<b>|<i>|<a>|<script>|"onerror="/);
    expect(html).toContain('<title>A &lt;b&gt;</title>');
  });

  it('hides the preheader and writes none when it is empty', () => {
    expect(layout({ preheader: 'Works for 30 minutes' }).html).toContain('display:none');
    expect(layout().html).not.toContain('display:none');
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
    const { html, text } = layout({
      regions: {
        header: { html: '<tr><td>HEAD</td></tr>', text: 'HEAD\n\n' },
        footer: { html: '<tr><td>FOOT</td></tr>', text: 'FOOT\n\n' },
      },
    });
    expect(html.indexOf('logo@2x.png')).toBeLessThan(html.indexOf('HEAD'));
    expect(html.indexOf('HEAD')).toBeLessThan(html.indexOf('BODY'));
    expect(html.indexOf('BODY')).toBeLessThan(html.indexOf('FOOT'));
    expect(html.indexOf('FOOT')).toBeLessThan(html.indexOf('Example Company Limited'));
    expect(text).toBe(
      'HEAD\n\nBODY\n\nFOOT\nExample Company Limited, 1 Example Street.\nSent because you created an account.',
    );
  });

  it('draws no blank lines for a header over an empty body', () => {
    const { text } = layout({
      body: { html: '', text: '' },
      regions: { header: { html: '<tr><td>HEAD</td></tr>', text: 'HEAD\n\n' }, footer: { html: '', text: '' } },
    });
    expect(text).toBe('HEAD\n\nExample Company Limited, 1 Example Street.\nSent because you created an account.');
  });
});
