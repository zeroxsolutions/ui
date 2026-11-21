/**
 * The placeholder a subject, a preheader or a block's content names a variable by, and the two questions
 * a template asks of it: which names a value spells, and whether a translation spells the same ones.
 */

/** A `{{name}}` token. Global, so read it through `matchAll` or `replace`, neither of which leaves `lastIndex` behind. */
export const VARIABLE_TOKEN = /\{\{(\w+)\}\}/g;

/** Every variable name `value` spells, once per occurrence, reading strings nested in arrays and objects. */
export function variableTokens(value: unknown): string[] {
  if (typeof value === 'string') return Array.from(value.matchAll(VARIABLE_TOKEN), (match) => match[1]);
  if (Array.isArray(value)) return value.flatMap(variableTokens);
  if (value !== null && typeof value === 'object') return Object.values(value).flatMap(variableTokens);
  return [];
}

/** Whether `translation` spells exactly the names `source` does, each as many times; order is not compared. */
export function sameVariableTokens(source: unknown, translation: unknown): boolean {
  return countedTokens(source) === countedTokens(translation);
}

/** The names `value` spells, sorted and joined. A name is `\w+`, so no separator can occur inside one. */
function countedTokens(value: unknown): string {
  return variableTokens(value).sort().join('\n');
}
