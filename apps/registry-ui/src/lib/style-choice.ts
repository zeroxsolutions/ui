import { DEFAULT_PLATFORM_STYLE, PLATFORM_STYLES } from '@/constants/platform-styles';
import type { ComponentBase } from '@/types/component-base';
import type { NativeEngine } from '@/types/native-engine';
import type { Platform, PlatformStyle } from '@/types/platform';

/** The search param the style picker writes. */
export const STYLE_PARAM = 'style';

/** `value` where it names a style `platform` publishes; `undefined` for anything else, a different case included. */
export function parseStyle<P extends Platform>(
  platform: P,
  value: string | null | undefined,
): PlatformStyle<P> | undefined {
  const styles: readonly string[] = PLATFORM_STYLES[platform];
  return value && styles.includes(value) ? (value as PlatformStyle<P>) : undefined;
}

/**
 * The style a page shows: the URL's, so a pasted link opens in the style it was copied in; else the one
 * the reader last chose on this platform; else the platform's default. A value the platform does not
 * publish is passed over.
 */
export function currentStyle<P extends Platform>(
  platform: P,
  fromUrl: string | null | undefined,
  remembered: string | null | undefined,
): PlatformStyle<P> {
  return parseStyle(platform, fromUrl) ?? parseStyle(platform, remembered) ?? DEFAULT_PLATFORM_STYLE[platform];
}

/**
 * `pathname` with `search` and `style` written into it as `?style=`, or with `?style=` dropped where
 * `style` is the platform's default, so a link in the default style carries no query for it.
 */
export function styleHref<P extends Platform>(
  pathname: string,
  search: string,
  platform: P,
  style: PlatformStyle<P>,
): string {
  const params = new URLSearchParams(search);
  if (style === DEFAULT_PLATFORM_STYLE[platform]) params.delete(STYLE_PARAM);
  else params.set(STYLE_PARAM, style);
  const query = params.toString();
  return query ? `${pathname}?${query}` : pathname;
}

/** Where a style is read: a native one under its engine, a web one under its base. */
export type RegistryStyleOf =
  | { platform: 'native'; engine: NativeEngine; style: PlatformStyle<'native'> }
  | { platform: 'web'; base: ComponentBase; style: PlatformStyle<'web'> };

/** The registry style an app names as `style` in `components.json`, and the CLI fills `{style}` from: `uniwind-nova`, `base-vega`. */
export function registryStyle(of: RegistryStyleOf): string {
  return of.platform === 'native' ? `${of.engine}-${of.style}` : `${of.base}-${of.style}`;
}
