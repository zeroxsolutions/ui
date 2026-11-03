/**
 * Engine-agnostic theming: the `IEditorTheme` contract, the shipped default
 * theme built on `the ui registry` tokens, `EditorThemeProvider` (light/dark
 * sync via `next-themes`), and `extendTheme` (see `editor-theming`).
 */
export type {
  CalloutPalette,
  CodeTheme,
  DeepPartial,
  IEditorTheme,
  MathTheme,
  MermaidTheme,
  ThemeMode,
  ThemeVariant,
} from './types/editor-theme.js';
export { defaultEditorTheme } from './default-theme.js';
export { extendTheme } from './extend-theme.js';
export { EditorThemeContext, useEditorTheme, type EditorThemeContextValue } from './editor-theme-context.js';
export { EditorThemeProvider, type EditorThemeProviderProps } from './editor-theme-provider.js';
