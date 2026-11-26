// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { variableTokens } from '../variables/variable-tokens.js';
import {
  type InlineRun,
  type InlineText,
  parseInlineMarkup,
  plainInlineText,
  printInlineMarkup,
  sameInlineMarkup,
} from './inline-markup.js';
import { markupSamples } from './inline-markup.fixture.js';

const plain = (text: string): InlineText => ({ kind: 'text', text, bold: false, italic: false });

function runsOf(source: string): readonly InlineRun[] {
  const parsed = parseInlineMarkup(source);
  if (!parsed.ok) throw new Error(`refused ${source}: ${parsed.problem}`);
  return parsed.runs;
}

describe('parseInlineMarkup', () => {
  it('parses plain text as one run', () => {
    expect(runsOf('Hi {{name}},')).toEqual([plain('Hi {{name}},')]);
  });

  it('parses bold, italic and both', () => {
    expect(runsOf('a **b** _c_ **_d_**')).toEqual([
      plain('a '),
      { kind: 'text', text: 'b', bold: true, italic: false },
      plain(' '),
      { kind: 'text', text: 'c', bold: false, italic: true },
      plain(' '),
      { kind: 'text', text: 'd', bold: true, italic: true },
    ]);
  });

  it('parses a link with a marked label', () => {
    expect(runsOf('[Open **now**]({{trip_url}})')).toEqual([
      {
        kind: 'link',
        href: '{{trip_url}}',
        label: [plain('Open '), { kind: 'text', text: 'now', bold: true, italic: false }],
      },
    ]);
  });

  it('parses a variable token with an underscore as text', () => {
    expect(runsOf('{{first_name}}')).toEqual([plain('{{first_name}}')]);
  });

  it('resolves escapes', () => {
    expect(runsOf('\\*\\*x\\_ \\[y\\] \\\\')).toEqual([plain('**x_ [y] \\')]);
    expect(runsOf('\\n')).toEqual([plain('\\n')]);
  });

  it('keeps a backslash that ends the text as text', () => {
    expect(runsOf('a\\')).toEqual([plain('a\\')]);
  });

  it('keeps a lone star as text', () => {
    expect(runsOf('5 * 3')).toEqual([plain('5 * 3')]);
  });

  it.each([
    ['**a', 'marker-unclosed', 0],
    ['_a', 'marker-unclosed', 0],
    ['{{a****b}}', 'marker-inside-token', 0],
    ['{{a\\_b}}', 'marker-inside-token', 0],
    ['{{a\\_****b}}', 'marker-inside-token', 0],
    ['**{{a**__**b}}**', 'marker-inside-token', 2],
    ['{****{a}}', 'marker-inside-token', 0],
    ['{{a}****}', 'marker-inside-token', 0],
    ['{__{a}}', 'marker-inside-token', 0],
    ['{{a}__}', 'marker-inside-token', 0],
    ['[{****{a}}]({{u}})', 'marker-inside-token', 1],
    ['**{{a****}}**', 'marker-inside-token', 2],
    ['**[{**{a}**}]({{u}})**', 'marker-inside-token', 3],
    ['_[{_{a}_}]({{u}})_', 'marker-inside-token', 2],
    ['**[{{**a**}}]({{u}})**', 'marker-inside-token', 3],
    ['**_[**{{a**}}]({{u}})_**', 'marker-inside-token', 6],
    ['_{{a**_**b}} _{{c**_**d}}', 'marker-ambiguous', 0],
    ['{{**_**a}}_ {{**_**b}}_', 'marker-ambiguous', 2],
    ['_{{a**_**b}}', 'marker-ambiguous', 0],
    ['{{a**_**b}}', 'marker-unclosed', 5],
    ['{{**_**a}}', 'marker-unclosed', 4],
    ['[a', 'link-unclosed', 0],
    ['[a]', 'link-target-missing', 3],
    ['[a] ({{u}})', 'link-target-missing', 3],
    ['[a](https://x', 'link-unclosed', 3],
    ['[a](https://x\\)', 'link-unclosed', 3],
    ['[]({{u}})', 'link-label-empty', 0],
    ['[[a]({{u}})]({{v}})', 'link-nested', 1],
  ])('refuses %j as %s at %i', (source, problem, offset) => {
    expect(parseInlineMarkup(source)).toEqual({ ok: false, problem, offset });
  });
});

