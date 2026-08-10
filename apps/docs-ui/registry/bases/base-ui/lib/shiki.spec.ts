import { describe, expect, it } from 'vitest';

import {
  highlightToLines,
  resolveLanguage,
  styleObjectForToken,
} from './shiki';

describe('styleObjectForToken', () => {
  it('emits the color when present', () => {
    expect(styleObjectForToken('var(--primary)')).toEqual({ color: 'var(--primary)' });
  });

  it('maps the FontStyle bitflags (italic 1 · bold 2 · underline 4 · strike 8)', () => {
    expect(styleObjectForToken(undefined, 1)).toEqual({ fontStyle: 'italic' });
    expect(styleObjectForToken(undefined, 2)).toEqual({ fontWeight: 'bold' });
    expect(styleObjectForToken(undefined, 4)).toEqual({ textDecoration: 'underline' });
    expect(styleObjectForToken(undefined, 8)).toEqual({ textDecoration: 'line-through' });
  });

  it('combines color with multiple style bits', () => {
    // 3 = italic | bold
    expect(styleObjectForToken('var(--info)', 3)).toEqual({
      color: 'var(--info)',
      fontStyle: 'italic',
      fontWeight: 'bold',
    });
  });

  it('is empty for an unstyled token (e.g. whitespace)', () => {
    expect(styleObjectForToken(undefined, 0)).toEqual({});
    expect(styleObjectForToken(undefined, undefined)).toEqual({});
  });
});

describe('resolveLanguage', () => {
  it('passes through a canonical, bundled id', () => {
    expect(resolveLanguage('markdown')).toBe('markdown');
    expect(resolveLanguage('typescript')).toBe('typescript');
    expect(resolveLanguage('shellscript')).toBe('shellscript');
  });

  it('maps common Markdown-fence aliases to their canonical grammar', () => {
    expect(resolveLanguage('js')).toBe('javascript');
    expect(resolveLanguage('ts')).toBe('typescript');
    expect(resolveLanguage('py')).toBe('python');
    expect(resolveLanguage('bash')).toBe('shellscript');
    expect(resolveLanguage('yml')).toBe('yaml');
    expect(resolveLanguage('md')).toBe('markdown');
  });

  it('returns undefined for a language we ship no grammar for', () => {
    expect(resolveLanguage('definitely-not-a-language')).toBeUndefined();
    expect(resolveLanguage('plaintext')).toBeUndefined();
  });
});

describe('highlightToLines', () => {
  // SKILL.md is the workspace's primary file; markdown must highlight.
  it('highlights Markdown with the brand palette (the SKILL.md path)', async () => {
    const lines = await highlightToLines('# Heading\n\n- item', 'markdown');
    expect(lines).not.toBeNull();
    const colors = (lines ?? [])
      .flat()
      .map((t) => t.style?.color)
      .filter((c): c is string => Boolean(c));
    expect(colors.length).toBeGreaterThan(0);
    expect(colors.every((c) => c.startsWith('var(--code-'))).toBe(true);
  }, 20000);


  it('returns null for an empty or whitespace language', async () => {
    expect(await highlightToLines('x', '')).toBeNull();
    expect(await highlightToLines('x', '   ')).toBeNull();
  });

  it('returns null for an unknown grammar (degrade to plain)', async () => {
    expect(await highlightToLines('x', 'definitely-not-a-language')).toBeNull();
  }, 20000);

  it('tokenizes a known language into lines that reconstruct the source', async () => {
    const code = 'const x = 1';
    const lines = await highlightToLines(code, 'js');
    expect(lines).not.toBeNull();

    const text = (lines ?? [])
      .map((line) => line.map((token) => token.content).join(''))
      .join('\n');
    expect(text).toBe(code);

    const hasStyledToken = (lines ?? []).some((line) =>
      line.some((token) => token.style?.color),
    );
    expect(hasStyledToken).toBe(true);
  }, 20000);

  it('paints tokens with the brand `var(--code-*)` palette (not concrete colors)', async () => {
    // `const` should resolve to the keyword bucket; assert the theme is wired by
    // checking a styled token references a `--code-*` design token.
    const lines = await highlightToLines('const x = 1', 'js');
    const colors = (lines ?? [])
      .flat()
      .map((token) => token.style?.color)
      .filter((c): c is string => Boolean(c));
    expect(colors.length).toBeGreaterThan(0);
    expect(colors.every((c) => c.startsWith('var(--code-'))).toBe(true);
  }, 20000);
});
