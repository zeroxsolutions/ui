import type { PlatformStyle } from '@/types/platform';

/**
 * The `type` of the message a native preview posts to the page framing it, with the drawn demo's
 * height. The preview's `HEIGHT_MESSAGE` (apps/native-preview/src/app/frame-height.ts) writes it, so
 * the two change together.
 */
export const NATIVE_PREVIEW_HEIGHT_MESSAGE = 'zui:native-preview-height';

/** The colour scheme a native preview draws in, which its `?theme=` pins. */
export type NativePreviewTheme = 'light' | 'dark';

/**
 * Where a native demo is drawn: its page in the style's web export, under `public/native-preview`.
 * The `.html` form is served by `next dev` and by Cloudflare's assets alike; Cloudflare answers it with
 * a redirect to the extensionless path, the query kept.
 */
export function nativePreviewSrc({
  style,
  demo,
  theme,
}: {
  style: PlatformStyle<'native'>;
  /** A demo's name in `@zeroxsolutions/native-ui/examples`, such as `button-demo`. */
  demo: string;
  theme: NativePreviewTheme;
}): string {
  return `/native-preview/${style}/${demo}.html?theme=${theme}`;
}

/** The scheme a preview draws in for the site's resolved theme, which is unknown until the page has hydrated. */
export function previewTheme(resolvedTheme: string | undefined): NativePreviewTheme {
  return resolvedTheme === 'dark' ? 'dark' : 'light';
}

/**
 * The height, in whole CSS pixels rounded up, that a native preview's height message carries.
 * @returns `undefined` for any other message, or a height that is not a finite positive number
 */
export function previewHeightOf(data: unknown): number | undefined {
  if (typeof data !== 'object' || data === null) return undefined;
  const { type, height } = data as { type?: unknown; height?: unknown };
  if (type !== NATIVE_PREVIEW_HEIGHT_MESSAGE || typeof height !== 'number') return undefined;
  return Number.isFinite(height) && height > 0 ? Math.ceil(height) : undefined;
}
