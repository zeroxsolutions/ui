// @vitest-environment node
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import {
  NATIVE_PREVIEW_HEIGHT_MESSAGE,
  nativePreviewSrc,
  nativePreviewTitle,
  previewHeightOf,
  previewTheme,
} from './native-preview';

/** The native preview's module that posts the height message, in the app that writes it. */
const FRAME_HEIGHT_SOURCE = join(import.meta.dirname, '../../../native-preview/src/app/frame-height.ts');

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
