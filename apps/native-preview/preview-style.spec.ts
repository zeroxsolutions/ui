import { previewStyle } from './preview-style';

describe('previewStyle', () => {
  it('takes the style PREVIEW_STYLE names', () => {
    expect(previewStyle('nova')).toBe('nova');
  });

  it('draws vega, the native default, with no PREVIEW_STYLE', () => {
    expect(previewStyle(undefined)).toBe('vega');
  });

  it('throws on a style the native registries are not built in', () => {
    expect(() => previewStyle('base-nova')).toThrow(
      'PREVIEW_STYLE is base-nova; the native preview draws vega, luma, lyra, maia, mira, nova, rhea, sera',
    );
  });
});
