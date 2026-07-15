import { describe, expect, it } from 'vitest';
import { renderMath, renderMathHtml } from './render.js';

describe('renderMath', () => {
  it('returns ok with KaTeX markup for a valid formula', () => {
    const result = renderMath('E = mc^2');
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.html).toContain('katex');
  });

  it('returns an error result (never throws) for an invalid formula', () => {
    let result!: ReturnType<typeof renderMath>;
    expect(() => {
      result = renderMath('\\frac{1}{');
    }).not.toThrow();
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.length).toBeGreaterThan(0);
  });

  it('renders inline vs display mode from config', () => {
    const display = renderMath('x', { displayMode: true });
    const inline = renderMath('x', { displayMode: false });
    expect(display.ok && display.html).toContain('katex-display');
    expect(inline.ok && !inline.html.includes('katex-display')).toBe(true);
  });
});

describe('renderMathHtml', () => {
  it('always returns markup, even for an invalid formula (lenient)', () => {
    expect(() => renderMathHtml('\\frac{1}{')).not.toThrow();
    expect(renderMathHtml('\\frac{1}{')).toContain('katex');
  });
});
