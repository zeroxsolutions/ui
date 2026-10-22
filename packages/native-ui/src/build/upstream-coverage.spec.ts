import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Registry } from 'shadcn/schema';

const PROJECT = join(__dirname, '../..');

function readJson<T>(path: string): T {
  return JSON.parse(readFileSync(join(PROJECT, path), 'utf8')) as T;
}

/** The `registry:ui` names upstream's base-vega registry lists, as upstream-refresh last saved them. */
const upstreamItems = readJson<string[]>('styles/upstream/registry-ui-items.json');
const ported = new Set(readJson<Registry>('registry.json').items.map((item) => item.name));

describe('the native registry against upstream', () => {
  it('reads a non-empty upstream item list', () => {
    expect(upstreamItems.length).toBeGreaterThan(0);
  });

  it('has a native item for every upstream item', () => {
    expect(upstreamItems.filter((name) => !ported.has(name))).toEqual([]);
  });
});
