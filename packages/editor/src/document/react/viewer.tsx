'use client';

import { useMemo, type ReactNode } from 'react';
import { cn } from '@zeroxsolutions/ui/lib/utils';
import { createCodecRegistry } from '../serialize/create-codec-registry.js';
import { renderToReact } from '../serialize/render-to-react.js';
import { defaultEditorTheme } from '../../shared/theme/default-theme.js';
import {
  EditorThemeContext,
  type EditorThemeContextValue,
} from '../../shared/theme/editor-theme-context.js';
import type { IEditorTheme, ThemeMode } from '../../shared/theme/types/editor-theme.js';
import type { EditorFeature } from '../core/types/feature.js';
import type { DocJSON } from '../core/types/json.js';

/**
 * The static, SSR-safe Viewer (see the `editor-viewer` spec). It renders stored
 * document JSON to a React tree via the per-node `toReact` codecs — **no editing
 * engine is instantiated and none is imported into this module's graph** (only
 * the engine-free serializer + theme), so it renders on the server without a
 * browser-only runtime. It reuses the same feature registry the Editor does.
 *
 * A `theme`/`forcedMode` prop themes the Viewer independently of any surrounding
 * editing surface (e.g. always-dark), without pulling in `next-themes`.
 */
export interface ViewerProps {
  doc: DocJSON;
  features?: EditorFeature[];
  theme?: IEditorTheme;
  forcedMode?: ThemeMode;
  className?: string;
}

export function Viewer({
  doc,
  features = [],
  theme,
  forcedMode,
  className,
}: ViewerProps): ReactNode {
  const registry = useMemo(() => createCodecRegistry(features), [features]);
  const tree = renderToReact(doc, registry);
  const inner = (
    <div
      data-editor="document"
      className={cn('document-editor prose max-w-none', className)}
    >
      {tree}
    </div>
  );

  if (!theme && !forcedMode) return inner;

  const resolvedTheme = theme ?? defaultEditorTheme;
  const mode: ThemeMode = forcedMode ?? 'light';
  const value: EditorThemeContextValue = {
    theme: resolvedTheme,
    mode,
    variant: mode === 'dark' ? resolvedTheme.dark : resolvedTheme.light,
  };
  return (
    <EditorThemeContext.Provider value={value}>
      {inner}
    </EditorThemeContext.Provider>
  );
}
