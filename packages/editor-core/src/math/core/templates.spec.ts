import { describe, expect, it } from 'vitest';
import { renderMath } from './render.js';
import { DEFAULT_MATH_SOURCE, MATH_TEMPLATES, templateFor } from './templates.js';

describe('MATH_TEMPLATES', () => {
  it('every template renders as valid LaTeX', () => {
    for (const template of MATH_TEMPLATES) {
      expect(renderMath(template.latex).ok, template.label).toBe(true);
    }
  });

  it('every caretOffset lands inside its snippet', () => {
    for (const template of MATH_TEMPLATES) {
      if (template.caretOffset === undefined) continue;
      expect(template.caretOffset).toBeGreaterThanOrEqual(0);
      expect(template.caretOffset).toBeLessThanOrEqual(template.latex.length);
    }
  });

  it('places the fraction caret between the empty braces', () => {
    const fraction = templateFor('Fraction');
    expect(fraction?.latex).toBe('\\frac{}{}');
    const at = fraction?.caretOffset ?? -1;
    // The caret sits just after the first `{`, so it is inside the empty pair.
    expect(fraction?.latex[at - 1]).toBe('{');
    expect(fraction?.latex[at]).toBe('}');
  });

  it('places the square-root caret inside the empty braces', () => {
    const sqrt = templateFor('Square root');
    const at = sqrt?.caretOffset ?? -1;
    expect(sqrt?.latex[at - 1]).toBe('{');
    expect(sqrt?.latex[at]).toBe('}');
  });
});

describe('templateFor', () => {
  it('finds a template by label', () => {
    expect(templateFor('Matrix')?.latex).toContain('pmatrix');
  });

  it('returns undefined for an unknown label', () => {
    expect(templateFor('Nope')).toBeUndefined();
  });
});

describe('DEFAULT_MATH_SOURCE', () => {
  it('is a valid, non-empty starter formula', () => {
    expect(DEFAULT_MATH_SOURCE.length).toBeGreaterThan(0);
    expect(renderMath(DEFAULT_MATH_SOURCE).ok).toBe(true);
  });
});
