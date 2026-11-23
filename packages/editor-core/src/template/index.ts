/** Message templates: the token grammar every channel shares, the inline markup a text may carry, interpolation and its html escape, redaction, display width. */
export { escapeHtml, interpolate } from './variables/interpolate.js';
export { redactVariables } from './variables/redact.js';
export { sameVariableTokens, VARIABLE_TOKEN, variableTokens } from './variables/variable-tokens.js';
export { VARIABLE_TYPES, type VariableType } from './variables/variable-type.js';
export type { Variables } from './variables/variables.js';
export { displayWidth } from './text/display-width.js';
export { type HrefProblem, hrefProblem, hrefProblems } from './markup/href.js';
export {
  type InlineLink,
  type InlineMarkupProblem,
  type InlineRun,
  type InlineText,
  type ParsedInlineMarkup,
  parseInlineMarkup,
  plainInlineText,
  printInlineMarkup,
  sameInlineMarkup,
} from './markup/inline-markup.js';
