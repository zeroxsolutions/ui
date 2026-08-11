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
import type { Highlighter } from 'shiki';
import type { ThemedToken } from 'shiki/types';

import {
  ensureHighlighter,
  ensureLanguage,
  getLoadedHighlighter,
  resolveLanguage,
  SHIKI_THEME_NAME,
  tokensToRanges,
} from '@/registry/bases/base-ui/lib/shiki';

// Re-exported for back-compat: these pure helpers moved to the framework-agnostic
// core (`@/registry/bases/base-ui/lib/shiki`) but several call-sites + specs import them
// from here.
export {
  styleForToken,
  tokensToRanges,
  type SyntaxRange,
} from '@/registry/bases/base-ui/lib/shiki';

/**
 * Syntax highlighting for the CodeMirror surface, powered by Shiki — a thin,
 * own-built bridge (no third-party CodeMirror widget) over the shared highlighter
 * in `@/registry/bases/base-ui/lib/shiki`. Shiki tokenizes the document; we map each
 * token to a CodeMirror `Decoration.mark` carrying an inline style. Token colors
 * are `var(--shiki-token-*)` references resolved to the design tokens by
 * {@link editorTheme} — light/dark tracks the tokens for free.
 */

const rehighlight = StateEffect.define<null>();

/** The Shiki language id to tokenize the document as; `undefined` = no highlight. */
export const syntaxLanguage = Facet.define<
  string | undefined,
  string | undefined
>({ combine: (values) => values[0] });

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

  // Normalize aliases (`js` → `javascript`) and drop unsupported languages to
  // plain text. Everything below keys off the canonical id so the loaded-set
  // check, the in-flight guard, and `codeToTokens` always agree.
  const canonical = resolveLanguage(lang);
  if (!canonical) return Decoration.none;

  // `ensureHighlighter`/`ensureLanguage` de-dupe the actual work internally, so
  // we always subscribe THIS view to the completion. Gating the subscription on
  // a global "already in flight" flag starves a view that mounts mid-load (React
  // StrictMode remounts the editor while the first instance's load is pending):
  // only the destroyed first view got the callback, so the live view never
  // repainted and the file stayed plain until an unrelated edit forced a rebuild.
  const h = getLoadedHighlighter();
  if (!h) {
    ensureHighlighter().then(() => requestRehighlight(view));
    return Decoration.none;
  }

  if (!h.getLoadedLanguages().includes(canonical)) {
    ensureLanguage(canonical).then(() => requestRehighlight(view));
    return Decoration.none;
  }

  let tokens: ThemedToken[][];
  try {
    tokens = h.codeToTokens(view.state.doc.toString(), {
      // `canonical` is loaded above; the bundled signature narrows to known ids,
      // so widen our checked string to it.
      lang: canonical as Parameters<Highlighter['codeToTokens']>[1]['lang'],
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
 * CodeMirror chrome (gutters, active line, cursor, selection) themed to the
 * design tokens. Syntax token colors are NOT set here — they arrive as
 * `var(--code-*)` references on each `Decoration.mark` from {@link codeTheme},
 * the same brand palette the chat `CodeBlock` uses; because the `--code-*` tokens
 * flip in `.dark`, the editor follows light/dark with no separate dark theme.
 */
export const editorTheme: Extension = EditorView.theme({
  '&': {
    color: 'var(--code-fg)',
    backgroundColor: 'transparent',
  },
  '&.cm-focused': { outline: 'none' },
  // Long lines scroll on the design system's thin rail, not the browser's default
  // chrome scrollbar — a `var(--border)` rounded thumb over a transparent track,
  // matching the `ScrollBar` primitive (`w-2.5 rounded-full bg-border`) the
  // read-only CodeBlock uses. `scrollbar-*` covers Firefox; `::-webkit-scrollbar`
  // covers Chrome/Safari.
  '.cm-scroller': {
    scrollbarWidth: 'thin',
    scrollbarColor: 'var(--border) transparent',
  },
  '.cm-scroller::-webkit-scrollbar': { height: '10px', width: '10px' },
  '.cm-scroller::-webkit-scrollbar-track': { backgroundColor: 'transparent' },
  '.cm-scroller::-webkit-scrollbar-thumb': {
    backgroundColor: 'var(--border)',
    borderRadius: '9999px',
    border: '2px solid transparent',
    backgroundClip: 'padding-box',
  },
  '.cm-scroller::-webkit-scrollbar-thumb:hover': {
    backgroundColor: 'var(--muted-foreground)',
  },
  '.cm-scroller::-webkit-scrollbar-corner': { backgroundColor: 'transparent' },
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
  // The focused selector mirrors CodeMirror's own baseTheme path
  // (`.cm-focused > .cm-scroller > .cm-selectionLayer .cm-selectionBackground`)
  // so it matches that rule's specificity and, injected later as a theme, wins.
  // A shorter `&.cm-focused .cm-selectionBackground` is out-ranked by the base
  // rule, leaving the pale light-theme default in place — which, under the dark
  // token background, hides the (light) selected text entirely.
  '&.cm-focused > .cm-scroller > .cm-selectionLayer .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection':
    { backgroundColor: 'color-mix(in oklch, var(--accent) 70%, transparent)' },
  '.cm-matchingBracket, &.cm-focused .cm-matchingBracket': {
    backgroundColor: 'color-mix(in oklch, var(--primary) 22%, transparent)',
    outline: '1px solid color-mix(in oklch, var(--primary) 40%, transparent)',
  },
});
