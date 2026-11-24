/** The attributes a button or a columns block draws its place from; each is absent on a block that does not set it. */
export interface BlockStyle {
  align?: 'left' | 'center' | 'right' | null;
  spaceAfter?: 'small' | 'medium' | 'large' | null;
}

const ALIGN_CLASSES = { left: 'text-left', center: 'text-center', right: 'text-right' } as const;
const JUSTIFY_CLASSES = { left: 'justify-start', center: 'justify-center', right: 'justify-end' } as const;
const SPACE_CLASSES = { small: 'mb-2', medium: 'mb-4', large: 'mb-8' } as const;

/** The classes a block's `align` and `spaceAfter` read as; `medium` is the house default space. */
export function blockClasses({ align, spaceAfter }: BlockStyle): string {
  return [align ? ALIGN_CLASSES[align] : '', SPACE_CLASSES[spaceAfter ?? 'medium']].join(' ').trim();
}

/** Where a block's own row places its content under `align`. */
export function justifyClass(align: BlockStyle['align']): string {
  return JUSTIFY_CLASSES[align ?? 'left'];
}
