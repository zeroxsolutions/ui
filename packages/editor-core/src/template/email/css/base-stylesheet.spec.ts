// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { FIXTURE_THEME } from '../fixtures.fixture.js';
import { DEFAULT_EMAIL_THEME } from '../theme.js';
import { baseStylesheet } from './base-stylesheet.js';
import { composeStylesheets } from './stylesheet.js';

describe('the base stylesheet', () => {
  it('declares no dark scheme and no dark rules for a theme with no dark palette', () => {
    const composed = composeStylesheets(baseStylesheet(FIXTURE_THEME), []);
    expect(composed.darkScheme).toBe(false);
    expect(composed.head).not.toContain('prefers-color-scheme');
  });

  it('declares a dark scheme and repaints in the dark palette where the theme has one', () => {
    const dark = composeStylesheets(baseStylesheet(DEFAULT_EMAIL_THEME), []);
    expect(dark.darkScheme).toBe(true);
    expect(dark.head).toContain(
      `@media (prefers-color-scheme:dark){.zx-body{background:${DEFAULT_EMAIL_THEME.dark.background} !important;}`,
    );
  });
});
