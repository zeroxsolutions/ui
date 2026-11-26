import { z } from 'zod';

/** Where a block sits across its container, in the reading direction. */
export const ALIGNS = ['start', 'center', 'end'] as const;
export type LayoutAlign = (typeof ALIGNS)[number];

/** The space a block keeps before or after it; each surface maps a token to its own length. */
export const SPACES = ['none', 'small', 'medium', 'large'] as const;
export type LayoutSpace = (typeof SPACES)[number];

/** The breakpoints a site page may override a layout at; reserved, and ignored when drawing. */
export const BREAKPOINTS = ['sm', 'md', 'lg'] as const;
export type Breakpoint = (typeof BREAKPOINTS)[number];

/** The narrowest a block may be drawn, as a fraction of its container. */
export const WIDTH_MIN = 0.25;
/** The step a dragged width snaps to. */
export const WIDTH_STEP = 0.05;

/** A fraction of the container in `[WIDTH_MIN, 1]`, or `'full'`: bleeding to the container's edges where the surface allows. */
export type LayoutWidth = number | 'full';

/** The width a Document's content column is drawn at, which a stored pixel width is read against. */
export const DOCUMENT_CONTENT_WIDTH = 720;

/** One block's layout: tokens and fractions only, so every surface draws it with its own lengths. */
export interface Layout {
  align?: LayoutAlign;
  width?: LayoutWidth;
  spaceBefore?: LayoutSpace;
  spaceAfter?: LayoutSpace;
  /** Overrides per breakpoint for a site page; validated, never drawn by the editors or the email. */
  responsive?: Partial<Record<Breakpoint, Partial<Omit<Layout, 'responsive'>>>>;
}

const widthSchema = z.union([z.number().min(WIDTH_MIN).max(1), z.literal('full')]);

const layoutFields = {
  align: z.enum(ALIGNS).optional(),
  width: widthSchema.optional(),
  spaceBefore: z.enum(SPACES).optional(),
  spaceAfter: z.enum(SPACES).optional(),
};

const overrideSchema = z.strictObject(layoutFields);

/** A layout on a write: every key known, every value a token or a fraction in range, `responsive` one level deep. */
export const layoutSchema: z.ZodType<Layout> = z.strictObject({
  ...layoutFields,
  responsive: z.partialRecord(z.enum(BREAKPOINTS), overrideSchema).optional(),
});

type LayoutField = keyof typeof layoutFields;

function readFields(raw: Record<string, unknown>): Partial<Omit<Layout, 'responsive'>> {
  const read: Record<string, unknown> = {};
  for (const key of Object.keys(layoutFields) as LayoutField[]) {
    const parsed = layoutFields[key].safeParse(raw[key]);
    if (parsed.success && parsed.data !== undefined) read[key] = parsed.data;
  }
  return read;
}

function isRecord(raw: unknown): raw is Record<string, unknown> {
  return typeof raw === 'object' && raw !== null && !Array.isArray(raw);
}

/**
 * A stored layout on a read: keeps each value that is valid and drops each that is not, so one bad key never costs
 * a block its whole layout. Anything that is not an object reads as no layout.
 */
export function readLayout(raw: unknown): Layout {
  if (!isRecord(raw)) return {};
  const layout: Layout = readFields(raw);
  if (isRecord(raw.responsive)) {
    const responsive: NonNullable<Layout['responsive']> = {};
    for (const breakpoint of BREAKPOINTS) {
      const override = raw.responsive[breakpoint];
      if (!isRecord(override)) continue;
      const read = readFields(override);
      if (Object.keys(read).length > 0) responsive[breakpoint] = read;
    }
    if (Object.keys(responsive).length > 0) layout.responsive = responsive;
  }
  return layout;
}

const STEPS_PER_WHOLE = Math.round(1 / WIDTH_STEP);

/** `fraction` rounded to `WIDTH_STEP` and clamped to `[WIDTH_MIN, 1]`. */
export function snapWidth(fraction: number): number {
  const snapped = Math.round(fraction * STEPS_PER_WHOLE) / STEPS_PER_WHOLE;
  return Math.min(1, Math.max(WIDTH_MIN, snapped));
}

/** A legacy pixel width read as a fraction of the `base` it was drawn in, snapped as a drag would be. */
export function widthFromPixels(px: number, base: number): number {
  return snapWidth(px / base);
}

/**
 * The layout keys each top-level block type takes. A type absent here takes none; `table` takes only a `'full'`
 * width, which `blockLayout()` enforces.
 */
export const LAYOUT_NODES = {
  image: ['align', 'width', 'spaceBefore', 'spaceAfter'],
  media: ['align', 'width', 'spaceBefore', 'spaceAfter'],
  embed: ['align', 'width', 'spaceBefore', 'spaceAfter'],
  card: ['align', 'width', 'spaceBefore', 'spaceAfter'],
  bookmark: ['align', 'spaceBefore', 'spaceAfter'],
  file: ['align', 'spaceBefore', 'spaceAfter'],
  table: ['width', 'spaceBefore', 'spaceAfter'],
  paragraph: ['spaceBefore', 'spaceAfter'],
  heading: ['spaceBefore', 'spaceAfter'],
  blockquote: ['spaceBefore', 'spaceAfter'],
  bulletList: ['spaceBefore', 'spaceAfter'],
  orderedList: ['spaceBefore', 'spaceAfter'],
  taskList: ['spaceBefore', 'spaceAfter'],
  codeBlock: ['spaceBefore', 'spaceAfter'],
  callout: ['spaceBefore', 'spaceAfter'],
  columns: ['spaceBefore', 'spaceAfter'],
  section: ['spaceBefore', 'spaceAfter'],
  button: ['spaceBefore', 'spaceAfter'],
  horizontalRule: ['spaceBefore', 'spaceAfter'],
  toggle: ['spaceBefore', 'spaceAfter'],
  math: ['spaceBefore', 'spaceAfter'],
  mermaid: ['spaceBefore', 'spaceAfter'],
} as const satisfies Readonly<Record<string, readonly (keyof Layout)[]>>;

/** A block type that takes a layout. */
export type LayoutNodeType = keyof typeof LAYOUT_NODES;
