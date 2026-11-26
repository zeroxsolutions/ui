import type { LayoutSpace } from '@zeroxsolutions/editor-core/template/layout/index';

/** The attributes a button or a columns block draws its place from; each is absent on a block that does not set it. */
export interface BlockStyle {
  /** The layout's names, or the email wire's `left` and `right`, which a block written before them holds. */
  align?: 'start' | 'left' | 'center' | 'end' | 'right' | null;
  spaceAfter?: LayoutSpace | null;
}

const ALIGN_CLASSES = {
  start: 'text-start',
  left: 'text-left',
  center: 'text-center',
  end: 'text-end',
  right: 'text-right',
} as const;
const JUSTIFY_CLASSES = {
  start: 'justify-start',
  left: 'justify-start',
  center: 'justify-center',
  end: 'justify-end',
  right: 'justify-end',
} as const;
const SPACE_CLASSES = { none: 'mb-0', small: 'mb-2', medium: 'mb-4', large: 'mb-8' } as const satisfies Record<
  LayoutSpace,
  string
>;

/** The classes a block's `align` and `spaceAfter` read as; `medium` is the house default space. */
export function blockClasses({ align, spaceAfter }: BlockStyle): string {
  return [align ? ALIGN_CLASSES[align] : '', SPACE_CLASSES[spaceAfter ?? 'medium']].join(' ').trim();
}

/** Where a block's own row places its content under `align`. */
export function justifyClass(align: BlockStyle['align']): string {
  return JUSTIFY_CLASSES[align ?? 'left'];
}
