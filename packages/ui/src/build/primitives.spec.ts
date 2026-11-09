import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

import { expectedPrimitives, PRIMITIVES } from './primitives';

const ROOT = resolve(import.meta.dirname, '../..');

describe("the site's primitives", () => {
  it("are upstream's base items as the CLI installs them for the site, its slots kept", async () => {
    const expected = await expectedPrimitives(ROOT);
    expect(expected.size).toBeGreaterThan(50);
    const stale = [...expected].filter(([file, text]) => readFileSync(join(ROOT, PRIMITIVES, file), 'utf8') !== text);
    expect(stale.map(([file]) => file)).toEqual([]);
  }, 60_000);
});
