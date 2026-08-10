'use client';

import { useTheme } from 'next-themes';
import { useMemo, type ReactNode } from 'react';
import { defaultEditorTheme } from './default-theme.js';
import {
  EditorThemeContext,
  type EditorThemeContextValue,
} from './editor-theme-context.js';
import type { IEditorTheme, ThemeMode } from './types/editor-theme.js';

export interface EditorThemeProviderProps {
  /** The theme to apply; defaults to the shipped default theme. */
  theme?: IEditorTheme;
  /**
   * Force a mode independent of the app's theme — e.g. an always-dark read-only
   * Viewer that must not follow the surrounding editing surface (see the
   * `editor-viewer` "Independently Themeable Viewer" requirement).
   */
  forcedMode?: ThemeMode;
  children: ReactNode;
}

/**
 * Synchronizes prose and every sub-renderer (code, diagrams, math) from one
 * source: it reads the resolved light/dark mode from `next-themes` (the same
 * mechanism the design system's `.dark` variant keys off) and provides the
 * matching theme variant, so toggling dark switches them all together.
 */
export function EditorThemeProvider({
  theme = defaultEditorTheme,
  forcedMode,
  children,
}: EditorThemeProviderProps) {
  const { resolvedTheme } = useTheme();
  const mode: ThemeMode =
    forcedMode ?? (resolvedTheme === 'dark' ? 'dark' : 'light');

  const value = useMemo<EditorThemeContextValue>(
    () => ({ theme, mode, variant: mode === 'dark' ? theme.dark : theme.light }),
    [theme, mode],
  );

  return (
    <EditorThemeContext.Provider value={value}>
      {children}
    </EditorThemeContext.Provider>
  );
}
