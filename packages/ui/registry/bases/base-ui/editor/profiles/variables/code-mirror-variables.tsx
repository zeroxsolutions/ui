import type { ReactNode } from 'react';
import { flushSync } from 'react-dom';
import { createRoot } from 'react-dom/client';
import {
  autocompletion,
  pickedCompletion,
  type Completion,
  type CompletionContext,
  type CompletionResult,
} from '@codemirror/autocomplete';
import { Prec, StateEffect, type Extension } from '@codemirror/state';
import {
  Decoration,
  EditorView,
  MatchDecorator,
  ViewPlugin,
  type DecorationSet,
  type ViewUpdate,
} from '@codemirror/view';
import { cva } from 'class-variance-authority';
import type { VariableDeclaration } from '@zeroxsolutions/editor-core/profiles/index';
import { VARIABLE_TOKEN } from '@zeroxsolutions/editor-core/template/index';

export interface CodeMirrorVariablesOptions {
  /** The declared variables. Read as the author types, and again each time `subscribe` signals. */
  declarations: () => readonly VariableDeclaration[];
  /**
   * Calls its listener each time the host changes the declarations, and returns the call that stops it, so
   * the tokens already drawn are drawn again. Without it, a token is drawn again only once its line is edited.
   */
  subscribe?: (listener: () => void) => () => void;
  /** The glyph a declaration shows in the `{{` list, such as its type's icon. None when absent. */
  icon?: (declaration: VariableDeclaration) => ReactNode;
  /**
   * Milliseconds the `{{` list ignores keys after it opens, so a key pressed before the author sees it types as
   * text. The library's default when absent.
   */
  interactionDelay?: number;
}

const redraw = StateEffect.define<null>();

// cva rather than plain strings, so `shadcn add` writes each slot as the installing project's style draws it.
const tokenVariants = cva('cn-editor-inline', {
  variants: {
    declared: { true: 'bg-primary/10 text-primary', false: 'bg-destructive/10 text-destructive' },
  },
});
const listVariants = cva('cn-editor-toolbar bg-popover text-popover-foreground text-sm');
const optionVariants = cva(
  'cn-editor-menu-item aria-selected:bg-accent aria-selected:text-accent-foreground flex cursor-pointer items-center gap-2 [&_svg]:size-4 [&_svg]:shrink-0',
);

// The library's base theme draws the list in monospace with its own blue selection, at a higher specificity
// than a class; these put the design tokens in its place.
const listTheme = EditorView.theme({
  '.cm-tooltip.cm-tooltip-autocomplete': { border: 'none', backgroundColor: 'var(--popover)' },
  '.cm-tooltip.cm-tooltip-autocomplete > ul': { fontFamily: 'inherit', minWidth: '14rem', maxHeight: '18rem' },
  '.cm-tooltip.cm-tooltip-autocomplete > ul > li': { padding: '0.375rem 0.5rem', lineHeight: 'inherit' },
  '.cm-tooltip-autocomplete ul li[aria-selected]': {
    backgroundColor: 'var(--accent)',
    color: 'var(--accent-foreground)',
  },
});

const labelOf = (declaration: VariableDeclaration): string => declaration.label || declaration.name;

/** The same match as the editor's `{{` menu: the query found, ignoring case, in a label or a name. */
function matching(declarations: readonly VariableDeclaration[], query: string): VariableDeclaration[] {
  const needle = query.toLowerCase();
  return declarations.filter(
    (declaration) =>
      labelOf(declaration).toLowerCase().includes(needle) || declaration.name.toLowerCase().includes(needle),
  );
}

/** `node` drawn once into a detached element, for a list row the library builds outside React. */
function staticNode(node: ReactNode): HTMLElement {
  const host = document.createElement('span');
  const scratch = document.createElement('span');
  const root = createRoot(scratch);
  flushSync(() => root.render(node));
  host.append(...[...scratch.childNodes].map((child) => child.cloneNode(true)));
  root.unmount();
  return host;
}

/** Each live pane with variables, by its `.cm-editor` element. */
const panes = new WeakMap<Element, EditorView>();

/**
 * The pane with variables `element` is in, while it takes typing, or null. A variable menu outside the pane
 * reads it off the element that held the focus before the menu took it, so the variable lands in the code
 * rather than in the document around it.
 */
