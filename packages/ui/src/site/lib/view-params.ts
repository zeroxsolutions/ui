/** A theme a page is drawn in, whatever the reader chose for the site. */
export type PageTheme = 'light' | 'dark';

/** The search param that forces a page's theme, as a docs preview frames a demo's view page in the other theme. */
export const THEME_PARAM = 'theme';

const THEMES: readonly PageTheme[] = ['light', 'dark'];

/** The theme `search`'s `?theme=` forces; `undefined` for none or a value that is not a theme. */
export function forcedThemeOf(search: string): PageTheme | undefined {
  const asked = new URLSearchParams(search).get(THEME_PARAM);
  return THEMES.find((theme) => theme === asked);
}

/** `href`, a view page's path, in `theme`. */
export function themedViewHref(href: string, theme: PageTheme): string {
  return `${href}?${new URLSearchParams({ [THEME_PARAM]: theme })}`;
}

/**
 * The body of the inline script that draws a view page in the theme its `?theme=` forces before the first
 * paint: the theme provider's own script ran earlier with the reader's stored theme, as the page was rendered
 * at build with no query, and the provider forces the param's theme only once it hydrates. It writes nothing
 * to `localStorage`, which the page shares with every other tab of the site.
 */
export function forcedThemeScript(): string {
  const themes = JSON.stringify(THEMES);
  return `(function(){var t=new URLSearchParams(location.search).get(${JSON.stringify(THEME_PARAM)});if(${themes}.indexOf(t)<0)return;var e=document.documentElement;e.classList.remove.apply(e.classList,${themes});e.classList.add(t);e.style.colorScheme=t})();`;
}
