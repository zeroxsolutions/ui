import { createContext, useContext } from 'react';
import { defaultEditorTheme } from './default-theme.js';
import type { IEditorTheme, ThemeMode, ThemeVariant } from './types/editor-theme.js';

/** The active theme + resolved mode + the variant selected for that mode. */
export interface EditorThemeContextValue {
  theme: IEditorTheme;
  mode: ThemeMode;
  variant: ThemeVariant;
}

export const EditorThemeContext = createContext<EditorThemeContextValue | null>(null);

/**
 * Read the active editor theme. Usable with **no** provider: it falls back to
 * the shipped default theme (light), so an editor is presentable out of the box.
 */
export function useEditorTheme(): EditorThemeContextValue {
  const context = useContext(EditorThemeContext);
  if (context) return context;
  return {
    theme: defaultEditorTheme,
    mode: 'light',
    variant: defaultEditorTheme.light,
  };
}
