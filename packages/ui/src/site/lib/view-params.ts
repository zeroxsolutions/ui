/** A theme a page is drawn in, whatever the reader chose for the site. */
export type PageTheme = 'light' | 'dark';

/** The search param that forces a page's theme, as a docs preview frames a demo's view page in the other theme. */
export const THEME_PARAM = 'theme';

/** The search param a frame loads a view page with, so the page leaves out the controls the frame's host has. */
export const EMBED_PARAM = 'embed';

/** The attribute on `<html>` an embedded view page carries, which its controls read to stay hidden. */
export const EMBED_ATTRIBUTE = 'data-embed';

const THEMES: readonly PageTheme[] = ['light', 'dark'];

/** The theme `search`'s `?theme=` forces; `undefined` for none or a value that is not a theme. */
export function forcedThemeOf(search: string): PageTheme | undefined {
  const asked = new URLSearchParams(search).get(THEME_PARAM);
  return THEMES.find((theme) => theme === asked);
}

/** `href`, a view page's path, as a frame loads it: embedded, in `theme`. */
export function embeddedViewHref(href: string, theme: PageTheme): string {
  return `${href}?${new URLSearchParams({ [EMBED_PARAM]: '1', [THEME_PARAM]: theme })}`;
}

/**
 * The body of the inline script that draws a view page as its query asks before the first paint: in the theme
 * `?theme=` forces, and embedded under `?embed=1`. The page is rendered at build with no query, so only the
 * browser knows either; the theme provider's own script ran earlier with the reader's stored theme, and the
 * provider forces the param's theme only once it hydrates. It writes nothing to `localStorage`, which the page
 * shares with every other tab of the site.
 */
export function viewPageScript(): string {
  const themes = JSON.stringify(THEMES);
  return `(function(){var q=new URLSearchParams(location.search),e=document.documentElement,t=q.get(${JSON.stringify(THEME_PARAM)});if(q.get(${JSON.stringify(EMBED_PARAM)})==='1')e.setAttribute(${JSON.stringify(EMBED_ATTRIBUTE)},'');if(${themes}.indexOf(t)<0)return;e.classList.remove.apply(e.classList,${themes});e.classList.add(t);e.style.colorScheme=t})();`;
}
