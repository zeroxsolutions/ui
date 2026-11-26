import { slotMapOf } from './style-source';

describe("a style's slot map", () => {
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
