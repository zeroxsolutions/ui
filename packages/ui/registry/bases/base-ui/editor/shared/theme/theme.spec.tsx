import { renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it } from 'vitest';
import { defaultEditorTheme } from './default-theme.js';
import { EditorThemeProvider } from './editor-theme-provider.js';
import { useEditorTheme } from './editor-theme-context.js';
import { extendTheme } from './extend-theme.js';

describe('editor theming', () => {
  it('carries mode-specific sub-renderer themes from one contract', () => {
    // The whole point of light/dark sync: one toggle changes prose, code,
    // mermaid, and math together because they all live in one variant.
    expect(defaultEditorTheme.light.code.shiki).toBe('github-light');
    expect(defaultEditorTheme.dark.code.shiki).toBe('github-dark');
    expect(defaultEditorTheme.light.mermaid.theme).toBe('default');
    expect(defaultEditorTheme.dark.mermaid.theme).toBe('dark');
  });

  it('is usable with no provider (falls back to the default light theme)', () => {
    const { result } = renderHook(() => useEditorTheme());
    expect(result.current.theme.name).toBe('zerox-default');
    expect(result.current.mode).toBe('light');
    expect(result.current.variant.code.shiki).toBe('github-light');
  });

  it('selects every sub-renderer for the resolved mode together', () => {
    const wrapper = ({ children }: { children: ReactNode }) => (
      <EditorThemeProvider forcedMode="dark">{children}</EditorThemeProvider>
    );
    const { result } = renderHook(() => useEditorTheme(), { wrapper });
    expect(result.current.mode).toBe('dark');
    expect(result.current.variant.code.shiki).toBe('github-dark');
    expect(result.current.variant.mermaid.theme).toBe('dark');
    expect(result.current.variant.code.codeMirror).toBe('dark');
  });

  it('extends the theme by overriding a subset of tokens', () => {
    const custom = extendTheme(defaultEditorTheme, {
      light: { callouts: { info: { border: 'hotpink' } } },
    });
    expect(custom.light.callouts.info.border).toBe('hotpink');
    // Untouched tokens fall back to the base.
    expect(custom.light.callouts.info.foreground).toBe(defaultEditorTheme.light.callouts.info.foreground);
    expect(custom.dark.code.shiki).toBe('github-dark');
  });

  it('renders entirely from a full replacement theme', () => {
    const replacement = extendTheme(defaultEditorTheme, {
      name: 'brand',
      dark: { mermaid: { theme: 'forest' } },
    });
    const wrapper = ({ children }: { children: ReactNode }) => (
      <EditorThemeProvider theme={replacement} forcedMode="dark">
        {children}
      </EditorThemeProvider>
    );
    const { result } = renderHook(() => useEditorTheme(), { wrapper });
    expect(result.current.theme.name).toBe('brand');
    expect(result.current.variant.mermaid.theme).toBe('forest');
  });
});
