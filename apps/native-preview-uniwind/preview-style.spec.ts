import { join } from 'node:path';
import { previewScreenSources, previewSources, previewStyle, sharedThemeFile } from './preview-style';

describe('previewStyle', () => {
  it.each(['vega', 'luma', 'lyra', 'maia', 'mira', 'nova', 'rhea', 'sera'])(
    'takes %s from EXPO_PUBLIC_STYLE',
    (style) => {
      expect(previewStyle(style)).toBe(style);
    },
  );

  it('draws vega, the native default, with no EXPO_PUBLIC_STYLE', () => {
    expect(previewStyle(undefined)).toBe('vega');
  });

  it('throws on a style the native registries are not built in', () => {
    expect(() => previewStyle('base-nova')).toThrow(
      'EXPO_PUBLIC_STYLE is base-nova; the native preview draws vega, luma, lyra, maia, mira, nova, rhea, sera',
    );
  });
});

describe('previewSources', () => {
  it("points at Uniwind's emitted sources of the style", () => {
    expect(previewSources('nova')).toBe(join(__dirname, '../../packages/native-ui/dist/src/uniwind-nova'));
  });
});

describe('previewScreenSources', () => {
  it("points at native-ui's preview screen", () => {
    expect(previewScreenSources()).toBe(join(__dirname, '../../packages/native-ui/src/preview'));
  });
});

describe('sharedThemeFile', () => {
  it("takes zui-theme.css, which every style shares, from vega's sources", () => {
    expect(sharedThemeFile('zui-theme.css')).toBe(join(previewSources('vega'), 'zui-theme.css'));
  });
});