export function variablePaneOf(element: Element | null): EditorView | null {
  const root = element?.closest('.cm-editor');
  const view = root ? panes.get(root) : undefined;
  return view && view.dom.isConnected && !view.state.readOnly ? view : null;
}

/** The change that writes `{{name}}` over `from`..`to`, taking in a `}}` already right after it. */
function tokenChange(view: EditorView, from: number, to: number, name: string) {
  const token = `{{${name}}}`;
  const end = view.state.sliceDoc(to, to + 2) === '}}' ? to + 2 : to;
  return { changes: { from, to: end, insert: token }, selection: { anchor: from + token.length } };
}

/** Writes `{{name}}` over the pane's selection. */
export function insertPaneVariable(view: EditorView, name: string): void {
  const { from, to } = view.state.selection.main;
  view.dispatch({ ...tokenChange(view, from, to, name), userEvent: 'input' });
}

/**
 * Variables in a CodeMirror pane: every `{{name}}` drawn as a token, the ones the declarations do not name
 * marked as undeclared (`data-problem="variable-undeclared"`), and typing `{{` lists the declarations, filtered
 * by what follows; a pick writes `{{name}}` as text. Build one per pane.
 */
export function codeMirrorVariables({
  declarations,
  subscribe,
  icon,
  interactionDelay,
}: CodeMirrorVariablesOptions): Extension {
  const declarationOf = new WeakMap<Completion, VariableDeclaration>();

  const source = (context: CompletionContext): CompletionResult | null => {
    const typed = context.matchBefore(/\{\{\w*/);
    if (!typed) return null;
    const options = matching(declarations(), typed.text.slice(2)).map((declaration) => {
      const completion: Completion = {
        label: labelOf(declaration),
        apply: (view, picked, from, to) =>
          view.dispatch({
            ...tokenChange(view, from, to, declaration.name),
            annotations: pickedCompletion.of(picked),
            userEvent: 'input.complete',
          }),
      };
      declarationOf.set(completion, declaration);
      return completion;
    });
    // Matched here, by label or name, so the library must not filter them again; `update` matches again on each
    // keystroke while the list is open, where the library would otherwise query the source anew.
    return options.length > 0
      ? { from: typed.from, options, filter: false, update: (_current, _from, _to, next) => source(next) }
      : null;
  };

  const tokens = new MatchDecorator({
    regexp: new RegExp(VARIABLE_TOKEN.source, 'g'),
    decoration: (match) => {
      const name = match[1];
      const declared = declarations().some((declaration) => declaration.name === name);
      return Decoration.mark({
        class: tokenVariants({ declared }),
        attributes: declared
          ? { 'data-variable': name }
          : { 'data-variable': name, 'data-problem': 'variable-undeclared', 'aria-invalid': 'true' },
      });
    },
  });

  const drawnTokens = ViewPlugin.fromClass(
    class {
      decorations: DecorationSet;
      private readonly stop: (() => void) | undefined;
      constructor(private readonly view: EditorView) {
        this.decorations = tokens.createDeco(view);
        this.stop = subscribe?.(() => view.dispatch({ effects: redraw.of(null) }));
        panes.set(view.dom, view);
      }
      update(update: ViewUpdate) {
        const asked = update.transactions.some((tr) => tr.effects.some((effect) => effect.is(redraw)));
        this.decorations = asked ? tokens.createDeco(update.view) : tokens.updateDeco(update, this.decorations);
      }
      destroy() {
        this.stop?.();
        panes.delete(this.view.dom);
      }
    },
    { decorations: (plugin) => plugin.decorations },
  );

  return [
    autocompletion({
      override: [source],
      icons: false,
      ...(interactionDelay === undefined ? {} : { interactionDelay }),
      tooltipClass: () => listVariants(),
      optionClass: () => optionVariants(),
      addToOptions: icon
        ? [
            {
              render: (completion) => {
                const declaration = declarationOf.get(completion);
                return declaration ? staticNode(icon(declaration)) : null;
              },
              position: 20,
            },
          ]
        : [],
    }),
    listTheme,
    // Below the syntax colours, so a token's mark is the innermost span and its colour is the one drawn.
    Prec.lowest(drawnTokens),
  ];
}
