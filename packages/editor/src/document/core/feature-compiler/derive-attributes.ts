import type { ZodType } from 'zod';

/** A Tiptap-style attribute spec: a default value per attribute name. */
export type AttributeSpec = Record<string, { default: unknown }>;

/**
 * Derive an engine attribute spec from a node/mark's Zod schema — the single
 * source of the attribute type *and* its runtime defaults (see the
 * `editor-feature-api` spec). Each attribute's default is whatever the field
 * produces from `undefined` (its `.default(...)`), or `null` when it has none.
 * Engine-free: it reads only the Zod schema.
 */
export function deriveAttributes(schema?: ZodType): AttributeSpec {
  if (!schema) return {};
  const shape = (schema as { shape?: Record<string, ZodType> }).shape;
  if (!shape || typeof shape !== 'object') return {};

  const spec: AttributeSpec = {};
  for (const [name, field] of Object.entries(shape)) {
    const parsed = field.safeParse(undefined);
    spec[name] = { default: parsed.success ? parsed.data : null };
  }
  return spec;
}
