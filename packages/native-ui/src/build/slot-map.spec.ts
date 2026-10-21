import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseSlotMap } from './slot-map';

const SNAPSHOT_PATH = join(__dirname, '../../styles/upstream/style-vega.css');

describe('parseSlotMap', () => {
  it('maps each slot to the classes of its @apply, in order', () => {
    const css = `
.style-vega {
  /* MARK: Button */
  .cn-button-variant-default {
    @apply bg-primary text-primary-foreground hover:bg-primary/80;
  }

  /* MARK: Badge */
  .cn-badge {
    @apply rounded-full px-2;
  }
}
`;

    const slots = parseSlotMap(css);

    expect(slots.get('cn-button-variant-default')).toEqual([
      'bg-primary',
      'text-primary-foreground',
      'hover:bg-primary/80',
    ]);
    expect(slots.get('cn-badge')).toEqual(['rounded-full', 'px-2']);
  });

  it('gives a slot with no @apply no classes', () => {
    const slots = parseSlotMap('.style-vega {\n  .cn-empty {\n  }\n}\n');

    expect(slots.get('cn-empty')).toEqual([]);
  });

  it('reads no slot from a commented-out rule, and no rule end from a comment in a body', () => {
    const css = `.style-vega {
  /* .cn-retired { @apply px-9; } */
  .cn-badge {
    /* a } in a comment */
    @apply px-2;
  }
}`;

    const slots = parseSlotMap(css);

    expect([...slots.keys()]).toEqual(['cn-badge']);
    expect(slots.get('cn-badge')).toEqual(['px-2']);
  });

  it('reads the pinned snapshot, cn-button-size-sm included', () => {
    const slots = parseSlotMap(readFileSync(SNAPSHOT_PATH, 'utf8'));

    // The snapshot's one `.cn-card-content:has(...)` rule is a variant of a slot, not a slot.
    expect(slots.size).toBe(440);
    expect(slots.get('cn-button-size-sm')).toContain('h-8');
  });

  it('throws on a slot declared twice', () => {
    const css = `.style-vega {
  .cn-badge {
    @apply px-2;
  }
  .cn-badge {
    @apply px-3;
  }
}`;

    expect(() => parseSlotMap(css)).toThrow('cn-badge');
  });
});
