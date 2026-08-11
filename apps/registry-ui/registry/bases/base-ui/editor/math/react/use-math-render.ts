'use client';

import { useState } from 'react';
import { useEditorTheme } from '../../shared/theme/editor-theme-context.js';
import { renderMath } from '@zeroxsolutions/editor-core/math/core/render';

/**
 * The lifecycle of a render. KaTeX is synchronous, so there is no `idle` /
 * `rendering` step (the mermaid async states) - a render resolves to `ok`,
 * `error`, or `empty` within the same render pass.
 */
export type MathRenderStatus = 'ok' | 'error' | 'empty';

/** The result of the shared render path, consumed by the preview/viewer. */
export interface MathRenderState {
  /** The formula markup to show - the current render, or the last good one on error. */
  html: string;
  status: MathRenderStatus;
  /** Present when `status === 'error'` - the KaTeX parse message. */
  error?: string;
  /** The themed formula color (a CSS value) the container applies via `currentColor`. */
  color: string;
}

/**
 * The shared render path for the surface and the in-document block. Because KaTeX
 * renders synchronously and SSR-safe, the formula is produced during render (not
 * in an effect), so the real formula is on the first paint in any environment -
 * including the server, where there is no live DOM. On a parse error the last
 * good markup is retained (kept in state via the blessed "store info from a
 * previous render" pattern, not a ref written during render) and the error is
 * exposed so the caller can show an `Alert`; empty source resolves to `empty`,
 * never an error. The color rides the active editor theme's `variant.math`.
 */
export function useMathRender(
  source: string,
  options?: { displayMode?: boolean },
): MathRenderState {
  const { variant } = useEditorTheme();
  const color = variant.math.color;
  const displayMode = options?.displayMode ?? true;

  const [lastGood, setLastGood] = useState('');

  if (!source.trim()) {
    return { html: '', status: 'empty', color };
  }

  const result = renderMath(source, { displayMode });
  if (result.ok) {
    // Remember the good render so a later failing edit can keep showing it.
    if (result.html !== lastGood) setLastGood(result.html);
    return { html: result.html, status: 'ok', color };
  }
  return { html: lastGood, status: 'error', error: result.error, color };
}
