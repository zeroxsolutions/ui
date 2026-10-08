import { describe, expect, it } from 'vitest';
import type { IEditor } from '../../document/core/index.js';
import {
  DuplicateTriggerError,
  IncoherentTriggerError,
  defaultTriggerFilter,
  insertionToken,
  invocationToken,
  referenceToken,
  validateTriggerRegistry,
  type TriggerOption,
  type TriggerTokenConfig,
} from './trigger-token.js';

// A minimal wiring config; the behavioural fields are what these tests exercise,
// so source/insert/readRef are inert stubs.
function config(
  over: Partial<TriggerTokenConfig<string, { id: string }>> = {},
): TriggerTokenConfig<string, { id: string }> {
  return {
    nodeName: 'x',
    source: () => [],
    insert: (_editor: IEditor, _option: TriggerOption) => undefined,
    readRef: (attrs) => ({ id: String(attrs.id ?? '') }),
    ...over,
  };
}

describe('archetype presets', () => {
  it('referenceToken defaults to anywhere / many / no commit / no restore', () => {
    const token = referenceToken('mention', '@', config());
    expect(token).toMatchObject({
      archetype: 'reference',
      gate: 'anywhere',
      multiplicity: 'many',
      commitOnSpace: false,
      backspaceRestore: false,
      queryField: 'label',
    });
  });

  it('invocationToken defaults to line-start / one-leading / commit / restore', () => {
    const token = invocationToken('command', '/', config());
    expect(token).toMatchObject({
      archetype: 'invocation',
      gate: 'line-start',
      multiplicity: 'one-leading',
      commitOnSpace: true,
      backspaceRestore: true,
      queryField: 'slug',
    });
  });

  it('insertionToken defaults to anywhere / many (scaffold)', () => {
    const token = insertionToken('emoji', ':', config());
    expect(token).toMatchObject({
      archetype: 'insertion',
      gate: 'anywhere',
      multiplicity: 'many',
    });
  });

  it('an overridden field wins while the rest keep the preset defaults', () => {
    const token = invocationToken('command', '/', config({ backspaceRestore: false }));
    expect(token.backspaceRestore).toBe(false);
    // untouched invocation defaults remain
    expect(token.gate).toBe('line-start');
    expect(token.commitOnSpace).toBe(true);
  });
});

describe('coherence validation', () => {
  it('rejects line-start placement with many multiplicity', () => {
    expect(() => referenceToken('mention', '@', config({ gate: 'line-start' }))).toThrow(IncoherentTriggerError);
  });

  it('rejects one-leading multiplicity with anywhere placement', () => {
    expect(() => referenceToken('mention', '@', config({ multiplicity: 'one-leading' }))).toThrow(
      IncoherentTriggerError,
    );
  });

  it('rejects commit-on-space on a non-line-start trigger', () => {
    expect(() => referenceToken('mention', '@', config({ commitOnSpace: true }))).toThrow(IncoherentTriggerError);
  });

  it('names the offending kind in the error', () => {
    expect(() => referenceToken('mention', '@', config({ commitOnSpace: true }))).toThrow(/mention/);
  });
});

describe('registry validation', () => {
  it('rejects two tokens sharing a trigger character', () => {
    const a = referenceToken('mention', '@', config());
    const b = referenceToken('handle', '@', config());
    expect(() => validateTriggerRegistry([a, b])).toThrow(DuplicateTriggerError);
    expect(() => validateTriggerRegistry([a, b])).toThrow(/@/);
  });

  it('rejects two tokens sharing a kind', () => {
    const a = referenceToken('mention', '@', config());
    const b = referenceToken('mention', '#', config());
    expect(() => validateTriggerRegistry([a, b])).toThrow(DuplicateTriggerError);
  });

  it('accepts a coherent, collision-free registry', () => {
    const mention = referenceToken('mention', '@', config());
    const command = invocationToken('command', '/', config());
    expect(() => validateTriggerRegistry([mention, command])).not.toThrow();
  });
});

describe('defaultTriggerFilter', () => {
  const options: TriggerOption[] = [
    { id: '1', label: 'Image Gen', slug: 'image-gen' },
    { id: '2', label: 'Summarise', slug: 'summarise' },
  ];

  it('returns all options for an empty query', () => {
    expect(defaultTriggerFilter(options, '')).toHaveLength(2);
  });

  it('matches on the label', () => {
    expect(defaultTriggerFilter(options, 'image')).toEqual([options[0]]);
  });

  it('matches on the slug', () => {
    expect(defaultTriggerFilter(options, 'summar')).toEqual([options[1]]);
  });

  it('falls back to the id when no slug is set', () => {
    const withId: TriggerOption[] = [{ id: 'alice', label: 'Alice Ng' }];
    expect(defaultTriggerFilter(withId, 'alic')).toEqual(withId);
  });
});
