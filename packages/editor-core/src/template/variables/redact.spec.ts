// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { redactVariables } from './redact.js';

describe('redactVariables', () => {
  it('keeps a value its template declares non-sensitive', () => {
    expect(redactVariables({ name: 'Mai' }, new Set(['name']))).toEqual({ name: 'Mai' });
  });

  it('keeps the key and drops the value of every other variable', () => {
    expect(redactVariables({ name: 'Mai', code: '123456' }, new Set(['name']))).toEqual({ name: 'Mai', code: null });
  });

  it('drops a value the template no longer declares at all', () => {
    expect(redactVariables({ retired: 'x' }, new Set())).toEqual({ retired: null });
  });
});
