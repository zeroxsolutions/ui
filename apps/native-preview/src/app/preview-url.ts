/** Reads which demo the preview draws, and in which colour scheme, from its URL. */

type ColorScheme = 'light' | 'dark';

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
 * The colour scheme `?theme=` asks for.
 * @returns `light` or `dark`, or `undefined` when the query holds neither
 */
function themeFromSearch(search: string): ColorScheme | undefined {
  const theme = new URLSearchParams(search).get('theme');
  return theme === 'light' || theme === 'dark' ? theme : undefined;
}

export { demoNameFromPath, themeFromSearch };
export type { ColorScheme };
