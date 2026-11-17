import { createStaticRoute } from '@zeroxsolutions/routing';
import { defineSearch, text } from '@zeroxsolutions/routing/search';

import { STYLE_PARAM } from './style-choice';

/**
 * The search params of the icons page at `pathname`: `q`, the name the reader searched for, and the
 * style the page is drawn in, which a search keeps. Built from the page's own path because the gallery
 * serves the web page and the native one, whose route units live in packages it may not import.
 */
export function iconSearch(pathname: string) {
  return defineSearch(
    createStaticRoute(pathname, () => pathname),
    { q: text({ max: 100 }), [STYLE_PARAM]: text({ max: 40 }) },
  );
}

/** The search of an icons page, as `iconSearch` builds it. */
export type IconSearch = ReturnType<typeof iconSearch>;
