// @vitest-environment node
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

import { fenceBreaches, SRC } from '../import-fence.fixture';

describe('the template fence', () => {
  it('holds for every shipped template file: the template itself, zod, the width table and the CSS parser', () => {
    expect(
      fenceBreaches(join(SRC, 'template'), {
        folders: [join(SRC, 'template')],
        packages: ['zod', 'get-east-asian-width', 'postcss'],
      }),
    ).toEqual([]);
  });
});
