import { describe, expect, it } from 'vitest';

import { mapWithConcurrency } from './map-with-concurrency';

/** Counts how many tasks are in flight at once, which is the property under test. */
function tracker() {
  let inFlight = 0;
  let peak = 0;
  return {
    get peak() {
      return peak;
    },
    async run<R>(value: R): Promise<R> {
      inFlight++;
      peak = Math.max(peak, inFlight);
      await Promise.resolve();
      inFlight--;
      return value;
    },
  };
}

describe('mapWithConcurrency', () => {
  it('returns results in the order of the input, not of completion', async () => {
    const delays = [30, 0, 10];

    const results = await mapWithConcurrency(delays, 3, async (ms) => {
      await new Promise((resolve) => setTimeout(resolve, ms));
      return ms;
    });

    expect(results).toEqual(delays);
  });

  it('never runs more than the limit at once', async () => {
    const track = tracker();

    await mapWithConcurrency([...Array(50).keys()], 4, (n) => track.run(n));

    expect(track.peak).toBe(4);
  });

  // The whole reason this function exists: an unbounded map over the asset tree opens
  // one file descriptor per file.
  it('runs fewer workers than the limit when there is less work', async () => {
    const track = tracker();

    await mapWithConcurrency([1, 2], 8, (n) => track.run(n));

    expect(track.peak).toBe(2);
  });

  it('does nothing at all for an empty list', async () => {
    const track = tracker();

    expect(await mapWithConcurrency([], 4, (n) => track.run(n))).toEqual([]);
    expect(track.peak).toBe(0);
  });

  it('rejects when a task rejects', async () => {
    await expect(
      mapWithConcurrency([1, 2, 3], 2, async (n) => {
        if (n === 2) throw new Error('task 2 failed');
        return n;
      }),
    ).rejects.toThrow('task 2 failed');
  });
});
