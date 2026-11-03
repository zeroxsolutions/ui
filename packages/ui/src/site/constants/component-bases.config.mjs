// @ts-check

/**
 * `COMPONENT_BASES` from `component-bases.ts`, in a form `next.config.mjs` can import: the config is
 * loaded before anything compiles TypeScript. `component-bases.spec.ts` fails when the two differ.
 *
 * Not named `component-bases.mjs`: Vite resolves an extensionless `constants/component-bases` import to an `.mjs`
 * beside the `.ts` before the `.ts` itself.
 */
export const COMPONENT_BASES = /** @type {const} */ (['base']);
