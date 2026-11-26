// @vitest-environment node
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

import { fenceBreaches, SRC } from '../import-fence.fixture';

describe('the block library fence', () => {
  it('holds for every shipped block library file: itself, the template, the document types and zod', () => {
    expect(
      fenceBreaches(join(SRC, 'blocks'), {
        folders: [join(SRC, 'blocks'), join(SRC, 'template'), join(SRC, 'document/core/types')],
        packages: ['zod'],
      }),
    ).toEqual([]);
  });
});
