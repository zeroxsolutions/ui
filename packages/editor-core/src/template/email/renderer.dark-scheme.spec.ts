// @vitest-environment node
import { describe, expect, it } from 'vitest';
import type { EmailBlock } from './block.js';
import { FIXTURE_LAYOUT_PROPS, FIXTURE_THEME } from './fixtures.fixture.js';
import { createEmailRenderer } from './renderer.js';
import type { EmailTheme } from './theme.js';

const DARK: EmailTheme['colors'] = {
  background: '#09090B',
  foreground: '#FAFAFA',
  primary: '#00BC7D',
  primaryForeground: '#022C22',
  muted: '#27272A',
  mutedForeground: '#9F9FA9',
  border: '#FFFFFF1A',
};

const blocks: EmailBlock[] = [
  { id: 'p', type: 'paragraph', attributes: {}, content: { text: 'Read [the guide](https://x.test/g).' } },
  { id: 'm', type: 'paragraph', attributes: { tone: 'muted' }, content: { text: 'Quiet' } },
  { id: 'c', type: 'callout', attributes: {}, content: { text: 'Note' } },
  { id: 'k', type: 'code', attributes: {}, content: { code: '482913' } },
  { id: 'b', type: 'button', attributes: {}, content: { label: 'Go', href: 'https://x.test/go' } },
  { id: 'd', type: 'divider', attributes: {}, content: {} },
];

function render(theme: EmailTheme, css?: string): string {
  return createEmailRenderer({ theme, ...(css === undefined ? {} : { css }) }).render({
    blocks,
    subject: 's',
    preheader: null,
    locale: 'en',
    variables: {},
    variableTypes: {},
    layoutProps: FIXTURE_LAYOUT_PROPS,
  }).html;
}

describe('a dark palette', () => {
  it('declares both schemes and repaints each painted class in dark mode', () => {
    const html = render({ ...FIXTURE_THEME, dark: DARK });

    expect(html).toContain('<meta name="color-scheme" content="light dark">');
    expect(html).toContain('<meta name="supported-color-schemes" content="light dark">');
    const rules = /@media \(prefers-color-scheme:dark\)\{(.*?\})\}/.exec(html)?.[1];
    expect(rules).toBe(
      '.zx-body{background:#09090B !important;}.zx-canvas{background:#09090B !important;}' +
        '.zx-card{background:#09090B !important;border-color:#FFFFFF1A !important;}' +
        '.zx-text{color:#FAFAFA !important;}.zx-heading{color:#FAFAFA !important;}' +
        '.zx-tone-muted{color:#9F9FA9 !important;}.zx-region-footer .zx-text{color:#9F9FA9 !important;}' +
        '.zx-footer-line{color:#9F9FA9 !important;}.zx-link{color:#00BC7D !important;}' +
        '.zx-callout{background:#27272A !important;border-color:#FFFFFF1A !important;}' +
        '.zx-code{color:#FAFAFA !important;background:#27272A !important;}' +
        '.zx-button{background:#00BC7D !important;color:#022C22 !important;}' +
        '.zx-divider{border-color:#FFFFFF1A !important;}.zx-quote{border-color:#FFFFFF1A !important;}' +
        '.zx-table-cell{color:#FAFAFA !important;border-color:#FFFFFF1A !important;}' +
        '.zx-table-head{background:#27272A !important;}.zx-card-block{border-color:#FFFFFF1A !important;}' +
        '.zx-footer{border-color:#FFFFFF1A !important;}',
    );
    for (const marked of [
      '<body class="zx-body"',
      'class="zx-card"',
      '<div class="zx-text zx-tone-default"',
      '<div class="zx-text zx-tone-muted"',
      '<a href="https://x.test/g" class="zx-link"',
      '<td class="zx-callout"',
      '<div class="zx-code"',
      'class="zx-button zx-width-inline"',
      '<div class="zx-divider"',
      '<div class="zx-text zx-footer-line"',
    ]) {
      expect(html).toContain(marked);
    }
  });

  it('keeps the light palette inline, for a client that reads no media query', () => {
    expect(render({ ...FIXTURE_THEME, dark: DARK })).toContain('color:#09090B;');
  });

  it('is left out without one: no scheme and no dark rules', () => {
    const html = render(FIXTURE_THEME);

    expect(html).not.toContain('color-scheme');
  });

  it("declares both schemes for a product's own dark rule", () => {
    expect(render(FIXTURE_THEME, '@media (prefers-color-scheme: dark){.zx-text{color:#FFFFFF}}')).toContain(
      '<meta name="color-scheme" content="light dark">',
    );
  });
});
