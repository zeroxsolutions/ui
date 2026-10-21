/**
 * Where a native component page's preview shows its demo: `web` draws it in a frame from the preview's
 * web export, `native` shows a QR code that opens it in Expo Go on a phone.
 */
export const PREVIEW_PLATFORMS = ['web', 'native'] as const satisfies readonly string[];

/** The platform a preview shows when the reader has picked none. */
export const DEFAULT_PREVIEW_PLATFORM = 'web' satisfies (typeof PREVIEW_PLATFORMS)[number];

/** Each platform as the preview's picker names it to a reader. */
export const PREVIEW_PLATFORM_LABELS = {
  web: 'Web',
  native: 'Native',
} as const satisfies Record<(typeof PREVIEW_PLATFORMS)[number], string>;
