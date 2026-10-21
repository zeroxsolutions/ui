// @vitest-environment node
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { EXPO_GO_SDK } from '@/constants/native-preview-device';

import {
  expoGoUrl,
  NATIVE_PREVIEW_HEIGHT_MESSAGE,
  nativePreviewSrc,
  nativePreviewTitle,
  previewHeightOf,
  previewTheme,
} from './native-preview';

/** The native preview's module that posts the height message, in the app that writes it. */
const FRAME_HEIGHT_SOURCE = join(import.meta.dirname, '../../../native-preview/src/app/frame-height.ts');

/** The workspace's catalog, whose `expo` catalog pins the SDK the native preview is built on. */
const WORKSPACE_CATALOG = join(import.meta.dirname, '../../../../pnpm-workspace.yaml');

const PROJECT_ID = '0f6c4b9e-2d1a-4c3b-9e8f-7a6b5c4d3e2f';

describe('nativePreviewSrc', () => {
  it("points at the demo's page in the style's export, with the theme in its query", () => {
    expect(nativePreviewSrc({ style: 'nova', demo: 'button-demo', theme: 'dark' })).toBe(
      '/native-preview/nova/button-demo.html?theme=dark',
    );
    expect(nativePreviewSrc({ style: 'vega', demo: 'password-input-demo', theme: 'light' })).toBe(
      '/native-preview/vega/password-input-demo.html?theme=light',
    );
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
    expect(previewHeightOf({ type: NATIVE_PREVIEW_HEIGHT_MESSAGE, height: Number.NaN })).toBeUndefined();
    expect(previewHeightOf({ type: NATIVE_PREVIEW_HEIGHT_MESSAGE, height: Infinity })).toBeUndefined();
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
  it("opens the demo in Expo Go from the style's channel of the project's updates", () => {
    expect(expoGoUrl({ projectId: PROJECT_ID, style: 'nova', demo: 'button-demo' })).toBe(
      `exp://u.expo.dev/${PROJECT_ID}/--/button-demo?runtime-version=exposdk%3A58.0.0&channel-name=nova`,
    );
  });

  it('names the vega channel on a vega page, and the demo it was given', () => {
    expect(expoGoUrl({ projectId: PROJECT_ID, style: 'vega', demo: 'password-input-demo' })).toBe(
      `exp://u.expo.dev/${PROJECT_ID}/--/password-input-demo?runtime-version=exposdk%3A58.0.0&channel-name=vega`,
    );
  });

  it('carries the project it was given', () => {
    expect(expoGoUrl({ projectId: 'another-project', style: 'vega', demo: 'button-demo' })).toMatch(
      /^exp:\/\/u\.expo\.dev\/another-project\/--\//,
    );
  });
});

describe('EXPO_GO_SDK', () => {
  it('is the Expo SDK the native preview is built on, so its updates open in that Expo Go', () => {
    const pinned = /^\s+"expo": "(\d+)\./m.exec(readFileSync(WORKSPACE_CATALOG, 'utf8'));

    expect(pinned?.[1]).toBe(String(EXPO_GO_SDK));
  });
});
