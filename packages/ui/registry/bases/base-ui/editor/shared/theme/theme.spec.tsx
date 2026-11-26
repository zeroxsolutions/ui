import { renderToStaticMarkup } from 'react-dom/server';
import type { ReactNode } from 'react';
import { describe, expect, it } from 'vitest';
import { defaultEditorTheme } from './default-theme';
import { EditorThemeProvider } from './editor-theme-provider';
import { useEditorTheme } from './editor-theme-context';
import { extendTheme } from './extend-theme';
import type { IEditorTheme } from './types/editor-theme';

/** Draws what a sub-renderer reads from the theme, as `name mode shiki mermaid codeMirror`. */
function ThemeReader(): ReactNode {
  const { theme, mode, variant } = useEditorTheme();
  return `${theme.name} ${mode} ${variant.code.shiki} ${variant.mermaid.theme} ${variant.code.codeMirror}`;
}

function drawn(provider?: { theme?: IEditorTheme; forcedMode?: 'light' | 'dark' }): string {
  return renderToStaticMarkup(
    provider ? (
      <EditorThemeProvider {...provider}>
        <ThemeReader />
      </EditorThemeProvider>
    ) : (
      <ThemeReader />
    ),
  );
}

describe('editor theming', () => {
  it('draws the default light theme with no provider', () => {
    expect(drawn()).toBe('zerox-default light github-light default light');
  });

  it('selects every sub-renderer for the resolved mode together', () => {
    expect(drawn({ forcedMode: 'dark' })).toBe('zerox-default dark github-dark dark dark');
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

  it('draws from a replacement theme the provider is given', () => {
    const replacement = extendTheme(defaultEditorTheme, {
      name: 'brand',
      dark: { mermaid: { theme: 'forest' } },
    });
    expect(drawn({ theme: replacement, forcedMode: 'dark' })).toBe('brand dark github-dark forest dark');
  });
});