describe('printInlineMarkup', () => {
  it.each([
    'Hi {{name}},',
    'a **b** _c_ **_d_**',
    '[Open **now**]({{trip_url}})',
    '{{first_name}}',
    '\\*\\*x\\_ \\[y\\] \\\\',
    '\\n',
    '5 * 3',
    '**[a **b**]({{u}})**',
    '_[a _b_]({{u}})_',
  ])('prints what it parsed from %j', (source) => {
    expect(runsOf(printInlineMarkup(runsOf(source)))).toEqual(runsOf(source));
  });

  it("merges the marks folded into a label with the label's own", () => {
    expect(runsOf('**[a **b**]({{u}})**')).toEqual([
      { kind: 'link', href: '{{u}}', label: [{ kind: 'text', text: 'a b', bold: true, italic: false }] },
    ]);
  });

  it.each([
    ['a fixed href', '[a](https://x.test/a?b=1&c=2)', 'https://x.test/a?b=1&c=2'],
    ['an href with an inner token', '[a](https://x.test/?t={{token}})', 'https://x.test/?t={{token}}'],
    ['a single-token href', '[a]({{n}})', '{{n}}'],
    ['an href with markers, brackets and spaces', '[a](https://x/a_b*c [d] e)', 'https://x/a_b*c [d] e'],
    ['an escaped close paren and backslash', '[a](https://x/(a\\) \\\\ {{t}})', 'https://x/(a) \\ {{t}}'],
    ['an empty href', '[a]()', ''],
  ])('reads %s and prints it back as it came', (_case, source, href) => {
    expect(runsOf(source)).toEqual([{ kind: 'link', href, label: [plain('a')] }]);
    expect(printInlineMarkup(runsOf(source))).toBe(source);
  });

  it('reads a token in a label as text and prints it back as it came', () => {
    const source = '[Continue {{place}}](https://x.test/{{place_id}})';
    expect(runsOf(source)).toEqual([
      { kind: 'link', href: 'https://x.test/{{place_id}}', label: [plain('Continue {{place}}')] },
    ]);
    expect(printInlineMarkup(runsOf(source))).toBe(source);
  });

  it('prints a built href holding a close paren, a backslash and a token to a source that reads it back', () => {
    const runs: InlineRun[] = [{ kind: 'link', href: 'https://x/a) b\\c {{t}}', label: [plain('a')] }];
    expect(printInlineMarkup(runs)).toBe('[a](https://x/a\\) b\\\\c {{t}})');
    expect(runsOf(printInlineMarkup(runs))).toEqual(runs);
  });

  it.each([
    'a **b** _c_',
    '[Open **now**]({{trip_url}})',
    '**{{name}}**',
    '_{{first_name}}_',
    '[{{name}}]({{u}})',
    'Hi **there** _friend_',
    '**a [b]({{u}})**',
    '**[a]({{u}})**',
    '**Book _now_ today**',
    '**a _b_**',
    '_a **b**_',
    'x **bold _both_ end** y',
  ])('prints the canonical %j as it came', (source) => {
    expect(printInlineMarkup(runsOf(source))).toBe(source);
  });

  it('joins a mark closed and reopened with nothing between into one span', () => {
    expect(runsOf('**a****b**')).toEqual([{ kind: 'text', text: 'ab', bold: true, italic: false }]);
    expect(printInlineMarkup(runsOf('**a****b**'))).toBe('**ab**');
  });

  it('prints every accepted generated source back to the same runs and the same tokens', () => {
    let accepted = 0;
    const mismatches: unknown[] = [];
    for (const source of markupSamples(20000)) {
      const parsed = parseInlineMarkup(source);
      if (!parsed.ok) continue;
      accepted += 1;
      const printed = printInlineMarkup(parsed.runs);
      const reparsed = parseInlineMarkup(printed);
      const sameRuns = reparsed.ok && JSON.stringify(reparsed.runs) === JSON.stringify(parsed.runs);
      const sameTokens = variableTokens(printed).sort().join() === variableTokens(source).sort().join();
      if (!sameRuns || !sameTokens) mismatches.push({ source, printed, reparsed });
    }
    expect(mismatches.slice(0, 5)).toEqual([]);
    expect(accepted).toBeGreaterThan(2000);
  });

  it('escapes markers in text when printing', () => {
    expect(printInlineMarkup([plain('a*b_[c]\\')])).toBe('a\\*b\\_\\[c\\]\\\\');
  });

  it.each(['{{a*b}}', '{{x]}}', '**{{a*b}}**', '{{a\\\\b}}'])('prints %j back to a source that parses', (source) => {
    const parsed = parseInlineMarkup(source);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    expect(parseInlineMarkup(printInlineMarkup(parsed.runs))).toEqual(parsed);
  });

  it('prints every accepted tricky input to a source that spells the same tokens', () => {
    const sources = [
      '{{a}}',
      '{{a_b}} and {{a}}',
      '**{{a}}** _{{b}}_',
      '{{a*b}}',
      '{{x]}}',
      '{ {a}}',
      '{**{**a}}',
      '**a** **b**',
      '_a_ _b_',
      '**a**_b_**c**',
      '[{{a}}]({{u}})',
      '\\{{a}}',
      '{{a\\}}',
    ];
    const checked: unknown[] = [];
    const expected: unknown[] = [];
    for (const source of sources) {
      const parsed = parseInlineMarkup(source);
      if (!parsed.ok) continue;
      const printed = printInlineMarkup(parsed.runs);
      checked.push([source, parseInlineMarkup(printed).ok, variableTokens(printed).sort()]);
      expected.push([source, true, variableTokens(source).sort()]);
    }
    expect(checked).toEqual(expected);
  });
});

