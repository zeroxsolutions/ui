// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { FIXTURE_THEME } from '../fixtures.fixture.js';
import { DEFAULT_EMAIL_THEME } from '../theme.js';
import { baseStylesheet } from './base-stylesheet.js';
import { inlineStyle } from './inline-styles.js';
import type { StyledElement } from './selector.js';
import { composeStylesheets } from './stylesheet.js';

const chain = (...levels: string[][]): StyledElement =>
  levels.reduce<StyledElement | null>((parent, classes) => ({ classes, parent }), null) as StyledElement;

describe('the base stylesheet', () => {
  const composed = composeStylesheets(baseStylesheet(FIXTURE_THEME), []);

  it('draws body text in the theme font, at 14px over 20px, in the foreground', () => {
    expect(inlineStyle(composed.rules, chain(['zx-region', 'zx-region-body'], ['zx-text']))).toBe(
      'font-family:Inter, Arial, Helvetica, sans-serif;font-size:14px;line-height:20px;color:#09090B;',
    );
  });

  it('draws footer text 12px over 17px in the muted foreground', () => {
    expect(inlineStyle(composed.rules, chain(['zx-region', 'zx-region-footer'], ['zx-text']))).toBe(
      'font-family:Inter, Arial, Helvetica, sans-serif;font-size:12px;line-height:17px;color:#63636D;',
    );
  });

  it('draws a full-width button as a centred block', () => {
    expect(inlineStyle(composed.rules, chain(['zx-button', 'zx-width-full']))).toContain('display:block;');
    expect(inlineStyle(composed.rules, chain(['zx-button', 'zx-width-full']))).toContain('text-align:center;');
  });

  it('keeps the narrow-screen rules in the head, and no dark rules for a theme with no dark palette', () => {
    expect(composed.head).toContain('@media only screen and (max-width:600px){.zx-outer{padding:0 !important;}');
    expect(composed.darkScheme).toBe(false);
    expect(composed.head).not.toContain('prefers-color-scheme');
  });

  it('repaints with the dark palette where a client reads the dark scheme', () => {
    const dark = composeStylesheets(baseStylesheet(DEFAULT_EMAIL_THEME), []);
    expect(dark.darkScheme).toBe(true);
    expect(dark.head).toContain('@media (prefers-color-scheme:dark){.zx-body{background:#0A0A0A !important;}');
    expect(dark.head).toContain('.zx-button{background:#00BC7D !important;color:#022C22 !important;}');
  });
});
