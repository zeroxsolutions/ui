// @vitest-environment node
import { describe, expect, it } from 'vitest';

import { DEFAULT_NATIVE_ENGINE, NATIVE_ENGINES } from './native-engines';
import {
  DEFAULT_NATIVE_ENGINE as CONFIG_DEFAULT_NATIVE_ENGINE,
  NATIVE_ENGINES as CONFIG_NATIVE_ENGINES,
} from './native-engines.config.mjs';

describe('native engines', () => {
  it('lists the same engines, and the same default, to the Next config, whose redirects use them, as to the app', () => {
    expect([...CONFIG_NATIVE_ENGINES]).toEqual([...NATIVE_ENGINES]);
    expect(CONFIG_DEFAULT_NATIVE_ENGINE).toBe(DEFAULT_NATIVE_ENGINE);
  });
});
