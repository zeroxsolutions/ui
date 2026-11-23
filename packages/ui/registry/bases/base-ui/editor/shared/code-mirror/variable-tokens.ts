import { Prec, StateEffect, StateField, type EditorState, type Extension } from '@codemirror/state';
import {
  Decoration,
  EditorView,
  MatchDecorator,
  ViewPlugin,
  keymap,
  showTooltip,
  type DecorationSet,
  type Tooltip,
  type ViewUpdate,
} from '@codemirror/view';
import { cva } from 'class-variance-authority';
import type { VariableDeclaration } from '@zeroxsolutions/editor-core/profiles/index';
import { VARIABLE_TOKEN } from '@zeroxsolutions/editor-core/template/index';

/** What the `{{` list offers while it is open: the declarations that match what follows `{{`, one highlighted. */
interface Completion {
  /** Where the typed `{{` starts. */
  from: number;
  query: string;
  options: readonly VariableDeclaration[];
  index: number;
}

interface CompletionState {
  open: Completion | null;
  /** The `{{` the author closed the list on with Escape, which stays closed while the caret is after it. */
  dismissed: number | null;
}

const CLOSED: CompletionState = { open: null, dismissed: null };
const OPEN_QUERY = /\{\{(\w*)$/;

const moveHighlight = StateEffect.define<number>();
const dismiss = StateEffect.define<null>();

// cva rather than plain strings, so `shadcn add` writes each slot as the installing project's style draws it.
const tokenVariants = cva('cn-editor-inline', {
  variants: {
    declared: { true: 'bg-primary/10 text-primary', false: 'bg-destructive/10 text-destructive' },
  },
});
const panelVariants = cva('cn-editor-toolbar cm-variable-completion bg-popover text-popover-foreground w-56 text-sm');
const rowVariants = cva(
  'cn-editor-menu-item data-highlighted:bg-accent data-highlighted:text-accent-foreground flex cursor-pointer items-center gap-2 px-2 py-1.5',
);

const labelOf = (declaration: VariableDeclaration): string => declaration.label || declaration.name;

/** The same match as the editor's `{{` menu: the query found, ignoring case, in a label or a name. */
function matching(declarations: readonly VariableDeclaration[], query: string): VariableDeclaration[] {
  const needle = query.toLowerCase();
  return declarations.filter(
    (declaration) =>
      labelOf(declaration).toLowerCase().includes(needle) || declaration.name.toLowerCase().includes(needle),
  );
}

/** The `{{query` right before a collapsed caret, if the caret sits after one. */
function queryAt(state: EditorState): { from: number; query: string } | null {
  const { main } = state.selection;
  if (!main.empty) return null;
  const line = state.doc.lineAt(main.head);
  const found = OPEN_QUERY.exec(line.text.slice(0, main.head - line.from));
  return found ? { from: main.head - found[0].length, query: found[1] } : null;
}

let listIds = 0;

/**
 * Variables in a CodeMirror pane: every `{{name}}` drawn as a token, the ones `declarations` does not name marked
 * as undeclared (`data-problem="variable-undeclared"`), and a list of the declarations opened by typing `{{`,
 * filtered by what follows, whose pick writes `{{name}}` as text. `declarations` is read on each keystroke, so a
 * host may change them; a token already drawn is drawn again once its line is edited.
 */
export function variableTokens(declarations: () => readonly VariableDeclaration[]): Extension {
  const listId = `variable-completion-${(listIds += 1)}`;

  const completion = StateField.define<CompletionState>({
    create: () => CLOSED,
    update(value, tr) {
      if (tr.effects.some((effect) => effect.is(dismiss))) {
        return { open: null, dismissed: value.open?.from ?? value.dismissed };
      }
      const moved = tr.effects.find((effect) => effect.is(moveHighlight));
      if (moved && value.open) {
        const count = value.open.options.length;
        return { ...value, open: { ...value.open, index: (value.open.index + moved.value + count) % count } };
      }
      if (!tr.docChanged && !tr.selection) return value;
      const at = queryAt(tr.state);
      if (!at) return CLOSED;
      const dismissed = value.dismissed === at.from ? at.from : null;
      // Only typing opens the list; a caret moved onto an old `{{` leaves it closed.
      if (dismissed !== null || (!tr.docChanged && !value.open)) return { open: null, dismissed };
      const options = matching(declarations(), at.query);
      if (options.length === 0) return { open: null, dismissed };
      const index = value.open?.query === at.query ? Math.min(value.open.index, options.length - 1) : 0;
      return { open: { from: at.from, query: at.query, options, index }, dismissed };
    },
  });

  const pick = (view: EditorView, declaration: VariableDeclaration): void => {
    const open = view.state.field(completion).open;
    if (!open) return;
    const token = `{{${declaration.name}}}`;
    view.dispatch({
      changes: { from: open.from, to: view.state.selection.main.head, insert: token },
      selection: { anchor: open.from + token.length },
      userEvent: 'input.complete',
    });
  };

  const list = (state: EditorState): Tooltip | null => {
    const open = state.field(completion).open;
    if (!open) return null;
    return {
      pos: open.from,
      above: false,
      create: (view) => {
        const dom = document.createElement('div');
        dom.className = panelVariants();
        dom.id = listId;
        dom.setAttribute('role', 'listbox');
        dom.setAttribute('data-slot', 'variable-completion');
        open.options.forEach((declaration, index) => {
          const row = document.createElement('div');
          row.id = `${listId}-${index}`;
          row.className = rowVariants();
          row.setAttribute('role', 'option');
          row.setAttribute('aria-selected', String(index === open.index));
          if (index === open.index) row.setAttribute('data-highlighted', '');
          row.textContent = labelOf(declaration);
          // Pressed, not clicked, so the pane keeps the focus and the caret the pick replaces.
          row.addEventListener('mousedown', (event) => {
            event.preventDefault();
            pick(view, declaration);
          });
          dom.append(row);
        });
        return { dom };
      },
    };
  };

  const whileOpen =
    (run: (view: EditorView, open: Completion) => void) =>
    (view: EditorView): boolean => {
      const open = view.state.field(completion).open;
      if (!open) return false;
      run(view, open);
      return true;
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
      constructor(view: EditorView) {
        this.decorations = tokens.createDeco(view);
      }
      update(update: ViewUpdate) {
        this.decorations = tokens.updateDeco(update, this.decorations);
      }
    },
    { decorations: (plugin) => plugin.decorations },
  );

  return [
    completion,
    showTooltip.compute([completion], list),
    // Below the syntax colours, so a token's mark is the innermost span and its colour is the one drawn.
    Prec.lowest(drawnTokens),
    EditorView.contentAttributes.compute([completion], (state): Record<string, string> => {
      const open = state.field(completion).open;
      return open
        ? { 'aria-controls': listId, 'aria-activedescendant': `${listId}-${open.index}`, 'aria-expanded': 'true' }
        : {};
    }),
    Prec.highest(
      keymap.of([
        { key: 'ArrowDown', run: whileOpen((view) => view.dispatch({ effects: moveHighlight.of(1) })) },
        { key: 'ArrowUp', run: whileOpen((view) => view.dispatch({ effects: moveHighlight.of(-1) })) },
        { key: 'Enter', run: whileOpen((view, open) => pick(view, open.options[open.index])) },
        { key: 'Tab', run: whileOpen((view, open) => pick(view, open.options[open.index])) },
        { key: 'Escape', run: whileOpen((view) => view.dispatch({ effects: dismiss.of(null) })) },
      ]),
    ),
    // CodeMirror's own tooltip frame would draw a grey box around the design system's panel.
    EditorView.baseTheme({
      '.cm-tooltip.cm-variable-completion': {
        border: 'none',
        backgroundColor: 'var(--popover)',
        color: 'var(--popover-foreground)',
      },
    }),
  ];
}
