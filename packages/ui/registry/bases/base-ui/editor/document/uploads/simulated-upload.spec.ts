import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { simulatedUpload } from './simulated-upload';

const file = new File(['x'], 'cat.png', { type: 'image/png' });

beforeEach(() => {
  vi.useFakeTimers();
});
afterEach(() => {
  vi.useRealTimers();
});

describe('simulatedUpload', () => {
  it('reports its progress in steps, then answers the address', async () => {
    const progress: number[] = [];
    const upload = simulatedUpload({ address: (picked) => `https://cdn.test/${picked.name}`, duration: 100 });

    const answer = upload(file, { signal: new AbortController().signal, onProgress: (step) => progress.push(step) });
    await vi.advanceTimersByTimeAsync(100);

    await expect(answer).resolves.toEqual({ url: 'https://cdn.test/cat.png' });
    expect(progress.at(-1)).toBe(1);
    expect(progress).toHaveLength(10);
  });

  it('fails a file it is told to fail', async () => {
    const upload = simulatedUpload({ address: () => 'https://cdn.test/a', fails: () => true, duration: 100 });

    const answer = upload(file, { signal: new AbortController().signal, onProgress: () => {} });
    const settled = expect(answer).rejects.toThrow('The simulated upload failed.');
    await vi.advanceTimersByTimeAsync(100);

    await settled;
  });

  it('stops when its signal aborts', async () => {
    const controller = new AbortController();
    const progress: number[] = [];
    const upload = simulatedUpload({ address: () => 'https://cdn.test/a', duration: 100 });

    const answer = upload(file, { signal: controller.signal, onProgress: (step) => progress.push(step) });
    const settled = expect(answer).rejects.toBeDefined();
    await vi.advanceTimersByTimeAsync(30);
    controller.abort();
    await vi.advanceTimersByTimeAsync(100);

    await settled;
    expect(progress).toHaveLength(3);
  });
});
