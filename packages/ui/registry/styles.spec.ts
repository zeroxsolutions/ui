// @vitest-environment node
import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

const STYLES = join(resolve(import.meta.dirname, '..'), 'registry/bases/base-ui/styles.css');

const SELF_MAPPED = /(--[\w-]+)\s*:\s*var\(\s*\1\s*[,)]/g;

/** Every custom property whose value reads itself; CSS resolves each to nothing and logs no error. */
function selfMappedProperties(css: string): string[] {
  return [...css.matchAll(SELF_MAPPED)].map(([, property]) => property);
}

describe('styles.css', () => {
  it('maps no custom property to itself', () => {
    expect(selfMappedProperties(readFileSync(STYLES, 'utf8'))).toEqual([]);
  });
});
