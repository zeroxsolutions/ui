import type { ColorScheme } from './preview-url';

/** The part of a CSSOM rule this module reads: its text, its nested rules and its media condition. */
interface CssRuleLike {
  readonly cssText: string;
  readonly cssRules?: ArrayLike<CssRuleLike>;
  readonly media?: { mediaText: string };
}

/** The part of a CSSOM stylesheet this module reads; reading `cssRules` throws on a cross-origin one. */
interface StyleSheetLike {
  readonly cssRules: ArrayLike<CssRuleLike>;
}

const DARK_QUERY = /\(\s*prefers-color-scheme\s*:\s*dark\s*\)/;

/**
 * Sets every `@media (prefers-color-scheme: dark)` rule in `sheets` to match always, for `dark`, or
 * never, for `light`. The theme puts its dark variables behind that query, which on web follows only
 * the system's setting, so this is how a `?theme=` reaches them. A sheet whose rules the browser
 * refuses to expose, such as a cross-origin one, is skipped.
 */
function pinColorScheme(sheets: ArrayLike<StyleSheetLike>, scheme: ColorScheme): void {
  const visit = (rule: CssRuleLike): void => {
    if (rule.media && DARK_QUERY.test(rule.media.mediaText)) {
      rule.media.mediaText = scheme === 'dark' ? 'all' : 'not all';
    }
    for (const child of Array.from(rule.cssRules ?? [])) visit(child);
  };
  for (const sheet of Array.from(sheets)) {
    let rules: ArrayLike<CssRuleLike>;
    try {
      rules = sheet.cssRules;
    } catch {
      continue;
    }
    for (const rule of Array.from(rules)) visit(rule);
  }
}

export { pinColorScheme };
export type { CssRuleLike, StyleSheetLike };
