/**
 * cmdk's fuzzy scorer, from cmdk 1.1.1 (src/command-score.ts), which upstream's Command filters with.
 * cmdk's package entry pulls in react-dom, so the scorer is copied here rather than imported.
 *
 * MIT License, Copyright (c) 2022 Paco Coursey. Permission is hereby granted, free of charge, to any person
 * obtaining a copy of this software and associated documentation files (the "Software"), to deal in the
 * Software without restriction, including without limitation the rights to use, copy, modify, merge, publish,
 * distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions: The above copyright notice and this permission
 * notice shall be included in all copies or substantial portions of the Software. THE SOFTWARE IS PROVIDED
 * "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
 * MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
 * COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT
 * OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

// The score of a letter that follows the previous match directly, after a space or dash, after another word
// break, or after any other skipped letters.
const SCORE_CONTINUE_MATCH = 1;
const SCORE_SPACE_WORD_JUMP = 0.9;
const SCORE_NON_SPACE_WORD_JUMP = 0.8;
const SCORE_CHARACTER_JUMP = 0.17;
// Two letters typed the wrong way round still match, at this fraction of the score.
const SCORE_TRANSPOSITION = 0.1;
// Each letter or word break skipped, a letter of the other case, and letters left over after the last match.
const PENALTY_SKIPPED = 0.999;
const PENALTY_CASE_MISMATCH = 0.9999;
const PENALTY_NOT_COMPLETE = 0.99;

const IS_GAP_REGEXP = /[\\/_+.#"@[({&]/;
const COUNT_GAPS_REGEXP = /[\\/_+.#"@[({&]/g;
const IS_SPACE_REGEXP = /[\s-]/;
const COUNT_SPACE_REGEXP = /[\s-]/g;

function commandScoreInner(
  value: string,
  abbreviation: string,
  lowerValue: string,
  lowerAbbreviation: string,
  valueIndex: number,
  abbreviationIndex: number,
  memo: Record<string, number>,
): number {
  if (abbreviationIndex === abbreviation.length) {
    return valueIndex === value.length ? SCORE_CONTINUE_MATCH : PENALTY_NOT_COMPLETE;
  }
  const memoKey = `${valueIndex},${abbreviationIndex}`;
  const memoised = memo[memoKey];
  if (memoised !== undefined) return memoised;

  const abbreviationChar = lowerAbbreviation.charAt(abbreviationIndex);
  let index = lowerValue.indexOf(abbreviationChar, valueIndex);
  let highScore = 0;
  while (index >= 0) {
    let score = commandScoreInner(
      value,
      abbreviation,
      lowerValue,
      lowerAbbreviation,
      index + 1,
      abbreviationIndex + 1,
      memo,
    );
    if (score > highScore) {
      if (index === valueIndex) {
        score *= SCORE_CONTINUE_MATCH;
      } else if (IS_GAP_REGEXP.test(value.charAt(index - 1))) {
        score *= SCORE_NON_SPACE_WORD_JUMP;
        const wordBreaks = value.slice(valueIndex, index - 1).match(COUNT_GAPS_REGEXP);
        if (wordBreaks && valueIndex > 0) score *= PENALTY_SKIPPED ** wordBreaks.length;
      } else if (IS_SPACE_REGEXP.test(value.charAt(index - 1))) {
        score *= SCORE_SPACE_WORD_JUMP;
        const spaceBreaks = value.slice(valueIndex, index - 1).match(COUNT_SPACE_REGEXP);
        if (spaceBreaks && valueIndex > 0) score *= PENALTY_SKIPPED ** spaceBreaks.length;
      } else {
        score *= SCORE_CHARACTER_JUMP;
        if (valueIndex > 0) score *= PENALTY_SKIPPED ** (index - valueIndex);
      }
      if (value.charAt(index) !== abbreviation.charAt(abbreviationIndex)) score *= PENALTY_CASE_MISMATCH;
    }

    if (
      (score < SCORE_TRANSPOSITION &&
        lowerValue.charAt(index - 1) === lowerAbbreviation.charAt(abbreviationIndex + 1)) ||
      (lowerAbbreviation.charAt(abbreviationIndex + 1) === lowerAbbreviation.charAt(abbreviationIndex) &&
        lowerValue.charAt(index - 1) !== lowerAbbreviation.charAt(abbreviationIndex))
    ) {
      const transposedScore = commandScoreInner(
        value,
        abbreviation,
        lowerValue,
        lowerAbbreviation,
        index + 1,
        abbreviationIndex + 2,
        memo,
      );
      if (transposedScore * SCORE_TRANSPOSITION > score) score = transposedScore * SCORE_TRANSPOSITION;
    }

    if (score > highScore) highScore = score;
    index = lowerValue.indexOf(abbreviationChar, index + 1);
  }

  memo[memoKey] = highScore;
  return highScore;
}

function formatInput(input: string): string {
  return input.toLowerCase().replace(COUNT_SPACE_REGEXP, ' ');
}

/**
 * How well `abbreviation`, the typed text, matches `value` or its `aliases`: 1 for an exact match, less the
 * more letters it skips and the fewer it matches at word starts, and 0 when the value does not hold the typed
 * letters in order.
 */
function commandScore(value: string, abbreviation: string, aliases?: readonly string[]): number {
  const searched = aliases && aliases.length > 0 ? `${value} ${aliases.join(' ')}` : value;
  return commandScoreInner(searched, abbreviation, formatInput(searched), formatInput(abbreviation), 0, 0, {});
}

export { commandScore };
