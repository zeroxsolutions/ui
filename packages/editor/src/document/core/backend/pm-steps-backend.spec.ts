import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createPmStepsBackend } from './pm-steps-backend.js';
import type { BackendTransaction } from '../types/document-backend.js';
import type { DocJSON } from '../types/json.js';

const doc = (text: string): DocJSON => ({
  type: 'doc',
  content: [{ type: 'paragraph', content: [{ type: 'text', text }] }],
});

const tx = (
  text: string,
  changes: unknown,
  docChanged = true,
): BackendTransaction => ({ doc: doc(text), changes, docChanged });

describe('PmStepsBackend', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('starts at version 0 and reports the initial snapshot on demand', () => {
    const backend = createPmStepsBackend({ doc: doc('hello') });
    expect(backend.version).toBe(0);
    expect(backend.getSnapshot()).toEqual({ version: 0, doc: doc('hello') });
  });

  it('emits a step-sized delta per document change and bumps the version', () => {
    const backend = createPmStepsBackend({ doc: doc('') });
    const deltas: unknown[] = [];
    backend.subscribe({ onDelta: (d) => deltas.push(d) });

    const step = [{ stepType: 'replace', from: 1, to: 1, slice: { content: [{ type: 'text', text: 'a' }] } }];
    backend.record(tx('a', step));

    expect(backend.version).toBe(1);
    expect(deltas).toEqual([{ version: 1, changes: step }]);
    // The delta carries only the step, not the whole document.
    expect(deltas[0]).not.toHaveProperty('doc');
  });

  it('does not emit a delta for a selection-only transaction', () => {
    const backend = createPmStepsBackend({ doc: doc('a') });
    const deltas: unknown[] = [];
    backend.subscribe({ onDelta: (d) => deltas.push(d) });

    backend.record(tx('a', [], /* docChanged */ false));

    expect(deltas).toHaveLength(0);
    expect(backend.version).toBe(0);
  });

  it('debounces snapshots to at most one per settling burst', () => {
    const backend = createPmStepsBackend({ doc: doc(''), snapshotDebounceMs: 500 });
    const snapshots: unknown[] = [];
    backend.subscribe({ onSnapshot: (s) => snapshots.push(s) });

    backend.record(tx('a', [1]));
    backend.record(tx('ab', [2]));
    backend.record(tx('abc', [3]));
    expect(snapshots).toHaveLength(0); // burst still settling

    vi.advanceTimersByTime(500);
    expect(snapshots).toEqual([{ version: 3, doc: doc('abc') }]);
  });

  it('produces an on-demand snapshot immediately via requestSnapshot', () => {
    const backend = createPmStepsBackend({ doc: doc('x') });
    const snapshots: unknown[] = [];
    backend.subscribe({ onSnapshot: (s) => snapshots.push(s) });

    backend.record(tx('xy', [1]));
    backend.requestSnapshot();

    expect(snapshots).toEqual([{ version: 1, doc: doc('xy') }]);
  });

  it('stops delivering after unsubscribe', () => {
    const backend = createPmStepsBackend({ doc: doc('') });
    const deltas: unknown[] = [];
    const off = backend.subscribe({ onDelta: (d) => deltas.push(d) });

    backend.record(tx('a', [1]));
    off();
    backend.record(tx('ab', [2]));

    expect(deltas).toHaveLength(1);
  });

  it('rejects a malformed remote delta at the boundary', () => {
    const backend = createPmStepsBackend({ doc: doc('') });
    expect(() => backend.applyRemoteDelta({ version: undefined as never, changes: [] })).toThrow(
      /missing a numeric version/,
    );
  });

  it('rejects remote application on the single-user default backend', () => {
    const backend = createPmStepsBackend({ doc: doc('') });
    expect(() => backend.applyRemoteDelta({ version: 5, changes: [] })).toThrow(
      /cannot apply remote deltas/,
    );
  });
});
