import { demoNameFromPath, themeFromSearch } from './preview-url';

describe('demoNameFromPath', () => {
  it("takes the demo's name from the segment under the style's base", () => {
    expect(demoNameFromPath('/native-preview/vega/button-demo', '/native-preview/vega')).toBe('button-demo');
  });

  it('ignores a trailing slash and an .html suffix, as a static host may add either', () => {
    expect(demoNameFromPath('/native-preview/nova/button-demo/', '/native-preview/nova')).toBe('button-demo');
    expect(demoNameFromPath('/native-preview/nova/button-demo.html', '/native-preview/nova')).toBe('button-demo');
  });

  it('has no name for the base itself or its index.html', () => {
    expect(demoNameFromPath('/native-preview/vega/', '/native-preview/vega')).toBeUndefined();
    expect(demoNameFromPath('/native-preview/vega/index.html', '/native-preview/vega')).toBeUndefined();
  });

  it('reads the path from the root with no base, as the dev server serves it', () => {
    expect(demoNameFromPath('/button-demo', '')).toBe('button-demo');
  });
});

describe('themeFromSearch', () => {
  it('reads light or dark from ?theme=', () => {
    expect(themeFromSearch('?theme=dark')).toBe('dark');
    expect(themeFromSearch('?demo=x&theme=light')).toBe('light');
  });

  it('has no theme when ?theme= is absent or holds another value', () => {
    expect(themeFromSearch('')).toBeUndefined();
    expect(themeFromSearch('?theme=sepia')).toBeUndefined();
  });
});
