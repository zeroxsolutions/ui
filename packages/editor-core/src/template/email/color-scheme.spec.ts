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

function render(theme: EmailTheme): string {
  return createEmailRenderer({ theme }).render({
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
  it('declares both schemes and repaints each painted element in dark mode', () => {
    const html = render({ ...FIXTURE_THEME, dark: DARK });

    expect(html).toContain('<meta name="color-scheme" content="light dark">');
    expect(html).toContain('<meta name="supported-color-schemes" content="light dark">');
    const rules = /@media \(prefers-color-scheme:dark\)\{(.*?\})\}/.exec(html)?.[1];
    expect(rules).toBe(
      '.zx-bg{background:#09090B !important;}.zx-fg{color:#FAFAFA !important;}' +
        '.zx-muted-fg{color:#9F9FA9 !important;}.zx-muted-bg{background:#27272A !important;}' +
        '.zx-primary-bg{background:#00BC7D !important;}.zx-primary-fg{color:#022C22 !important;}' +
        '.zx-link{color:#00BC7D !important;}' +
        '.zx-border{border-color:#FFFFFF1A !important;}',
    );
    for (const marked of [
      '<body class="zx-bg"',
      'class="zx-card zx-bg zx-border"',
      '<div class="zx-text zx-fg"',
      '<div class="zx-text zx-muted-fg"',
      '<a href="https://x.test/g" class="zx-link"',
      'class="zx-text zx-fg zx-muted-bg zx-border"',
      '<div class="zx-fg zx-muted-bg"',
      'class="zx-button zx-primary-bg zx-primary-fg"',
      '<div class="zx-border"',
      '<p class="zx-muted-fg"',
    ]) {
      expect(html).toContain(marked);
    }
  });

  it('keeps the light palette inline, for a client that reads no media query', () => {
    expect(render({ ...FIXTURE_THEME, dark: DARK })).toContain('color:#09090B;');
  });

  it('is left out without one: no scheme, no dark rules and no paint classes', () => {
    const html = render(FIXTURE_THEME);

    expect(html).not.toContain('color-scheme');
    expect(html).not.toContain('zx-fg');
    expect(html).not.toContain('zx-bg');
  });
});
