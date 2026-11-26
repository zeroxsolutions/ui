import type { CSSProperties } from 'react';
import { layoutDataAttributes } from '@zeroxsolutions/editor-core/document/layout/index';
import type {
  LayoutAlign,
  LayoutSpace,
  ParagraphSize,
  TextAlign,
} from '@zeroxsolutions/editor-core/template/layout/index';

/** The props a block's drawn element takes from its layout, in the editor's view and in the Viewer alike. */
export interface LayoutProps {
  'data-align'?: LayoutAlign;
  /** A fraction of the container, such as `0.5`, or `full`. */
  'data-width'?: string;
  'data-space-before'?: LayoutSpace;
  'data-space-after'?: LayoutSpace;
  'data-text-align'?: TextAlign;
  'data-size'?: ParagraphSize;
  /** `--layout-width`, the fraction the editor's sheet draws the width from; absent for `full` and no width. */
  style?: CSSProperties;
}

/**
 * The `data-*` attributes and the `--layout-width` a node's attributes draw as, the same that its HTML carries.
 * A value outside its set, a pixel width among them, draws nothing, and an absent layout yields `{}`, so a block
 * that sets none draws as it did. The per-breakpoint overrides are not drawn.
 */
export function layoutProps(attrs: Record<string, unknown>): LayoutProps {
  // `responsive` is left out, so its JSON attribute is never written here.
  const written = layoutDataAttributes({
    align: attrs.align,
    width: attrs.width,
    spaceBefore: attrs.spaceBefore,
    spaceAfter: attrs.spaceAfter,
    textAlign: attrs.textAlign,
    size: attrs.size,
  } as Parameters<typeof layoutDataAttributes>[0]);
  const width = written['data-width'];
  return {
    ...(written as Omit<LayoutProps, 'style'>),
    ...(width === undefined || width === 'full' ? {} : { style: { '--layout-width': width } as CSSProperties }),
  };
}
