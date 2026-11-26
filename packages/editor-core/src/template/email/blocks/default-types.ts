/**
 * The type of every block every renderer knows, which a product's block cannot take. A leaf, so a built-in block
 * built with the product's own builder can import the builder without importing the list of built-ins.
 */
export const DEFAULT_BLOCK_TYPES = [
  'paragraph',
  'button',
  'code',
  'list',
  'callout',
  'divider',
  'columns',
  'html',
  'heading',
  'quote',
  'image',
  'table',
  'spacer',
  'socialLinks',
  'hero',
  'card',
  'legalFooter',
  'section',
] as const;
