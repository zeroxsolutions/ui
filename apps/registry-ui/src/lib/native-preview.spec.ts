// @vitest-environment node
import { describe, expect, it } from 'vitest';

import { NATIVE_PREVIEW_HEIGHT_MESSAGE, nativePreviewSrc, previewHeightOf, previewTheme } from './native-preview';

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
