/** Reads which demo the preview draws, and in which colour scheme, from its URL. */

type ColorScheme = 'light' | 'dark';

/** Where an Expo link's own address ends and the path it hands the app begins. */
const DEEP_LINK_SEPARATOR = '/--/';

/**
 * The demo a path names under `baseUrl`, such as `button-demo` for `/native-preview/vega/button-demo`
 * under `/native-preview/vega`. A trailing slash and an `.html` suffix, which a static host may add, are
 * dropped.
 * @param baseUrl - the base the app is served under, `''` at the root
 * @returns the name, or `undefined` for the base itself or its `index.html`
 */
function demoNameFromPath(pathname: string, baseUrl: string): string | undefined {
  const underBase = pathname.startsWith(baseUrl) ? pathname.slice(baseUrl.length) : pathname;
  const name = underBase
    .replace(/\/$/, '')
    .replace(/\.html$/, '')
    .replace(/^\//, '');
  return name === '' || name === 'index' ? undefined : name;
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
 * The colour scheme `?theme=` asks for.
 * @returns `light` or `dark`, or `undefined` when the query holds neither
 */
function themeFromSearch(search: string): ColorScheme | undefined {
  const theme = new URLSearchParams(search).get('theme');
  return theme === 'light' || theme === 'dark' ? theme : undefined;
}

export { demoNameFromDeepLink, demoNameFromPath, initialDemoName, themeFromSearch };
export type { ColorScheme };
