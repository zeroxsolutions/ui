/**
 * The primitive libraries a web component is documented on, each the `<base>` segment of
 * `/docs/components/<base>` and `/blocks/<base>`: `base` is Base UI. A base's pages live in
 * `content/docs/components/<base>`, so one added here needs that folder before its links resolve.
 */
export const COMPONENT_BASES = ['base'] as const satisfies readonly string[];

/** The base the header and the home page link to. */
export const DEFAULT_COMPONENT_BASE = 'base' satisfies (typeof COMPONENT_BASES)[number];
