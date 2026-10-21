import { EXPO_GO_SDK } from '@/constants/native-preview-device';
import type { PlatformStyle } from '@/types/platform';

/**
 * The `type` of the message a native preview posts to the page framing it, with the drawn demo's
 * height. The preview's `HEIGHT_MESSAGE` (apps/native-preview/src/app/frame-height.ts) writes it, and
 * this module's spec fails while the two differ.
 */
export const NATIVE_PREVIEW_HEIGHT_MESSAGE = 'zui:native-preview-height';

/** The colour scheme a native preview draws in, which its `?theme=` pins. */
export type NativePreviewTheme = 'light' | 'dark';

/**
 * Where a native demo is drawn: the preview's web export, under `public/native-preview`, which draws the
 * demo `?demo=` names in the style `?style=` names. The `index.html` form is served by `next dev` and by
 * Cloudflare's assets alike; Cloudflare answers it with a redirect to the folder, the query kept.
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
  return `/native-preview/index.html?style=${style}&demo=${demo}&theme=${theme}`;
}

/** A frame's accessible name for `demo`, as a reader says it: `button-demo` is `Button demo preview`. */
export function nativePreviewTitle(demo: string): string {
  const words = demo.replaceAll('-', ' ');
  return `${words.charAt(0).toUpperCase()}${words.slice(1)} preview`;
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

/**
 * The link that opens a native demo in Expo Go: the update `apps/native-preview` published to the
 * style's channel, at the demo's route. The runtime version is the one Expo Go takes for its SDK, as
 * `qr.expo.dev` writes it for Expo Go; the demo's route follows the `/--/` that tells Expo Go where the
 * project's URL ends and the path inside the app begins.
 */
export function expoGoUrl({
  projectId,
  style,
  demo,
}: {
  /** The EAS project the preview's updates are published to. */
  projectId: string;
  /** The style the page shows, whose name is the update's channel. */
  style: PlatformStyle<'native'>;
  /** A demo's name in `@zeroxsolutions/native-ui/examples`, such as `button-demo`. */
  demo: string;
}): string {
  const query = new URLSearchParams({ 'runtime-version': `exposdk:${EXPO_GO_SDK}.0.0`, 'channel-name': style });
  return `exp://u.expo.dev/${encodeURIComponent(projectId)}/--/${encodeURIComponent(demo)}?${query}`;
}
