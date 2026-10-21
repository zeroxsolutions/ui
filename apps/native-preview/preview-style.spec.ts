import { join } from 'node:path';
import { previewSources, previewStyle } from './preview-style';

describe('previewStyle', () => {
  it('takes vega or nova from STYLE', () => {
    expect(previewStyle('nova')).toBe('nova');
    expect(previewStyle('vega')).toBe('vega');
  });

  it('draws vega, the native default, with no STYLE', () => {
    expect(previewStyle(undefined)).toBe('vega');
  });

  it('throws on a style the native registries are not built in', () => {
    expect(() => previewStyle('lyra')).toThrow('STYLE is lyra; the native preview draws vega or nova');
  });
});

describe('previewSources', () => {
  it("points at NativeWind's emitted sources of the style", () => {
    expect(previewSources('nova')).toBe(join(__dirname, '../../packages/native-ui/dist/src/nativewind-nova'));
  });
});
