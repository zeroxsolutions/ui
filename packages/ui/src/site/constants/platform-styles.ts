/**
 * The registry styles a reader picks between on each platform, by the name after the engine or base
 * prefix: `vega` is `nativewind-vega` on native and `base-vega` on web. A style is never in the path; the
 * picker writes it as `?style=`, and only when it is not the platform's default.
 */
export const PLATFORM_STYLES = {
  web: ['nova', 'luma', 'lyra', 'maia', 'mira', 'rhea', 'sera', 'vega'],
  native: ['vega', 'nova'],
} as const satisfies Record<'web' | 'native', readonly string[]>;

/** The style a page shows when neither the URL nor the reader's last choice names one. */
export const DEFAULT_PLATFORM_STYLE = {
  web: 'nova',
  native: 'vega',
} as const satisfies { [P in keyof typeof PLATFORM_STYLES]: (typeof PLATFORM_STYLES)[P][number] };

/** Each style as the picker names it to a reader. */
export const PLATFORM_STYLE_LABELS = {
  nova: 'Nova',
  luma: 'Luma',
  lyra: 'Lyra',
  maia: 'Maia',
  mira: 'Mira',
  rhea: 'Rhea',
  sera: 'Sera',
  vega: 'Vega',
} as const satisfies Record<(typeof PLATFORM_STYLES)[keyof typeof PLATFORM_STYLES][number], string>;
