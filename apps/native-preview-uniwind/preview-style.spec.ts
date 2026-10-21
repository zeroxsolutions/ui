import { join } from 'node:path';
import { previewScreenSources, previewSources, previewStyle, sharedThemeFile } from './preview-style';

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
