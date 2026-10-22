// @vitest-environment node
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { EXPO_GO_SDK } from '@/constants/native-preview-device';
import type { NativeEngine } from '@/types/native-engine';

import {
  expoGoUrl,
  NATIVE_PREVIEW_HEIGHT_MESSAGE,
  nativePreviewSrc,
  nativePreviewTitle,
  previewHeightOf,
  previewTheme,
} from './native-preview';

/** Each engine's preview app config, where `eas init` wrote the project its updates are published to. */
const PREVIEW_APP_CONFIGS = {
  nativewind: join(import.meta.dirname, '../../../native-preview/app.json'),
  uniwind: join(import.meta.dirname, '../../../native-preview-uniwind/app.json'),
};

/** The module that posts the height message, in the preview screen both native previews draw. */
const FRAME_HEIGHT_SOURCE = join(import.meta.dirname, '../../../../packages/native-ui/src/preview/frame-height.ts');

/** The workspace's catalog, whose `expo` catalog pins the SDK the native preview is built on. */
const WORKSPACE_CATALOG = join(import.meta.dirname, '../../../../pnpm-workspace.yaml');

const NATIVEWIND_ID = '0f6c4b9e-2d1a-4c3b-9e8f-7a6b5c4d3e2f';
const UNIWIND_ID = '5d2e8a14-7b3c-4f90-a1d6-3c8e9b0f2a47';

const device = vi.hoisted(() => ({ ids: {} as Record<string, string | null> }));

vi.mock('@/constants/native-preview-device', async (importActual) => ({
  ...(await importActual<typeof import('@/constants/native-preview-device')>()),
  get EXPO_PROJECT_IDS(): Record<string, string | null> {
    return device.ids;
  },
}));

beforeEach(() => {
  device.ids = { nativewind: NATIVEWIND_ID, uniwind: UNIWIND_ID };
});

describe('nativePreviewSrc', () => {
  it("points at the engine's export, with the style, the demo and the theme in its query", () => {
    expect(
      nativePreviewSrc({
        engine: 'nativewind',
        style: 'nova',
        demo: 'button-demo',
        theme: 'dark',
      }),
    ).toBe('/native-preview/index.html?style=nova&demo=button-demo&theme=dark');
    expect(
      nativePreviewSrc({
        engine: 'uniwind',
        style: 'vega',
        demo: 'password-input-demo',
        theme: 'light',
      }),
    ).toBe('/native-preview-uniwind/index.html?style=vega&demo=password-input-demo&theme=light');
  });
});

describe('previewTheme', () => {
  it('draws the frame dark only on a page that resolved to dark, and light otherwise', () => {
    expect(previewTheme('dark')).toBe('dark');
    expect(previewTheme('light')).toBe('light');
    expect(previewTheme(undefined)).toBe('light');
  });
});

describe('previewHeightOf', () => {
  it("reads the height the preview posts, rounded up to a whole pixel so the demo's last row is not cut", () => {
    expect(previewHeightOf({ type: NATIVE_PREVIEW_HEIGHT_MESSAGE, height: 148 })).toBe(148);
    expect(previewHeightOf({ type: NATIVE_PREVIEW_HEIGHT_MESSAGE, height: 148.25 })).toBe(149);
  });

  it('ignores any other message, and a height that is not a positive number', () => {
    expect(previewHeightOf({ type: 'other', height: 148 })).toBeUndefined();
    expect(previewHeightOf({ type: NATIVE_PREVIEW_HEIGHT_MESSAGE, height: '148' })).toBeUndefined();
    expect(previewHeightOf({ type: NATIVE_PREVIEW_HEIGHT_MESSAGE, height: 0 })).toBeUndefined();
    expect(
      previewHeightOf({
        type: NATIVE_PREVIEW_HEIGHT_MESSAGE,
        height: Number.NaN,
      }),
    ).toBeUndefined();
    expect(
      previewHeightOf({
        type: NATIVE_PREVIEW_HEIGHT_MESSAGE,
        height: Infinity,
      }),
    ).toBeUndefined();
    expect(previewHeightOf('148')).toBeUndefined();
    expect(previewHeightOf(null)).toBeUndefined();
  });
});

describe('NATIVE_PREVIEW_HEIGHT_MESSAGE', () => {
  it('is the type the native preview posts its height under', () => {
    expect(readFileSync(FRAME_HEIGHT_SOURCE, 'utf8')).toContain(
      `const HEIGHT_MESSAGE = '${NATIVE_PREVIEW_HEIGHT_MESSAGE}';`,
    );
  });
});

describe('nativePreviewTitle', () => {
  it("names the frame after the demo as a reader says it, not after the demo's file", () => {
    expect(nativePreviewTitle('button-demo')).toBe('Button demo preview');
    expect(nativePreviewTitle('password-input-demo')).toBe('Password input demo preview');
  });
});

describe('expoGoUrl', () => {
  it("opens the demo in Expo Go from the style's channel of the engine's project", () => {
    expect(expoGoUrl({ engine: 'nativewind', style: 'nova', demo: 'button-demo' })).toBe(
      `exp://u.expo.dev/${NATIVEWIND_ID}/--/button-demo?runtime-version=exposdk%3A58.0.0&channel-name=nova`,
    );
    expect(
      expoGoUrl({
        engine: 'uniwind',
        style: 'vega',
        demo: 'password-input-demo',
      }),
    ).toBe(`exp://u.expo.dev/${UNIWIND_ID}/--/password-input-demo?runtime-version=exposdk%3A58.0.0&channel-name=vega`);
  });

  it('has no link while the engine has no project', () => {
    device.ids.uniwind = null;

    expect(expoGoUrl({ engine: 'uniwind', style: 'vega', demo: 'button-demo' })).toBeNull();
  });
});

describe('EXPO_GO_SDK', () => {
  it('is the Expo SDK the native preview is built on, so its updates open in that Expo Go', () => {
    const pinned = /^\s+"expo": "(\d+)\./m.exec(readFileSync(WORKSPACE_CATALOG, 'utf8'));

    expect(pinned?.[1]).toBe(String(EXPO_GO_SDK));
  });
});

describe('EXPO_PROJECT_IDS', () => {
  it.each(Object.entries(PREVIEW_APP_CONFIGS))(
    'is the EAS project the %s preview publishes its updates to, so the QR opens them',
    async (engine, path) => {
      const config = JSON.parse(readFileSync(path, 'utf8')) as {
        expo: { extra: { eas: { projectId: string } } };
      };
      const { EXPO_PROJECT_IDS } = await vi.importActual<typeof import('@/constants/native-preview-device')>(
        '@/constants/native-preview-device',
      );

      expect(EXPO_PROJECT_IDS[engine as NativeEngine]).toBe(config.expo.extra.eas.projectId);
    },
  );
});
