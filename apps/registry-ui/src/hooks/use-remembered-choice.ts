import { useSyncExternalStore } from 'react';

import { DEFAULT_NATIVE_ENGINE, NATIVE_ENGINES } from '@/constants/native-engines';
import { DEFAULT_PREVIEW_PLATFORM, PREVIEW_PLATFORMS } from '@/constants/preview-platforms';
import type { NativeEngine } from '@/types/native-engine';
import type { Platform, PlatformStyle } from '@/types/platform';
import type { PreviewPlatform } from '@/types/preview-platform';

// `storage` fires only in the other tabs, so a write here announces itself to this tab's readers too.
const CHANGED = 'zui:remembered-choice';

const ENGINE_KEY = 'zui:native-engine';

const PREVIEW_PLATFORM_KEY = 'zui:native-preview-platform';

function styleKey(platform: Platform): string {
  return `zui:style:${platform}`;
}

function subscribe(onChange: () => void): () => void {
  window.addEventListener('storage', onChange);
  window.addEventListener(CHANGED, onChange);
  return () => {
    window.removeEventListener('storage', onChange);
    window.removeEventListener(CHANGED, onChange);
  };
}

// Storage throws where the browser refuses it, such as a sandboxed frame; nothing is remembered there.
function read(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    return;
  }
  window.dispatchEvent(new Event(CHANGED));
}

/** The value stored under `key`, re-read when any tab writes it; `null` while the page renders on the server and hydrates. */
function useStored(key: string): string | null {
  return useSyncExternalStore(
    subscribe,
    () => read(key),
    () => null,
  );
}

/** The style the reader last picked on `platform`, as stored, unchecked; `null` where none is. `currentStyle` checks it. */
export function useRememberedStyle(platform: Platform): string | null {
  return useStored(styleKey(platform));
}

/** Remembers `style` as the reader's choice on `platform`, for every page that names none in its URL. */
export function rememberStyle<P extends Platform>(platform: P, style: PlatformStyle<P>): void {
  write(styleKey(platform), style);
}

/** The engine the reader last read a native page under, or the default engine; a page with no engine in its path uses it. */
export function useRememberedEngine(): NativeEngine {
  const stored = useStored(ENGINE_KEY);
  return NATIVE_ENGINES.find((engine) => engine === stored) ?? DEFAULT_NATIVE_ENGINE;
}

/** Remembers `engine` as the one the reader is reading native pages under. */
export function rememberEngine(engine: NativeEngine): void {
  write(ENGINE_KEY, engine);
}

/**
 * The platform the reader last picked for a native page's preview, or the default; the default too while
 * the page renders on the server and hydrates.
 */
export function useRememberedPreviewPlatform(): PreviewPlatform {
  const stored = useStored(PREVIEW_PLATFORM_KEY);
  return PREVIEW_PLATFORMS.find((platform) => platform === stored) ?? DEFAULT_PREVIEW_PLATFORM;
}

/** Remembers `platform` as the one every native page's preview shows. */
export function rememberPreviewPlatform(platform: PreviewPlatform): void {
  write(PREVIEW_PLATFORM_KEY, platform);
}
