import {
  Decoration,
  type DecorationSet,
  EditorView,
  ViewPlugin,
  type ViewUpdate,
} from '@codemirror/view';
import {
  type Extension,
  Facet,
  RangeSetBuilder,
  StateEffect,
} from '@codemirror/state';
import { createHighlighter, type Highlighter } from 'shiki';
import { createCssVariablesTheme } from 'shiki/core';
import type { ThemedToken } from 'shiki/types';

/**
 * Syntax highlighting for the CodeMirror surface, powered by Shiki — a thin,
 * own-built bridge (no third-party CodeMirror widget). Shiki tokenizes the
 * document; we map each token to a CodeMirror `Decoration.mark` carrying an
 * inline style. The theme is the built-in **CSS-variables theme**, so every
 * token color is a `var(--shiki-token-*)` reference resolved to the design
 * tokens by {@link editorTheme} — light/dark tracks the tokens for free.
 */

/** Name of the registered CSS-variables theme; passed to `codeToTokens`. */
export const SHIKI_THEME_NAME = 'chisel-vars';

// `--shiki-*` indirection (a small, curated scope→variable set Shiki maintains)
// rather than a hand-authored TextMate theme. The variables themselves are
// mapped to design tokens in `editorTheme`.
const cssVariablesTheme = createCssVariablesTheme({
  name: SHIKI_THEME_NAME,
  variablePrefix: '--shiki-',
  fontStyle: true,
});

let highlighter: Highlighter | null = null;
let creating: Promise<Highlighter> | null = null;
const loadingLangs = new Map<string, Promise<void>>();

function ensureHighlighter(): Promise<Highlighter> {
  if (highlighter) return Promise.resolve(highlighter);
  if (!creating) {
    creating = createHighlighter({
      themes: [cssVariablesTheme],
      langs: [],
    }).then((h) => {
      highlighter = h;
      return h;
    });
  }
  return creating;
}

// Lazy per-language load (the full grammar bundle is ~10MB — never load it all).
// A failed load (unknown id) still resolves; `loadingLangs.has` then stays the
// loop guard so an unknown language degrades to plain text, not an infinite
// re-highlight.
function ensureLanguage(lang: string): Promise<void> {
  const existing = loadingLangs.get(lang);
  if (existing) return existing;
  const p = ensureHighlighter()
    .then((h) =>
      h.getLoadedLanguages().includes(lang)
        ? undefined
        : h.loadLanguage(lang as Parameters<Highlighter['loadLanguage']>[0]),
    )
    .then(() => undefined)
    .catch(() => undefined);
  loadingLangs.set(lang, p);
  return p;
}

/** A token's mark range in document coordinates plus the inline style to apply. */
export interface SyntaxRange {
  from: number;
  to: number;
  style: string;
}

/**
 * Inline style for a Shiki token. `fontStyle` is the vscode-textmate `FontStyle`
 * bitflag (Italic 1 · Bold 2 · Underline 4 · Strikethrough 8); we read the bits
 * directly rather than importing the inlined `const enum`. Returns `''` when the
 * token carries no visible styling (e.g. whitespace).
 */
export function styleForToken(color?: string, fontStyle?: number): string {
  const parts: string[] = [];
  if (color) parts.push(`color:${color}`);
  if (fontStyle && fontStyle > 0) {
    if (fontStyle & 1) parts.push('font-style:italic');
    if (fontStyle & 2) parts.push('font-weight:bold');
    const decoration: string[] = [];
    if (fontStyle & 4) decoration.push('underline');
    if (fontStyle & 8) decoration.push('line-through');
    if (decoration.length) parts.push(`text-decoration:${decoration.join(' ')}`);
  }
  return parts.join(';');
}

/**
 * Map Shiki's 2D token array to flat mark ranges. Each token's `offset` is
 * absolute to the input (0-indexed), so it maps straight to a CodeMirror
 * position. Pure — no Shiki, no CodeMirror — so it is unit-testable in
 * isolation. Zero-length and unstyled tokens are dropped.
 */
export function tokensToRanges(tokens: ThemedToken[][]): SyntaxRange[] {
  const ranges: SyntaxRange[] = [];
  for (const line of tokens) {
    for (const token of line) {
      const length = token.content.length;
      if (length === 0) continue;
      const style = styleForToken(token.color, token.fontStyle);
      if (!style) continue;
      ranges.push({ from: token.offset, to: token.offset + length, style });
    }
  }
  return ranges;
}

const rehighlight = StateEffect.define<null>();

/** The Shiki language id to tokenize the document as; `undefined` = no highlight. */
export const syntaxLanguage = Facet.define<string | undefined, string | undefined>(
  { combine: (values) => values[0] },
);

