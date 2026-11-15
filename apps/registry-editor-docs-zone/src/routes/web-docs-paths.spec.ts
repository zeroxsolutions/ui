// @vitest-environment node
import { describe, expect, it } from 'vitest';

import { webDocsSections } from './web-docs-paths';

describe('webDocsSections', () => {
  it('links the final address of each web docs section, none of them a redirect or a missing page', () => {
    expect(webDocsSections.map(({ url }) => url)).toEqual([
      '/docs',
      '/docs/installation',
      '/docs/components/base',
      '/docs/packages/icons',
    ]);
  });
});
