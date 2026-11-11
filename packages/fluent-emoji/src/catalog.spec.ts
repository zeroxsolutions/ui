// @vitest-environment node
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

import * as catalog from './catalog';

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

describe('the catalog entry', () => {
  it('exports the categories, the manifest and the codepoint helper', () => {
    expect(catalog.EMOJI_CATEGORIES.length).toBeGreaterThan(0);
    expect(catalog.FLUENT_EMOJI_MANIFEST_KEYS.length).toBeGreaterThan(0);
    expect(catalog.FLUENT_EMOJI_MANIFEST_MISSING['3d']).toBeDefined();
    expect(catalog.emojiToUnicode('\u{1F600}')).toBe('1f600');
  });

  // React Native's Babel gives import.meta a null url, so a module reading it at load crashes the app that
  // imports it; the catalog exists so the native registries can load the data without that.
  it('loads no module that reads import.meta', () => {
    const readers = [...loadedFiles(resolve(SRC, 'catalog.ts'))].filter((file) =>
      readFileSync(file, 'utf8').includes('import.meta'),
    );

    expect(readers).toEqual([]);
  });
});
