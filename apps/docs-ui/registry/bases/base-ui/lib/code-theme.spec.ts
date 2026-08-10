import { describe, expect, it } from 'vitest';

import { CODE_THEME_NAME, CODE_TOKEN_VARS, codeTheme } from './code-theme';

describe('codeTheme', () => {
  it('registers under the shared theme name', () => {
    expect(codeTheme.name).toBe(CODE_THEME_NAME);
  });

  it('declares a unique set of --code-* token vars', () => {
    expect(new Set(CODE_TOKEN_VARS).size).toBe(CODE_TOKEN_VARS.length);
    expect(CODE_TOKEN_VARS.every((v) => v.startsWith('--code-'))).toBe(true);
  });

  it('only references declared --code-* vars (no typos that would fall back to fg)', () => {
    const declared = new Set<string>(CODE_TOKEN_VARS);
    const settings = codeTheme.settings ?? [];
    const referenced: string[] = [];
    for (const rule of settings) {
      const fg = rule.settings?.foreground;
      if (!fg) continue; // a bold/italic-only rule (no color) is allowed
      const match = /^var\((--code-[a-z-]+)\)$/.exec(fg);
      expect(match, `foreground "${fg}" must be a var(--code-*) reference`).not.toBeNull();
      if (match) referenced.push(match[1]);
    }
    for (const name of referenced) {
      expect(declared.has(name), `${name} is referenced but not declared`).toBe(true);
    }
  });

  it('maps the core syntax buckets (keyword · function · string · comment)', () => {
    const fgs = (codeTheme.settings ?? [])
      .map((r) => r.settings?.foreground)
      .filter(Boolean);
    for (const v of [
      'var(--code-keyword)',
      'var(--code-function)',
      'var(--code-string)',
      'var(--code-comment)',
    ]) {
      expect(fgs).toContain(v);
    }
  });
});
