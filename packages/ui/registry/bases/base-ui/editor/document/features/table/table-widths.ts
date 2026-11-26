/**
 * A table's column widths as the document stores them: one share of the table per column, each from a twentieth to
 * the whole, never a pixel. The node view, the Viewer and the HTML codec read them the same way.
 */

/** The narrowest a column may be, as a share of the table. */
export const COLUMN_WIDTH_MIN = 0.05;
/** The step a dragged border and a width read from pixels snap to: a twentieth of the table. */
export const COLUMN_WIDTH_STEP = 0.05;

/** `value` as stored column widths, or null where it is anything else, a pixel width among them. */
export function columnWidthsOf(value: unknown): number[] | null {
  return Array.isArray(value) &&
    value.length > 0 &&
    value.every((width) => typeof width === 'number' && width >= COLUMN_WIDTH_MIN && width <= 1)
    ? (value as number[])
    : null;
}

/** `share` to four places, free of the float error a sum of steps carries. */
export const inFourPlaces = (share: number): number => Number(share.toFixed(4));

/** Stored widths as the shares of the table they draw at, summing to 1; null where none are stored for `count` columns. */
export function storedShares(value: unknown, count: number): number[] | null {
  const widths = columnWidthsOf(value);
  if (widths === null || widths.length !== count) return null;
  const total = widths.reduce((sum, width) => sum + width, 0);
  return widths.map((width) => width / total);
}

/**
 * Pixel widths, as an older table or a paste carries them in `colwidth`, as shares of their sum to the nearest
 * twentieth; null where any is missing.
 */
export function sharesOfPixels(widths: readonly (number | null | undefined)[]): number[] | null {
  if (widths.length === 0 || !widths.every((width) => typeof width === 'number' && width > 0)) return null;
  const total = (widths as number[]).reduce((sum, width) => sum + width, 0);
  return (widths as number[])
    .map((width) =>
      Math.min(1, Math.max(COLUMN_WIDTH_MIN, Math.round(width / total / COLUMN_WIDTH_STEP) * COLUMN_WIDTH_STEP)),
    )
    .map(inFourPlaces);
}

/**
 * Shares as the document can store them: each at least `COLUMN_WIDTH_MIN`, summing to 1. A column the browser drew
 * narrower, as an empty one beside a long one is, takes the least share and the others give up the room in
 * proportion; shares that already fit come back as they were.
 */
export function fittedShares(shares: readonly number[]): number[] {
  if (shares.every((share) => share >= COLUMN_WIDTH_MIN)) return [...shares];
  const least = new Set<number>();
  for (;;) {
    const free = shares.map((_share, index) => index).filter((index) => !least.has(index));
    const room = 1 - least.size * COLUMN_WIDTH_MIN;
    const total = free.reduce((sum, index) => sum + shares[index]!, 0);
    const scaled = new Map(
      free.map((index) => [index, total > 0 ? (shares[index]! / total) * room : room / free.length]),
    );
    const under = free.filter((index) => scaled.get(index)! < COLUMN_WIDTH_MIN);
    if (under.length === 0) {
      const fitted = shares.map((_share, index) => inFourPlaces(scaled.get(index) ?? COLUMN_WIDTH_MIN));
      // The widest column takes up what rounding to four places left over, so the shares sum to 1.
      const widest = fitted.indexOf(Math.max(...fitted));
      fitted[widest] = inFourPlaces(
        1 - fitted.reduce((sum, share, index) => (index === widest ? sum : sum + share), 0),
      );
      return fitted;
    }
    for (const index of under) least.add(index);
  }
}
