/** The email renderer: a theme, overridable blocks and layout, and block types a product adds. */
export {
  defineBlock,
  type BlockDefinition,
  type BlockRenderer,
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
export { defaultBlocks, type DefaultBlocks, type DefaultBlockType } from './blocks/index.js';
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
export { assertEmailTheme, EmailThemeInvalid, type EmailTheme } from './theme.js';
