'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { useEditorTheme } from '../../shared/theme/editor-theme-context.js';
import { renderDiagram } from '@zeroxsolutions/editor-core/mermaid/core/engine';

/** The lifecycle of a debounced render. */
export type MermaidRenderStatus = 'idle' | 'rendering' | 'ok' | 'error' | 'empty';

export interface MermaidRenderState {
  /** The last successfully rendered SVG (retained across a failing edit). */
  svg: string;
  status: MermaidRenderStatus;
  /** Present when `status === 'error'`. */
  error?: string;
  /** 1-based line the engine blamed, when it reported one. */
  line?: number;
}

/**
 * The shared render path for the surface and the in-document block: debounce the
 * source, render via the lazy engine seam under the active editor theme's Mermaid
 * variant, and — on failure — **retain the last good SVG** while exposing the
 * error. Empty source resolves to an `empty` state, never an error. The engine
 * (and its config theme values) drive `initialize`, and only primitives are used
 * in the effect deps so the `no-provider` theme fallback (a fresh object each
 * render) can't loop the effect.
 */
export function useMermaidRender(source: string, debounceMs = 250): MermaidRenderState {
  const { variant } = useEditorTheme();
  const themeName = variant.mermaid.theme;
  const themeVarsRef = useRef(variant.mermaid.themeVariables);
  themeVarsRef.current = variant.mermaid.themeVariables;

  const reactId = useId();
  const diagramId = `zerox-mermaid-${reactId.replace(/[^a-zA-Z0-9-]/g, '')}`;

  const lastGood = useRef('');
  const [state, setState] = useState<MermaidRenderState>({
    svg: '',
    status: 'idle',
  });

  useEffect(() => {
    if (!source.trim()) {
      setState({ svg: '', status: 'empty' });
      return;
    }
    let cancelled = false;
    setState((prev) => ({ ...prev, status: 'rendering' }));
    const timer = setTimeout(() => {
      void (async () => {
        const result = await renderDiagram(diagramId, source, {
          theme: themeName,
          themeVariables: themeVarsRef.current,
        });
        if (cancelled) return;
        if (result.ok) {
          lastGood.current = result.svg;
          setState({ svg: result.svg, status: 'ok' });
        } else {
          setState({
            svg: lastGood.current,
            status: 'error',
            error: result.error,
            line: result.line,
          });
        }
      })();
    }, debounceMs);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [source, themeName, debounceMs, diagramId]);

  return state;
}
