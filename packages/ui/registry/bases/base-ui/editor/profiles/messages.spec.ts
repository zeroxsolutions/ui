import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';
import { DEFAULT_PROFILE_MESSAGES } from './messages';

const PROFILES = import.meta.dirname;

/** The profiles' source files, specs left out: they hold the words they expect. */
function sources(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return sources(path);
    return /\.tsx?$/.test(entry.name) && !/\.spec\.tsx?$/.test(entry.name) ? [path] : [];
  });
}

// A tag's text up to the next tag. An arrow's `=>` and a statement's punctuation would read code as text.
const JSX_TEXT = /(?<!=)>\s*[A-Za-z][^<{}();=]*<\/?[A-Za-z]/;
const NAMED_ATTRIBUTE = /(aria-label|title|placeholder|label)="[^"]*[A-Za-z]/;

describe('the profiles', () => {
  it('draw no word of their own but through the messages', () => {
    const worded = sources(PROFILES)
      .filter((path) => !path.endsWith('/messages.ts'))
      .filter((path) => {
        const text = readFileSync(path, 'utf8');
        return JSX_TEXT.test(text) || NAMED_ATTRIBUTE.test(text);
      })
      .map((path) => relative(PROFILES, path));
    expect(worded).toEqual([]);
  });
});

describe('DEFAULT_PROFILE_MESSAGES', () => {
  const { problem, renderProblem, smsMeter } = DEFAULT_PROFILE_MESSAGES;

  it('names the variable a problem is about', () => {
    expect(problem({ kind: 'text-empty', block: 'p1' })).toBe('This block is empty');
    expect(problem({ kind: 'variable-undeclared', block: 'p1', name: 'code' })).toBe(
      'This variable is not declared: {{code}}',
    );
  });

  it('names the variable and the place of its block', () => {
    expect(renderProblem({ kind: 'variable-missing', name: 'name', blockId: 'p1' }, 2)).toBe(
      'This variable has no sample value to preview: {{name}} (block 2)',
    );
  });

  it('names the region of a layout block, and the subject or preheader for no block', () => {
    expect(renderProblem({ kind: 'href-scheme-refused', name: 'site', blockId: 'f1', region: 'footer' })).toBe(
      'The link is not a web or mail address: {{site}} (in the footer)',
    );
    expect(renderProblem({ kind: 'variable-missing', name: 'name', blockId: null })).toBe(
      'This variable has no sample value to preview: {{name}} (in the subject or preheader)',
    );
  });

  it('names an unknown block by its type, not as a variable', () => {
    expect(renderProblem({ kind: 'unknown-block-type', name: 'poll', blockId: 'x1' })).toBe(
      'This block is of an unknown type: poll',
    );
  });

  it('reads the segments against the cap only when the profile allows several', () => {
    expect(smsMeter({ units: 16, limit: 160, encoding: 'gsm7', segments: 1, maxSegments: 1 })).toBe('16 / 160 GSM-7');
    expect(smsMeter({ units: 75, limit: 67, encoding: 'ucs2', segments: 2, maxSegments: 3 })).toBe(
      '75 / 67 UCS-2 - 2 of 3 segments',
    );
  });

  describe('the problem words', () => {
    it("tell a product block's lane count from column widths, and a lane holding lanes from columns", () => {
      const problem = (kind: Parameters<typeof DEFAULT_PROFILE_MESSAGES.problem>[0]['kind']) =>
        DEFAULT_PROFILE_MESSAGES.problem({ kind, block: 'b1' });
      expect(problem('lanes-count')).toBe('This block holds more or fewer lanes than it takes');
      expect(problem('lanes-mismatch')).toBe('The columns do not match their widths');
      expect(problem('block-nested-too-deep')).toBe('A block with lanes cannot sit inside a lane');
      expect(problem('content-invalid')).toBe('This block holds something its type does not read');
      expect(DEFAULT_PROFILE_MESSAGES.renderProblem({ blockId: 'b1', kind: 'lanes-count' })).toContain(
        'This block holds more or fewer lanes than it takes',
      );
    });
  });
});
