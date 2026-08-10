import type { CalloutPalette, IEditorTheme } from './types/editor-theme.js';

/**
 * The shipped default theme (see the `editor-theming` spec). Built on
 * `the ui registry`'s design tokens, so an editor is presentable with **no**
 * configuration and inherits the design system's colors. Callout palettes use
 * token expressions that already flip with the `.dark` class; the code, mermaid,
 * and math values are the JS-side pieces that must be selected per mode.
 */

const callout = (token: string): CalloutPalette => ({
  background: `color-mix(in oklab, var(${token}) 10%, var(--background))`,
  border: `var(${token})`,
  foreground: 'var(--foreground)',
  icon: `var(${token})`,
});

// Callouts ride tokens that auto-flip with `.dark`, so both modes share them.
const callouts: Record<string, CalloutPalette> = {
  note: callout('--muted-foreground'),
  info: callout('--info'),
  success: callout('--success'),
  warning: callout('--warning'),
  danger: callout('--destructive'),
};

export const defaultEditorTheme: IEditorTheme = {
  name: 'zerox-default',
  light: {
    proseClassName: 'zerox-prose',
    callouts,
    code: { shiki: 'github-light', codeMirror: 'light' },
    mermaid: { theme: 'default' },
    math: { color: 'var(--foreground)' },
  },
  dark: {
    proseClassName: 'zerox-prose',
    callouts,
    code: { shiki: 'github-dark', codeMirror: 'dark' },
    mermaid: { theme: 'dark' },
    math: { color: 'var(--foreground)' },
  },
};
