/**
 * Reads `read` on every frame for `ms`, so an animation that plays and returns to rest within that time
 * still leaves a reading that differs from the first.
 */
export async function drawingsOver(read: () => string, ms: number): Promise<Set<string>> {
  const drawings = new Set<string>();
  const end = performance.now() + ms;
  while (performance.now() < end) {
    drawings.add(read());
    await new Promise((resolve) => requestAnimationFrame(resolve));
  }
  return drawings;
}
