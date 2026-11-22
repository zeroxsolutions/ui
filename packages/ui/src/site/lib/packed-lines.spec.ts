// @vitest-environment node
import { describe, expect, it } from 'vitest';

import { packHighlightLines, unpackHighlightLines } from './packed-lines';

const keyword = { color: 'var(--code-keyword)' };
const text = { color: 'var(--code-fg)' };

describe('packHighlightLines', () => {
  it('unpacks to the same tokens, an empty line and an unstyled token included', () => {
    const code = "const a = 1;\n\nimport x from 'x';";
    const lines = [
      [{ content: 'const', style: keyword }, { content: ' a = 1', style: text }, { content: ';' }],
      [],
      [
        { content: 'import', style: keyword },
        { content: " x from 'x';", style: text },
      ],
    ];

    expect(unpackHighlightLines(packHighlightLines(lines, code), code)).toEqual(lines);
  });

  it('joins neighbouring tokens of one style, which paint the same', () => {
    const code = 'a b';
    const packed = packHighlightLines(
      [
        [
          { content: 'a', style: text },
          { content: ' b', style: text },
        ],
      ],
      code,
    );

    expect(unpackHighlightLines(packed, code)).toEqual([[{ content: 'a b', style: text }]]);
  });

  it('keeps a missing highlight as plain text', () => {
    expect(unpackHighlightLines(packHighlightLines(null, 'a'), 'a')).toBeNull();
    expect(unpackHighlightLines(undefined, 'a')).toBeNull();
  });

  it('refuses tokens that do not read as the code', () => {
    expect(() => packHighlightLines([[{ content: 'b' }]], 'a')).toThrow(/line 1/);
    expect(() => packHighlightLines([[{ content: 'a' }]], 'a\nb')).toThrow(/1 lines highlighted for 2/);
  });
});
