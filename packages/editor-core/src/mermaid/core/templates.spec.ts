import { describe, expect, it } from 'vitest';
import { detectDiagramType } from './detect.js';
import { DIAGRAM_TEMPLATES, templateFor } from './templates.js';

describe('diagram templates', () => {
  it('each template source detects as its own diagram type', () => {
    for (const template of DIAGRAM_TEMPLATES) {
      expect(detectDiagramType(template.source)).toBe(template.type);
    }
  });

  it('templateFor finds a template by type and returns undefined otherwise', () => {
    expect(templateFor('sequence')?.type).toBe('sequence');
    expect(templateFor('unknown')).toBeUndefined();
  });
});