function requestRehighlight(view: EditorView): void {
  // The async load may resolve after the view is torn down.
  try {
    view.dispatch({ effects: rehighlight.of(null) });
  } catch {
    /* view destroyed */
  }
}

function buildDecorations(view: EditorView): DecorationSet {
  const lang = view.state.facet(syntaxLanguage);
  if (!lang) return Decoration.none;

  const h = highlighter;
  if (!h) {
    const firstKick = creating == null;
    const pending = ensureHighlighter();
    if (firstKick) pending.then(() => requestRehighlight(view));
    return Decoration.none;
  }

  if (!h.getLoadedLanguages().includes(lang)) {
    if (!loadingLangs.has(lang)) {
      ensureLanguage(lang).then(() => requestRehighlight(view));
    }
    return Decoration.none;
  }

  let tokens: ThemedToken[][];
  try {
    tokens = h.codeToTokens(view.state.doc.toString(), {
      // `lang` is a runtime-validated id (loaded above); the bundled signature
      // narrows to known ids, so widen our checked string to it.
      lang: lang as Parameters<Highlighter['codeToTokens']>[1]['lang'],
      theme: SHIKI_THEME_NAME,
    }).tokens;
  } catch {
    return Decoration.none;
  }

  const builder = new RangeSetBuilder<Decoration>();
  for (const { from, to, style } of tokensToRanges(tokens)) {
    builder.add(from, to, Decoration.mark({ attributes: { style } }));
  }
  return builder.finish();
}

const shikiPlugin = ViewPlugin.fromClass(
  class {
    decorations: DecorationSet;

    constructor(view: EditorView) {
      this.decorations = buildDecorations(view);
    }

    update(update: ViewUpdate): void {
      const languageChanged =
        update.startState.facet(syntaxLanguage) !==
        update.state.facet(syntaxLanguage);
      const asked = update.transactions.some((t) =>
        t.effects.some((e) => e.is(rehighlight)),
      );
      if (update.docChanged || languageChanged || asked) {
        this.decorations = buildDecorations(update.view);
      }
    }
  },
  { decorations: (plugin) => plugin.decorations },
);

/** CodeMirror extension that highlights via Shiki, keyed to {@link syntaxLanguage}. */
export function shikiHighlighting(): Extension {
  return shikiPlugin;
}

/**
 * CodeMirror chrome + syntax palette themed entirely to the design tokens. The
 * `--shiki-token-*` variables (emitted by the CSS-variables theme) are mapped to
 * semantic tokens here; because the design tokens themselves flip in `.dark`,
 * the editor follows light/dark with no separate dark theme.
 */
export const editorTheme: Extension = EditorView.theme({
  '&': {
    color: 'var(--foreground)',
    backgroundColor: 'transparent',
    '--shiki-foreground': 'var(--foreground)',
    '--shiki-background': 'transparent',
    '--shiki-token-keyword': 'var(--primary)',
    '--shiki-token-string': 'var(--success)',
    '--shiki-token-string-expression': 'var(--success)',
    '--shiki-token-constant': 'var(--chart-1)',
    '--shiki-token-function': 'var(--info)',
    '--shiki-token-parameter': 'var(--chart-4)',
    '--shiki-token-comment': 'var(--muted-foreground)',
    '--shiki-token-punctuation': 'var(--muted-foreground)',
    '--shiki-token-link': 'var(--info)',
  },
  '&.cm-focused': { outline: 'none' },
  '.cm-content': {
    fontFamily:
      'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace',
    padding: '0.75rem 0',
    caretColor: 'var(--foreground)',
  },
  '.cm-gutters': {
    backgroundColor: 'transparent',
    color: 'var(--muted-foreground)',
    border: 'none',
  },
  '.cm-lineNumbers .cm-gutterElement': { padding: '0 0.75rem 0 1rem' },
  '.cm-activeLine': {
    backgroundColor: 'color-mix(in oklch, var(--muted) 45%, transparent)',
  },
  '.cm-activeLineGutter': {
    backgroundColor: 'transparent',
    color: 'var(--foreground)',
  },
  '.cm-cursor, .cm-dropCursor': { borderLeftColor: 'var(--foreground)' },
  '&.cm-focused .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection':
    { backgroundColor: 'color-mix(in oklch, var(--accent) 70%, transparent)' },
  '.cm-matchingBracket, &.cm-focused .cm-matchingBracket': {
    backgroundColor: 'color-mix(in oklch, var(--primary) 22%, transparent)',
    outline: '1px solid color-mix(in oklch, var(--primary) 40%, transparent)',
  },
});