describe('plainInlineText', () => {
  it('drops markers, resolves escapes and reads a link as its label', () => {
    expect(plainInlineText('**Hi** [there]({{u}}) \\_')).toBe('Hi there _');
  });
});

describe('sameInlineMarkup', () => {
  it('holds for the same spans and links in another order', () => {
    expect(sameInlineMarkup('**a** [b]({{u}})', '[x]({{u}}) **y**')).toBe(true);
  });

  it.each([
    ['a dropped bold span', '**a** b', 'a b'],
    ['another link variable', '[a]({{u}})', '[a]({{v}})'],
    ['another variable inside a fixed href', '[a](https://x.test/?t={{u}})', '[a](https://x.test/?t={{v}})'],
    ['an added italic span', 'a b', 'a _b_'],
    ['a malformed translation', '**a**', '**a'],
  ])('refuses %s', (_case, source, translation) => {
    expect(sameInlineMarkup(source, translation)).toBe(false);
  });

  it('lets a translation point a fixed href at another page', () => {
    expect(sameInlineMarkup('[a](https://x.test/en)', '[b](https://x.test/vi)')).toBe(true);
    expect(sameInlineMarkup('[a](https://x.test/en?t={{u}})', '[b](https://x.test/vi?t={{u}})')).toBe(true);
  });

  it('counts a span that wraps another span or a link once', () => {
    expect(sameInlineMarkup('**Book _now_ today**', '**_Ngay_ dat hom nay**')).toBe(true);
    expect(sameInlineMarkup('**see [a]({{u}}) now**', '**[a]({{u}}) now**')).toBe(true);
  });

  it('compares a list item by item, in order, with as many items', () => {
    expect(sameInlineMarkup(['**a**', 'c'], ['**b**', 'd'])).toBe(true);
    expect(sameInlineMarkup(['**a**', 'c'], ['d', '**b**'])).toBe(false);
    expect(sameInlineMarkup(['**a**'], ['**a**', 'b'])).toBe(false);
    expect(sameInlineMarkup(['**a**'], ['b'])).toBe(false);
  });
});

