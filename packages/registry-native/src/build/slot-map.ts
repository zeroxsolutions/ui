export type SlotMap = ReadonlyMap<string, readonly string[]>;

const SLOT_RULE = /\.(cn-[\w-]+)\s*\{([^}]*)\}/g;
const APPLY_DECLARATION = /@apply\s+([^;]*);/;

/**
 * Reads the `.cn-<slot> { @apply ...; }` rules of an upstream style sheet.
 * Keys are slot names without the dot; values are the utility classes in
 * source order, empty for a rule with no `@apply`. Throws when a slot is
 * declared more than once.
 */
export function parseSlotMap(css: string): SlotMap {
  const slots = new Map<string, readonly string[]>();
  for (const [, slot, body] of css.matchAll(SLOT_RULE)) {
    if (slots.has(slot)) {
      throw new Error(`slot ${slot} is declared more than once`);
    }
    const applied = APPLY_DECLARATION.exec(body)?.[1] ?? '';
    slots.set(slot, applied.split(/\s+/).filter(Boolean));
  }
  return slots;
}
