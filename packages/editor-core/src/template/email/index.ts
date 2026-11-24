/** The email renderer: a theme and a product's CSS, overridable blocks and layout, and block types a product adds. */
export {
  defineBlockType,
  type BlockDefinition,
  type BlockRenderer,
  type BlockRendering,
  type BlockSample,
  type BlockView,
  type EmailBlock,
  type RenderContext,
  type RenderedBlock,
  type RenderProblem,
  type RenderProblemKind,
} from './block.js';
export {
  BLOCK_TEXT_MAX_LENGTH,
  BUTTON_HREF_MAX_LENGTH,
  BUTTON_LABEL_MAX_LENGTH,
  LIST_MAX_ITEMS,
} from './blocks/shared.js';
export { MAX_LANES } from './blocks/columns.js';
export {
  defaultBlocks,
  LIBRARY_BLOCK_PAIRS,
  libraryBlocks,
  type DefaultBlocks,
  type DefaultBlockType,
  type LibraryBlockType,
} from './blocks/index.js';
export {
  defineEmailBlock,
  BlockDefinitionInvalid,
  type EmailBlockAttributes,
  type EmailBlockContent,
  type EmailBlockDefinition,
  type BlockEditor,
  type BlockEditorAttribute,
  type BlockEditorField,
  type BlockEditorItems,
  type EmailBlockItem,
  type EmailBlockFields,
  type EmailBlockOptions,
  type EmailBlockView,
} from './define-email-block.js';
export {
  choice,
  imageUrl,
  items,
  ITEMS_MAX,
  lanes,
  link,
  number,
  plainText,
  richText,
  toggle,
  type ChoiceAttribute,
  type EmailBlockAttribute,
  type EmailBlockField,
  type ImageUrlField,
  type ItemField,
  type ItemsField,
  type LanesField,
  type LinkField,
  type NumberAttribute,
  type PlainTextField,
  type RichTextField,
  type ToggleAttribute,
} from './fields.js';
export { defaultLayout, type DefaultLayoutProps, type EmailLayout, type LayoutInput } from './layout.js';
export { REGIONS, type Region, type RegionInput } from './region.js';
export {
  BlockTypeCollision,
  createEmailRenderer,
  sameBlockContent,
  type BlockOverrides,
  type EmailRenderer,
  type EmailRendererOptions,
  type RenderedEmail,
  type RenderEmailInput,
} from './renderer.js';
export { EmailStylesheetInvalid, type StylesheetRefusal } from './css/stylesheet.js';
export type { StylesheetWarning } from './css/unsupported.js';
export type {
  Children,
  ClassList,
  ColumnNode,
  EmailNode,
  EmailPrimitives,
  TextEnd,
  TextRun,
  TextRunLink,
  TextRunText,
  MarkupRefusal,
} from './primitives/nodes.js';
export { EmailMarkupInvalid } from './primitives/nodes.js';
export {
  assertEmailTheme,
  DEFAULT_EMAIL_THEME,
  EmailThemeInvalid,
  type EmailColors,
  type EmailTheme,
} from './theme.js';
