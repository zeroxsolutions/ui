import { join } from 'node:path';
import { previewSources, previewStyle, sharedThemeFile } from './preview-style';

describe('previewStyle', () => {
  it('takes vega or nova from EXPO_PUBLIC_STYLE', () => {
    expect(previewStyle('nova')).toBe('nova');
    expect(previewStyle('vega')).toBe('vega');
  });

  it('draws vega, the native default, with no EXPO_PUBLIC_STYLE', () => {
    expect(previewStyle(undefined)).toBe('vega');
  });

  it('throws on a style the native registries are not built in', () => {
    expect(() => previewStyle('lyra')).toThrow('EXPO_PUBLIC_STYLE is lyra; the native preview draws vega or nova');
  });
});

describe('previewSources', () => {
  it("points at NativeWind's emitted sources of the style", () => {
    expect(previewSources('nova')).toBe(join(__dirname, '../../packages/native-ui/dist/src/nativewind-nova'));
  });
});

describe('sharedThemeFile', () => {
  it.each(['global.css', 'tailwind-theme.json'])("takes %s, which every style shares, from vega's sources", (name) => {
    expect(sharedThemeFile(name)).toBe(join(previewSources('vega'), name));
  });
});
