// @vitest-environment node
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { nativeIconSets } from './native-icon-sets';

describe('nativeIconSets', () => {
  it("holds every icon of the native registry's lucide folder, under its item name", () => {
    const registry = JSON.parse(
      readFileSync(join(import.meta.dirname, '../../../native-ui/registry.json'), 'utf8'),
    ) as { items: { name: string; files?: { path: string }[] }[] };
    const lucide = registry.items.filter((item) =>
      item.files?.some((file) => file.path.startsWith('src/registry/icons/lucide/')),
    );

    expect(nativeIconSets.map(({ set }) => set)).toEqual(['lucide']);
    expect(nativeIconSets[0]?.icons.map(({ name }) => name).sort()).toEqual(lucide.map(({ name }) => name).sort());
  });
});
