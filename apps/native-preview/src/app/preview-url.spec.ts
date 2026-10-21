import { demoNameFromDeepLink, demoNameFromPath, initialDemoName, themeFromSearch } from './preview-url';

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
