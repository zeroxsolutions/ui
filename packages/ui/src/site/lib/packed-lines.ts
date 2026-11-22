import type { CSSProperties } from 'react';

import type { HighlightLine, HighlightToken } from '../../../registry/bases/base-ui/lib/shiki';

/** Each distinct token style once, then each line as flat `length, style index` pairs over them. */
type PackedLines = [(CSSProperties | null)[], number[][]];

/**
 * `lines`, the highlighted lines of `code`, as the JSON a docs page carries them in: each token as its
 * length and an index into the page's styles, the text left to `code`. A docs page compiles into the
 * docs site's worker, and the tokens written out in full, text and style object each, are most of its
 * size. `null` packs as `null`. Throws where a line's tokens do not read as that line of `code`, since
 * `unpackHighlightLines` takes each token's text back from `code`.
 */
export function packHighlightLines(lines: HighlightLine[] | null, code: string): string {
  if (!lines) return 'null';
  const sourceLines = code.split('\n');
  if (lines.length !== sourceLines.length) {
    throw new Error(`packHighlightLines: ${lines.length} lines highlighted for ${sourceLines.length} of code`);
  }
  const styles: (CSSProperties | null)[] = [];
  const styleIndex = new Map<string, number>();
  const packed = lines.map((line, row) => {
    if (line.map((token) => token.content).join('') !== sourceLines[row]) {
      throw new Error(`packHighlightLines: line ${row + 1}'s tokens do not read as the code's`);
    }
    const pairs: number[] = [];
    for (const token of line) {
      if (token.content.length === 0) continue;
      const style = token.style ?? null;
      const key = JSON.stringify(style);
      let index = styleIndex.get(key);
      if (index === undefined) {
        index = styles.push(style) - 1;
        styleIndex.set(key, index);
      }
      if (pairs.length > 0 && pairs[pairs.length - 1] === index) pairs[pairs.length - 2] += token.content.length;
      else pairs.push(token.content.length, index);
    }
    return pairs;
  });
  return JSON.stringify([styles, packed] satisfies PackedLines);
}

/**
 * The highlighted lines `packHighlightLines` packed for `code`, which has to be the code it packed them
 * for. `null` where `packed` is missing or packs `null`, which a code card shows as plain text.
 */
export function unpackHighlightLines(packed: string | undefined, code: string): HighlightLine[] | null {
  if (!packed) return null;
  const value = JSON.parse(packed) as PackedLines | null;
  if (!value) return null;
  const [styles, lines] = value;
  const sourceLines = code.split('\n');
  return lines.map((pairs, row) => {
    const text = sourceLines[row] ?? '';
    const tokens: HighlightToken[] = [];
    let at = 0;
    for (let pair = 0; pair < pairs.length; pair += 2) {
      const content = text.slice(at, at + pairs[pair]);
      at += pairs[pair];
      const style = styles[pairs[pair + 1]];
      tokens.push(style ? { content, style } : { content });
    }
    return tokens;
  });
}
