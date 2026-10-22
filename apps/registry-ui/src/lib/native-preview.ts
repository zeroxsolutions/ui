import { EXPO_GO_SDK, EXPO_PROJECT_IDS } from '@/constants/native-preview-device';
import type { NativeEngine } from '@/types/native-engine';
import type { PlatformStyle } from '@/types/platform';

/**
 * The `type` of the message a native preview posts to the page framing it, with the drawn demo's
 * height. The preview's `HEIGHT_MESSAGE` (packages/native-ui/src/preview/frame-height.ts) writes it, and
 * this module's spec fails while the two differ.
 */
export const NATIVE_PREVIEW_HEIGHT_MESSAGE = 'zui:native-preview-height';

/** The colour scheme a native preview draws in, which its `?theme=` pins. */
export type NativePreviewTheme = 'light' | 'dark';

const NATIVE_PREVIEW_PATHS = {
  nativewind: '/native-preview',
  uniwind: '/native-preview-uniwind',
} as const satisfies Record<NativeEngine, string>;

/**
 * Where a native demo is drawn: the web export of the engine's preview app, under
 * `public/native-preview` for NativeWind and `public/native-preview-uniwind` for Uniwind, which draws the
 * demo `?demo=` names in the style `?style=` names. The `index.html` form is served by `next dev` and by
 * Cloudflare's assets alike; Cloudflare answers it with a redirect to the folder, the query kept.
 */
export function nativePreviewSrc({
  engine,
  style,
  demo,
  theme,
}: {
  /** The engine of the page, whose preview app draws the demo. */
  engine: NativeEngine;
  style: PlatformStyle<'native'>;
  /** A demo's name in `@zeroxsolutions/native-ui/examples`, such as `button-demo`. */
  demo: string;
  theme: NativePreviewTheme;
}): string {
  return `${NATIVE_PREVIEW_PATHS[engine]}/index.html?style=${style}&demo=${demo}&theme=${theme}`;
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
 * The link that opens a native demo in Expo Go: the update the engine's preview app published to the
 * style's channel, at the demo's route. The runtime version is the one Expo Go takes for its SDK, as
 * `qr.expo.dev` writes it for Expo Go; the demo's route follows the `/--/` that tells Expo Go where the
 * project's URL ends and the path inside the app begins.
 * @returns `null` while the engine's preview app has no EAS project
 */
export function expoGoUrl({
  engine,
  style,
  demo,
}: {
  /** The engine of the page, whose preview app's EAS project holds the updates. */
  engine: NativeEngine;
  /** The style the page shows, whose name is the update's channel. */
  style: PlatformStyle<'native'>;
  /** A demo's name in `@zeroxsolutions/native-ui/examples`, such as `button-demo`. */
  demo: string;
}): string | null {
  const projectId = EXPO_PROJECT_IDS[engine];
  if (projectId === null) return null;
  const query = new URLSearchParams({
    'runtime-version': `exposdk:${EXPO_GO_SDK}.0.0`,
    'channel-name': style,
  });
  return `exp://u.expo.dev/${encodeURIComponent(projectId)}/--/${encodeURIComponent(demo)}?${query}`;
}
