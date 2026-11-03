/**
 * The styling engines a native item is published for, each the `<engine>` segment of
 * `/native/components/<engine>` and `/native/blocks/<engine>`, and the first half of its registry style
 * (`nativewind-vega`). `native-engines.config.mjs` lists them too, for the Next config's redirects.
 */
export const NATIVE_ENGINES = ['nativewind', 'uniwind'] as const satisfies readonly string[];

/** The engine a link lands on when nothing names one: an old `/docs/native/<name>` URL, or a reader with none remembered. */
export const DEFAULT_NATIVE_ENGINE = 'nativewind' satisfies (typeof NATIVE_ENGINES)[number];

/** Each engine as the site names it to a reader. */
export const NATIVE_ENGINE_LABELS = {
  nativewind: 'NativeWind',
  uniwind: 'Uniwind',
} as const satisfies Record<(typeof NATIVE_ENGINES)[number], string>;
