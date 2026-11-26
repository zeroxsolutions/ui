const ATOMS = [
  '{',
  '}',
  'a',
  'b',
  '_',
  '*',
  '**',
  '\\',
  '[',
  ']',
  '(',
  ')',
  ' ',
  '{{',
  '}}',
  '{a}',
  '{{a',
  'b}}',
  '**_**',
  '_**',
  '**_',
  '{{u}}',
  '{{a}}',
  '({{u}})',
  '{color=red}',
  '{/color}',
  '{bg=amber}',
  '{/bg}',
  '\\{',
];
const WRAPPERS: readonly (readonly [string, string])[] = [
  ['**[', ']({{u}})**'],
  ['_[', ']({{u}})_'],
  ['**_[', ']({{u}})_**'],
  ['{color=blue}[', ']({{u}}){/color}'],
];

/** Mulberry32: the same seed draws the same sequence on every run, so a failing input is found again. */
function seeded(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let mixed = Math.imul(state ^ (state >>> 15), 1 | state);
    mixed = (mixed + Math.imul(mixed ^ (mixed >>> 7), 61 | mixed)) ^ mixed;
    return ((mixed ^ (mixed >>> 14)) >>> 0) / 4294967296;
  };
}

/** `count` short sources built from markers, colour markers, braces, escapes, tokens and links, a third of them wrapped in a marked link. */
export function markupSamples(count: number, seed = 20261120): string[] {
  const next = seeded(seed);
  const pick = <T>(items: readonly T[]): T => items[Math.floor(next() * items.length)];
  const samples: string[] = [];
  for (let n = 0; n < count; n += 1) {
    let source = '';
    const length = 1 + Math.floor(next() * 12);
    for (let i = 0; i < length; i += 1) source += pick(ATOMS);
    if (next() < 1 / 3) {
      const [open, close] = pick(WRAPPERS);
      source = `${open}${source}${close}`;
    }
    samples.push(source);
  }
  return samples;
}
