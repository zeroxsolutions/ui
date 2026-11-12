// @vitest-environment node
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

import * as brandMarkUrl from './brand-mark-url';

const SRC = import.meta.dirname;

/** The modules a source file loads when it runs: its value imports and re-exports, never a type-only one. */
function runtimeImports(file: string): string[] {
  const text = readFileSync(file, 'utf8');
  const specifiers = [...text.matchAll(/^(?:import|export)\s+(?!type\b)[^;]*?from\s+'(\.[^']+)'/gm)].map(
    (match) => match[1],
  );
  return specifiers.map((specifier) => resolve(dirname(file), `${specifier}.ts`));
}

/** Every source file `entry` loads, itself included. */
function loadedFiles(entry: string): Set<string> {
  const seen = new Set<string>();
  const queue = [entry];
  while (queue.length > 0) {
    const file = queue.pop() as string;
    if (seen.has(file)) continue;
    seen.add(file);
    queue.push(...runtimeImports(file));
  }
  return seen;
}

describe('the brand-mark-url entry', () => {
  it('exports the manifest, the fallback chain, the ratio and the URL builder', () => {
    expect(brandMarkUrl.DEFAULT_BRAND_MARK_BASE).toBe('https://icons.zeroxsolutions.com/brands');
    expect(Object.keys(brandMarkUrl.BRAND_MARKS).length).toBeGreaterThan(0);
    expect(brandMarkUrl.brandMarkChain('anthropic', 'avatar')).toEqual(['avatar', 'mono']);
    expect(brandMarkUrl.brandMarkRatio('anthropic', 'combine')).toBeGreaterThan(1);
    expect(brandMarkUrl.brandMarkUrlFor('openai', 'avatar')).toBe(
      'https://icons.zeroxsolutions.com/brands/avatar/openai.svg',
    );
  });

  // The native registries import this entry, and React Native has no DOM and gives import.meta a null url, so a
  // module reading any of them at load crashes the app that imports it.
  it('loads no module that reads the DOM or import.meta', () => {
    const readers = [...loadedFiles(resolve(SRC, 'brand-mark-url.ts'))].filter((file) =>
      /import\.meta|\bdocument\.|\bwindow\./.test(readFileSync(file, 'utf8')),
    );

    expect(readers).toEqual([]);
  });
});
