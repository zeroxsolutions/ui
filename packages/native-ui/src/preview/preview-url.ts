/** Reads which demo the preview draws, in which style and colour scheme, from its URL. */

type ColorScheme = 'light' | 'dark';

/** A style the native registries are built in, as each preview app's `preview-style.js` lists them. */
type PreviewStyle = 'vega' | 'nova';

/** Where an Expo link's own address ends and the path it hands the app begins. */
const DEEP_LINK_SEPARATOR = '/--/';

/**
 * The demo `?demo=` names, such as `button-demo` for
 * `/native-preview/index.html?style=nova&demo=button-demo`. The one `index.html` draws every demo.
 * @returns the name, or `undefined` when the query names none
 */
function demoNameFromSearch(search: string): string | undefined {
  const name = new URLSearchParams(search).get('demo');
  return name === null || name === '' ? undefined : name;
}

/**
 * The demo a link into the app names, such as `button-demo` for
 * `exp://u.expo.dev/<project>/--/button-demo?channel-name=nova`. Expo Go hands the app the path after
 * `/--/`; what comes before it, and the query, choose the update.
 * @param url - the link the app was opened with; `null` or `undefined` when it was opened without one
 * @returns the name, or `undefined` when the link carries no path
 */
function demoNameFromDeepLink(url: string | null | undefined): string | undefined {
  const separator = url?.indexOf(DEEP_LINK_SEPARATOR) ?? -1;
  if (url === null || url === undefined || separator === -1) return undefined;
  const [path = ''] = url.slice(separator + DEEP_LINK_SEPARATOR.length).split(/[?#]/);
  const name = path.replace(/\/$/, '');
  return name === '' ? undefined : name;
}

/**
 * The demo the app was opened on, read through `getInitialUrl`, which rejects on Android when the
 * launching intent cannot be read.
 * @returns the name, or `undefined` when there is no link, no path in it, or reading it failed
 */
async function initialDemoName(getInitialUrl: () => Promise<string | null | undefined>): Promise<string | undefined> {
  try {
    return demoNameFromDeepLink(await getInitialUrl());
  } catch {
    return undefined;
  }
}

/**
 * The style `value` names, such as the page's `?style=` or the `EXPO_PUBLIC_STYLE` a native update was
 * bundled with.
 * @returns `vega` or `nova`, or `undefined` for none or any other value
 */
function styleOf(value: string | null | undefined): PreviewStyle | undefined {
  return value === 'vega' || value === 'nova' ? value : undefined;
}

/**
 * The style `?style=` asks for.
 * @returns `vega` or `nova`, or `undefined` when the query holds neither
 */
function styleFromSearch(search: string): PreviewStyle | undefined {
  return styleOf(new URLSearchParams(search).get('style'));
}

/**
 * The colour scheme `?theme=` asks for.
 * @returns `light` or `dark`, or `undefined` when the query holds neither
 */
function themeFromSearch(search: string): ColorScheme | undefined {
  const theme = new URLSearchParams(search).get('theme');
  return theme === 'light' || theme === 'dark' ? theme : undefined;
}

export { demoNameFromDeepLink, demoNameFromSearch, initialDemoName, styleFromSearch, styleOf, themeFromSearch };
export type { ColorScheme, PreviewStyle };
