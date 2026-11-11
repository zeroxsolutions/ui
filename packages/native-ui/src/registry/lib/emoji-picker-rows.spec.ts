import { readFileSync } from 'node:fs';
import { EMOJI_CATEGORIES, type EmojiDatum } from '@zeroxsolutions/fluent-emoji/catalog';
import ts from 'typescript';
import { emojiPickerRows, type EmojiPickerSection } from './emoji-picker-rows';

const WEB_SOURCE = readFileSync(
  require.resolve('@zeroxsolutions/ui/registry/bases/base-ui/components/data-entry/emoji-picker.tsx'),
  'utf8',
);

/**
 * The web picker's own `emojiPickerRows`, with the column count it reads, cut from its source and run: the web
 * file loads the package root and the web's own components, which do not load under React Native's Jest.
 */
const webRows = ((): typeof emojiPickerRows => {
  const columns = /^const COLUMNS = \d+;$/m.exec(WEB_SOURCE)?.[0];
  const start = WEB_SOURCE.indexOf('function emojiPickerRows(');
  const end = WEB_SOURCE.indexOf('\n}\n', start);
  if (!columns || start < 0 || end < 0) throw new Error('emojiPickerRows is not in the web source');
  const source = `${columns}\n${WEB_SOURCE.slice(start, end + 2)}\nmodule.exports = emojiPickerRows;`;
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  });
  const module = { exports: {} as typeof emojiPickerRows };
  new Function('module', outputText)(module);
  return module.exports;
})();

const CATALOG: EmojiPickerSection[] = EMOJI_CATEGORIES.map((category) => ({ ...category }));
const FREQUENT: EmojiPickerSection = {
  id: 'frequent',
  name: 'Frequently used',
  emojis: ['\u{1F355}', '\u{1F389}'].map((e) => ({ e, n: e, k: '' })),
};
const EVERY_EMOJI: EmojiDatum[] = EMOJI_CATEGORIES.flatMap((category) => category.emojis);

describe('emojiPickerRows', () => {
  it("lays the whole catalog out as the web's picker does, with a frequent row and without", () => {
    expect(emojiPickerRows(CATALOG, null)).toEqual(webRows(CATALOG, null));
    expect(emojiPickerRows([FREQUENT, ...CATALOG], null)).toEqual(webRows([FREQUENT, ...CATALOG], null));
  });

  it("lays search results out as the web's picker does, from none to the whole catalog", () => {
    for (const results of [[], EVERY_EMOJI.slice(0, 3), EVERY_EMOJI.slice(0, 16), EVERY_EMOJI]) {
      expect(emojiPickerRows(CATALOG, results)).toEqual(webRows(CATALOG, results));
    }
  });
});
