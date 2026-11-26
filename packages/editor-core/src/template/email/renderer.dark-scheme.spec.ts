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
  it('declares both schemes and repaints in each colour of the dark palette', () => {
    const html = render({ ...FIXTURE_THEME, dark: DARK });

    expect(html).toContain('<meta name="color-scheme" content="light dark">');
    expect(html).toContain('<meta name="supported-color-schemes" content="light dark">');
    const rules = /@media \(prefers-color-scheme:dark\)\{(.*?\})\}/.exec(html)?.[1] ?? '';
    for (const [name, value] of Object.entries(DARK)) expect(rules, name).toContain(`${value} !important`);
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
