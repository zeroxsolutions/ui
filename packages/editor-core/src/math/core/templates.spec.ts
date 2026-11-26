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
});

describe('templateFor', () => {
  it('finds each template by its label', () => {
    for (const template of MATH_TEMPLATES) expect(templateFor(template.label)).toBe(template);
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
