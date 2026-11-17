// @vitest-environment node
import { describe, expect, it } from 'vitest';

import { installLine } from './install-line';

describe('installLine', () => {
  it("adds the item through the @zui registry with shadcn's CLI", () => {
    expect(installLine('lucide-arrow-up-icon')).toBe('pnpm dlx shadcn@latest add @zui/lucide-arrow-up-icon');
  });
});
