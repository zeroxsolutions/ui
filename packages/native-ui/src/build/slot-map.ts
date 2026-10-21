export type SlotMap = ReadonlyMap<string, readonly string[]>;

const SLOT_RULE = /\.(cn-[\w-]+)\s*\{([^}]*)\}/g;
const CSS_COMMENT = /\/\*[\s\S]*?\*\//g;
const APPLY_DECLARATION = /@apply\s+([^;]*);/;

/**
 * Reads the `.cn-<slot> { @apply ...; }` rules of an upstream style sheet, its comments removed first.
 * Keys are slot names without the dot; values are the utility classes in
 * source order, empty for a rule with no `@apply`. Throws when a slot is
 * declared more than once.
 * Only a plain slot rule reads correctly. A selector of several classes, such as `.cn-a .cn-b`, is
 * read as the slot its last class names; one with a pseudo-class, such as `.cn-a:has(...)`, is
 * skipped; and a rule nested inside a slot's body ends that body at its own `}` and is not read as a slot.
 */
export function parseSlotMap(css: string): SlotMap {
  const slots = new Map<string, readonly string[]>();
  for (const [, slot, body] of css.replace(CSS_COMMENT, '').matchAll(SLOT_RULE)) {
    if (slots.has(slot)) {
      throw new Error(`slot ${slot} is declared more than once`);
    }
    const applied = APPLY_DECLARATION.exec(body)?.[1] ?? '';
    slots.set(slot, applied.split(/\s+/).filter(Boolean));
  }
  return slots;
}
