import { z } from 'zod';
import { ALIGNS, LAYOUT_NODES, WIDTH_MIN } from '@zeroxsolutions/editor-core/template/layout/index';

const align = z.enum(ALIGNS).nullable().default(null);
// A whole number above one is a pixel width a document stored before the layout, which the editor reads on load.
const width = z
  .union([z.number().min(WIDTH_MIN), z.literal('full')])
  .nullable()
  .default(null);

/**
 * The layout keys a block of `type` takes in its own attribute schema, `align` and, where `LAYOUT_NODES` gives it
 * one, `width`, so an HTML import, which keeps only what a node's schema names, keeps them. `blockLayout()` declares
 * the same keys on the node, with their HTML.
 */
export function blockLayoutAttrs(type: string): {
  align?: typeof align;
  width?: typeof width;
} {
  const keys: readonly string[] = (LAYOUT_NODES as Readonly<Record<string, readonly string[]>>)[type] ?? [];
  return {
    ...(keys.includes('align') ? { align } : {}),
    ...(keys.includes('width') ? { width } : {}),
  };
}
