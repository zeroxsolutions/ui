// @vitest-environment node
import { describe, expect, it } from 'vitest';

import { COMPONENT_BASES } from './component-bases';
import { COMPONENT_BASES as CONFIG_COMPONENT_BASES } from './component-bases.mjs';

describe('component bases', () => {
  it('lists the same bases to the Next config, whose redirects keep them, as to the app', () => {
    expect([...CONFIG_COMPONENT_BASES]).toEqual([...COMPONENT_BASES]);
  });
});
