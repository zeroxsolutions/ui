import {
  demoNameFromDeepLink,
  demoNameFromSearch,
  initialDemoName,
  styleFromSearch,
  styleOf,
  themeFromSearch,
} from './preview-url';

describe('demoNameFromSearch', () => {
  it("takes the demo's name from ?demo=, beside the theme", () => {
    expect(demoNameFromSearch('?demo=button-demo')).toBe('button-demo');
    expect(demoNameFromSearch('?demo=button-demo&theme=dark')).toBe('button-demo');
  });

  it('has no name when ?demo= is absent or empty', () => {
    expect(demoNameFromSearch('')).toBeUndefined();
    expect(demoNameFromSearch('?theme=light')).toBeUndefined();
    expect(demoNameFromSearch('?demo=')).toBeUndefined();
  });
});

describe('demoNameFromDeepLink', () => {
  const update = 'exp://u.expo.dev/0f6c4b9e-2d1a-4c3b-9e8f-7a6b5c4d3e2f';

  it("takes the demo's name from the path after Expo Go's /--/, before the update's query", () => {
    expect(demoNameFromDeepLink(`${update}/--/button-demo?runtime-version=exposdk%3A58.0.0&channel-name=nova`)).toBe(
      'button-demo',
    );
  });

  it('reads the name from a dev server link and ignores a trailing slash', () => {
    expect(demoNameFromDeepLink('exp://192.168.1.20:8081/--/switch-demo/')).toBe('switch-demo');
  });

  it('has no name when the link carries no path, or an empty one', () => {
    expect(demoNameFromDeepLink(`${update}?channel-name=vega`)).toBeUndefined();
    expect(demoNameFromDeepLink(`${update}/--/?channel-name=vega`)).toBeUndefined();
  });

  it('has no name when the app was opened without a link', () => {
    expect(demoNameFromDeepLink(null)).toBeUndefined();
  });
});

describe('styleFromSearch', () => {
  it('reads vega or nova from ?style=, beside the demo and the theme', () => {
    expect(styleFromSearch('?style=nova&demo=button-demo&theme=dark')).toBe('nova');
    expect(styleFromSearch('?style=vega')).toBe('vega');
  });

  it('has no style when ?style= is absent or names a style the registries are not built in', () => {
    expect(styleFromSearch('?demo=button-demo')).toBeUndefined();
    expect(styleFromSearch('?style=lyra')).toBeUndefined();
  });
});

describe('styleOf', () => {
  it('reads the style a native update was bundled with', () => {
    expect(styleOf('nova')).toBe('nova');
  });

  it('has no style for an unset value', () => {
    expect(styleOf(undefined)).toBeUndefined();
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

describe('initialDemoName', () => {
  it('reads the demo from the link the app was opened with', async () => {
    await expect(initialDemoName(() => Promise.resolve('exp://host/--/button-demo'))).resolves.toBe('button-demo');
  });

  it('has no name when the app was opened without a link', async () => {
    await expect(initialDemoName(() => Promise.resolve(null))).resolves.toBeUndefined();
  });

  it('has no name when reading the link fails, so the list of demos shows rather than a blank app', async () => {
    await expect(
      initialDemoName(() => Promise.reject(new Error('Could not get the initial URL'))),
    ).resolves.toBeUndefined();
  });
});
