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
  highlighterPending,
  languagePending,
  SHIKI_THEME_NAME,
  tokensToRanges,
} from './shiki';

// Re-exported for back-compat: these pure helpers moved to the framework-agnostic
// core (`./shiki`) but several call-sites + specs import them from here.
export {
  styleForToken,
  tokensToRanges,
  type SyntaxRange,
} from './shiki';

/**
 * Syntax highlighting for the CodeMirror surface, powered by Shiki — a thin,
 * own-built bridge (no third-party CodeMirror widget) over the shared highlighter
 * in {@link file://./shiki.ts}. Shiki tokenizes the document; we map each token to
 * a CodeMirror `Decoration.mark` carrying an inline style. Token colors are
 * `var(--shiki-token-*)` references resolved to the design tokens by
 * {@link editorTheme} — light/dark tracks the tokens for free.
 */

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

  const h = getLoadedHighlighter();
  if (!h) {
    const firstKick = !highlighterPending();
    const pending = ensureHighlighter();
    if (firstKick) pending.then(() => requestRehighlight(view));
    return Decoration.none;
  }

  if (!h.getLoadedLanguages().includes(lang)) {
    if (!languagePending(lang)) {
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