describe('colour markers', () => {
  const coloured = (text: string, extra: Partial<InlineText>): InlineText => ({ ...plain(text), ...extra });

  it('parses a colour run', () => {
    expect(runsOf('a {color=red}b{/color}')).toEqual([plain('a '), coloured('b', { color: 'red' })]);
  });

  it('nests a colour in a background, bold inside both', () => {
    expect(runsOf('{bg=amber}{color=blue}**x**{/color}{/bg}')).toEqual([
      coloured('x', { bold: true, color: 'blue', background: 'amber' }),
    ]);
  });

  it('folds a colour opened around a link into its label', () => {
    expect(runsOf('{color=teal}[a]({{u}}){/color}')).toEqual([
      { kind: 'link', href: '{{u}}', label: [coloured('a', { color: 'teal' })] },
    ]);
  });

  it.each([
    'a {color=red}b{/color}',
    '{bg=amber}{color=blue}**x**{/color}{/bg}',
    '{color=red}**x**{/color}',
    '{color=muted}a{/color} {bg=pink}b{/bg}',
    '{color=teal}[a]({{u}}){/color}',
    '[a {color=red}b{/color}]({{u}})',
  ])('prints %j back as it came', (source) => {
    expect(printInlineMarkup(runsOf(source))).toBe(source);
  });

  it.each([
    ['an unclosed colour', '{color=red}x', 'color-unclosed', 0],
    ['an unclosed background', 'a {bg=red}x', 'color-unclosed', 2],
    ['a close with nothing open', 'x{/color}', 'color-unclosed', 1],
    ['a colour outside the set', '{color=magenta}x{/color}', 'color-token-unknown', 0],
    ['default, which is no colour', '{color=default}x{/color}', 'color-token-unknown', 0],
    ['a colour inside a colour', '{color=red}{color=blue}x{/color}{/color}', 'color-nested', 11],
    ['a colour in a label inside a colour', '{color=red}[{color=blue}x{/color}]({{u}}){/color}', 'color-nested', 12],
    ['a colour left open in a label', '[{color=red}x]({{u}}){/color}', 'color-unclosed', 1],
    ['an empty colour span that joins a token', '{{na{color=red}{/color}me}}', 'marker-inside-token', 0],
  ])('refuses %s', (_case, source, problem, offset) => {
    expect(parseInlineMarkup(source)).toEqual({ ok: false, problem, offset });
  });

  it.each(['a {b} c', '{{name}}', '{ color=red }', '{color=Red}', '{color=}', '{/colour}'])(
    'leaves the old string %j as one plain run',
    (source) => {
      expect(runsOf(source)).toEqual([plain(source)]);
      expect(printInlineMarkup(runsOf(source))).toBe(source);
    },
  );

  it('reads an escaped brace as the literal text of a marker', () => {
    expect(runsOf('\\{color=red}')).toEqual([plain('{color=red}')]);
    expect(printInlineMarkup([plain('{color=red} and {/bg}')])).toBe('\\{color=red} and \\{/bg}');
  });

  it('strips colour markers from the plain text', () => {
    expect(plainInlineText('a {color=red}**b**{/color} {bg=amber}c{/bg}')).toBe('a b c');
  });

  it('holds a translation to the colour spans its source has', () => {
    expect(sameInlineMarkup('a {color=red}b{/color}', 'x {color=red}y z{/color}')).toBe(true);
    expect(sameInlineMarkup('a {color=red}b{/color}', 'x y')).toBe(false);
    expect(sameInlineMarkup('a {color=red}b{/color}', 'x {color=blue}y{/color}')).toBe(false);
    expect(sameInlineMarkup('{bg=amber}a{/bg}', '{color=amber}a{/color}')).toBe(false);
  });
});
