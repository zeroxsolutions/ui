// @ts-check

/**
 * `NATIVE_ENGINES` and `DEFAULT_NATIVE_ENGINE` from `native-engines.ts`, in a form `next.config.mjs` can
 * import: the config is loaded before anything compiles TypeScript. `native-engines.spec.ts` fails when
 * the two differ.
 *
 * Not named `native-engines.mjs`: Vite resolves the app's extensionless `@/constants/native-engines` to an `.mjs` beside
 * the `.ts` before the `.ts` itself.
 */
export const NATIVE_ENGINES = /** @type {const} */ (['nativewind', 'uniwind']);

export const DEFAULT_NATIVE_ENGINE = 'nativewind';
