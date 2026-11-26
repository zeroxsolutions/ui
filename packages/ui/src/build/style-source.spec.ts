import { resolve } from 'node:path';

import { slotMapOf, styleMapOf } from './style-source';

const ROOT = resolve(import.meta.dirname, '../..');

describe("a style's slot map", () => {
  it('draws a plain CardContent in vega with only its own padding', () => {
    expect(styleMapOf(ROOT, 'vega')['cn-card-content']).toBe('px-(--card-spacing)');
  });

  it("folds no rule scoped by a state, a :has() or a descendant into the bare slot's classes", () => {
    const sheet = `.style-x {
      .cn-a { @apply p-1; }
      .cn-a:has(> [data-slot=b]) { @apply flex gap-3; }
      .cn-a:hover { @apply bg-muted; }
      .cn-c .cn-a { @apply p-2; }
      .cn-a, .cn-d { @apply rounded-md; }
    }`;
    expect(slotMapOf(sheet)).toEqual({ 'cn-a': 'rounded-md p-1', 'cn-d': 'rounded-md' });
  });
});
