// @vitest-environment node
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

import { fenceBreaches, SRC } from '../../import-fence.fixture';

describe('the profile core fence', () => {
  it('holds for every shipped profile core file: the core, the block library, the template, the document types, the errors and zod', () => {
    expect(
      fenceBreaches(join(SRC, 'profiles/core'), {
        // The block library imports none of the profiles, which its own fence holds, so reading it here makes no cycle.
        folders: [
          join(SRC, 'profiles/core'),
          join(SRC, 'blocks'),
          join(SRC, 'template'),
          join(SRC, 'document/core/types'),
        ],
        // The profile throws EditorError; the file holds plain error classes and imports nothing.
        files: [join(SRC, 'document/core/errors.js')],
        packages: ['zod'],
      }),
    ).toEqual([]);
  });
});
