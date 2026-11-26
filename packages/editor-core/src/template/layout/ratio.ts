/** The whole a columns block's weights sum to. */
const WEIGHT_TOTAL = 12;

/**
 * The divider positions a dragged divider is drawn to: quarters, thirds and the half, as fractions of the row.
 * Each is a whole number of twelfths, so `snapRatio` can land on every one of them.
 */
export const RATIO_SNAPS: readonly number[] = [1 / 4, 1 / 3, 1 / 2, 2 / 3, 3 / 4];

/**
 * Lane fractions (any positive numbers, read against their sum) as whole weights summing to 12: each divider is
 * rounded to the nearest twelfth, and every lane keeps at least one twelfth. Takes 1 to 12 lanes.
 */
export function snapRatio(fractions: readonly number[]): number[] {
  const total = fractions.reduce((sum, fraction) => sum + fraction, 0);
  const lanes = fractions.length;
  const weights: number[] = [];
  let reached = 0;
  let previous = 0;
  for (let index = 0; index < lanes - 1; index += 1) {
    reached += fractions[index] ?? 0;
    const rounded = Math.round((reached / total) * WEIGHT_TOTAL);
    const lanesAfter = lanes - 1 - index;
    const divider = Math.min(WEIGHT_TOTAL - lanesAfter, Math.max(previous + 1, rounded));
    weights.push(divider - previous);
    previous = divider;
  }
  weights.push(WEIGHT_TOTAL - previous);
  return weights;
}

/** Weights as fractions of their sum, for drawing a lane's width. */
export function ratioFractions(weights: readonly number[]): number[] {
  const total = weights.reduce((sum, weight) => sum + weight, 0);
  return weights.map((weight) => weight / total);
}
