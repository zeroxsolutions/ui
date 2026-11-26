/** Message templates: the token grammar every channel shares, the inline markup a text may carry, interpolation and its html escape, redaction, display width, and the block layout model. */
export { escapeHtml, interpolate } from './variables/interpolate.js';
export { redactVariables } from './variables/redact.js';
export { sameVariableTokens, VARIABLE_TOKEN, variableTokens } from './variables/variable-tokens.js';
export { VARIABLE_TYPES, type VariableType } from './variables/variable-type.js';
export type { Variables } from './variables/variables.js';
export { displayWidth } from './text/display-width.js';
export { type HrefProblem, hrefProblem, hrefProblems, leadingToken } from './markup/href.js';
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
export {
  ALIGNS,
  BREAKPOINTS,
  COLOR_TOKENS,
  DOCUMENT_CONTENT_WIDTH,
  HUES,
  LAYOUT_NODES,
  layoutSchema,
  PARAGRAPH_SIZES,
  RATIO_SNAPS,
  ratioFractions,
  readLayout,
  SECTION_BACKGROUNDS,
  SECTION_PADDINGS,
  SECTION_WIDTHS,
  snapRatio,
  snapWidth,
  SPACES,
  TEXT_ALIGN_NODES,
  TEXT_ALIGNS,
  VALIGNS,
  WIDTH_MIN,
  WIDTH_STEP,
  widthFromPixels,
  type Breakpoint,
  type ColorToken,
  type Hue,
  type Layout,
  type LayoutAlign,
  type LayoutNodeType,
  type LayoutSpace,
  type LayoutWidth,
  type ParagraphSize,
  type SectionBackground,
  type SectionLayout,
  type SectionWidth,
  type TextAlign,
  type VAlign,
} from './layout/index.js';
