/**
 * Rewrites each of the site's primitives under `registry/bases/base-ui/ui/` that upstream's base has from
 * shadcn-upstream's snapshot of that base item, as `src/build/primitives.ts` reads it.
 */
import { writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

import { expectedPrimitives, PRIMITIVES } from '../src/build/primitives.ts';

const ROOT = resolve(import.meta.dirname, '..');
const expected = await expectedPrimitives(ROOT);
for (const [file, text] of expected) writeFileSync(join(ROOT, PRIMITIVES, file), text);
console.log(`${PRIMITIVES}: ${expected.size} primitives from upstream's base`);
