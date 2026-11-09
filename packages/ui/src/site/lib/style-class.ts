import { DEFAULT_PLATFORM_STYLE, PLATFORM_STYLES } from '../constants/platform-styles';
import { styleKey } from '../hooks/use-remembered-choice';
import type { Platform, PlatformStyle } from '../types/platform';
import { STYLE_PARAM } from './style-choice';

/** The class on `<html>` the style sheets draw `style` under, as upstream's sheets scope each style. */
export function styleClass(style: string): string {
  return `style-${style}`;
}

/**
 * Puts `style`'s class on `root` in place of any other style of `platform`, leaving its other classes,
 * the theme's among them.
 */
export function applyStyleClass<P extends Platform>(root: Element, platform: P, style: PlatformStyle<P>): void {
  root.classList.remove(...PLATFORM_STYLES[platform].map(styleClass));
  root.classList.add(styleClass(style));
}

/**
 * The body of the inline script that puts the page's style on `<html>` before the first paint, as
 * `currentStyle` chooses it: the URL's `?style=`, else the reader's last choice, else the default. The
 * pages are rendered once at build with the default, so only the browser knows the others; without the
 * script a page in another style would first paint in the default. It repeats `applyStyleClass`, because
 * it runs before any module loads.
 */
export function styleClassScript(platform: Platform): string {
  const styles = JSON.stringify(PLATFORM_STYLES[platform]);
  return `(function(){var s=${styles},d=${JSON.stringify(DEFAULT_PLATFORM_STYLE[platform])},r=null;try{r=localStorage.getItem(${JSON.stringify(styleKey(platform))})}catch(e){}var u=new URLSearchParams(location.search).get(${JSON.stringify(STYLE_PARAM)});var c=s.indexOf(u)>=0?u:s.indexOf(r)>=0?r:d;var e=document.documentElement;s.forEach(function(x){e.classList.remove(${JSON.stringify(styleClass(''))}+x)});e.classList.add(${JSON.stringify(styleClass(''))}+c)})();`;
}
