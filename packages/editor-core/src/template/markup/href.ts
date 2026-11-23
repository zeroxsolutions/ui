import type { VariableType } from '../variables/variable-type.js';

/** The schemes an href may open with as written: a page, or an address to write to. */
const FIXED_SCHEME = /^(?:https?:\/\/|mailto:)/i;

/** The `{{name}}` token an href opens with, if it opens with one. */
const LEADING_TOKEN = /^\{\{(\w+)\}\}/;

/** The name of the token `href`, trimmed, opens with, or undefined when it opens with anything else. */
export function leadingToken(href: string): string | undefined {
  return LEADING_TOKEN.exec(href.trim())?.[1];
}

/**
 * Whether `href`, a button's or a link's target holding `{{name}}` tokens, can be sent. It can when,
 * trimmed, it opens with a literal `https://`, `http://` or `mailto:`, or with a token `typeOf` answers
 * `url` for; a token anywhere after that may be of any type. `typeOf` answers undefined for an undeclared
 * name, which cannot open an href.
 */
export function hrefProblem(href: string, typeOf: (name: string) => VariableType | undefined): 'href-invalid' | null {
  const trimmed = href.trim();
  if (FIXED_SCHEME.test(trimmed)) return null;
  const name = leadingToken(trimmed);
  return name !== undefined && typeOf(name) === 'url' ? null : 'href-invalid';
}
