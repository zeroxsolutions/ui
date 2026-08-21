/**
 * Run `task` over `items` with at most `limit` in flight, results in input order.
 *
 * The bound is the point: hashing 9217 files through `Promise.all` opens 9217 file
 * descriptors at once (measured), which survives only on a machine whose limit has
 * been raised.
 */
export async function mapWithConcurrency<T, R>(
  items: readonly T[],
  limit: number,
  task: (item: T) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let next = 0;

  // A shared cursor rather than a slice per worker: one slow item stalls itself, not
  // a fixed share of the work.
  const worker = async (): Promise<void> => {
    while (next < items.length) {
      const index = next++;
      results[index] = await task(items[index]);
    }
  };

  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}
