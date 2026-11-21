import { describe, expect, it } from 'vitest';
import { renderProblemMessage } from './problem-messages';

describe('renderProblemMessage', () => {
  it('names the variable and the place of its block', () => {
    expect(renderProblemMessage({ kind: 'variable-missing', name: 'name', blockId: 'p1' }, 2)).toBe(
      'This variable has no sample value to preview: {{name}} (block 2)',
    );
  });

  it('names the region of a layout block, and the subject or preheader for no block', () => {
    expect(renderProblemMessage({ kind: 'href-scheme-refused', name: 'site', blockId: 'f1', region: 'footer' })).toBe(
      'The link is not a web or mail address: {{site}} (in the footer)',
    );
    expect(renderProblemMessage({ kind: 'variable-missing', name: 'name', blockId: null })).toBe(
      'This variable has no sample value to preview: {{name}} (in the subject or preheader)',
    );
  });

  it('names an unknown block by its type, not as a variable', () => {
    expect(renderProblemMessage({ kind: 'unknown-block-type', name: 'poll', blockId: 'x1' })).toBe(
      'This block is of an unknown type: poll',
    );
  });
});
