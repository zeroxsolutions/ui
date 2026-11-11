import { readFileSync } from 'node:fs';
import ts from 'typescript';
import { avatarPickerCheckColor } from './avatar-picker-check-color';

const WEB_SOURCE = readFileSync(
  require.resolve('@zeroxsolutions/ui/registry/bases/base-ui/components/data-entry/avatar-picker.tsx'),
  'utf8',
);

/**
 * The web picker's own `avatarPickerCheckColor`, cut from its source and run: the web file loads the web's own
 * components, which do not load under React Native's Jest, and does not export it.
 */
const webCheckColor = ((): typeof avatarPickerCheckColor => {
  const start = WEB_SOURCE.indexOf('function avatarPickerCheckColor(');
  const end = WEB_SOURCE.indexOf('\n}\n', start);
  if (start < 0 || end < 0) throw new Error('avatarPickerCheckColor is not in the web source');
  const source = `${WEB_SOURCE.slice(start, end + 2)}\nmodule.exports = avatarPickerCheckColor;`;
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  });
  const module = { exports: {} as typeof avatarPickerCheckColor };
  new Function('module', outputText)(module);
  return module.exports;
})();

/** Every grey from black to white, and each channel alone, in #rrggbb and in #rgb, with the cases mixed. */
const SWATCHES = [
  ...Array.from({ length: 256 }, (_, level) => `#${level.toString(16).padStart(2, '0').repeat(3)}`),
  ...Array.from({ length: 256 }, (_, level) => `#${level.toString(16).padStart(2, '0')}0000`),
  ...Array.from({ length: 256 }, (_, level) => `#00${level.toString(16).padStart(2, '0').toUpperCase()}00`),
  ...Array.from({ length: 256 }, (_, level) => `#0000${level.toString(16).padStart(2, '0')}`),
  ...Array.from({ length: 4096 }, (_, value) => `#${value.toString(16).padStart(3, '0')}`),
];

describe('avatarPickerCheckColor', () => {
  it("picks the check colour the web's picker picks for every grey, every channel and every #rgb", () => {
    expect(SWATCHES.map(avatarPickerCheckColor)).toEqual(SWATCHES.map(webCheckColor));
  });

  it("falls back as the web's picker does for a colour it cannot read", () => {
    const unreadable = ['red', 'rgb(0 0 0)', '#ffff', '#fffffff', 'ffffff', '', '#ggg'];
    expect(unreadable.map(avatarPickerCheckColor)).toEqual(unreadable.map(webCheckColor));
  });
});
