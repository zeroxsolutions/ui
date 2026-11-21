import { VARIABLE_TOKEN } from './variable-tokens.js';
import type { Variables } from './variables.js';

/**
 * The five characters an html document reads as markup, escaped with `&` first. Escaping `<` or `"`
 * before it would turn the entity this step just wrote (`&lt;`, `&quot;`) into a second, wrong one
 * (`&amp;lt;`) the moment `&` ran after them.
 */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Fills every `{{name}}` token in `template` from `variables`, escaping the filled value on the
 * `html` arm and never on `text`. A variable value reaches this service from a person, `{{name}}`
 * being a display name a traveller typed, so it is attacker-controlled whatever it looks like. A name
 * absent from `variables`, or redacted to null, fills as empty, since a render has no way to hand the
 * token back for a person to retype.
 */
export function interpolate(template: string, variables: Variables, arm: 'html' | 'text'): string {
  return template.replace(VARIABLE_TOKEN, (_token, name: string) => {
    // Own string values only: `{{constructor}}` would otherwise read a function off the prototype.
    const held = Object.hasOwn(variables, name) ? variables[name] : null;
    const value = typeof held === 'string' ? held : '';
    return arm === 'html' ? escapeHtml(value) : value;
  });
}
