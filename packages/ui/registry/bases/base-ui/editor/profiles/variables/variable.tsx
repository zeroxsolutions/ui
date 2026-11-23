import { useSyncExternalStore, type ReactNode } from 'react';
import { z } from 'zod';
import { LinkIcon, MailIcon, TimerIcon, TypeIcon } from 'lucide-react';
import { Badge } from '@/registry/bases/base-ui/ui/badge';
import { cva } from 'class-variance-authority';
import {
  Decoration,
  DecorationSet,
  Extension,
  facadeFor,
  Fragment,
  InputRule,
  Plugin,
  PluginKey,
  Slice,
  type Editor,
  type EditorView,
  type EngineHandle,
  type NodeType,
  type ProseMirrorNode,
} from '@zeroxsolutions/editor-core/document/advanced';
import {
  defineFeature,
  EditorError,
  type EditorFeature,
  type IEditor,
  type NodeCodec,
  type NodeSpec,
  type NodeViewProps,
} from '@zeroxsolutions/editor-core/document/core/index';
import { referenceToken, type TriggerOption, type TriggerToken } from '@zeroxsolutions/editor-core/composer/index';
import { emailNodeSpecs, type VariableDeclaration } from '@zeroxsolutions/editor-core/profiles/index';
import { escapeHtml, VARIABLE_TOKEN, type VariableType } from '@zeroxsolutions/editor-core/template/index';
import { DEFAULT_PROFILE_MESSAGES } from '../messages';

type VariableAttrs = { name: string };

/** What a committed variable reads back as. */
export interface VariableRef {
  name: string;
}

export interface VariableFeature {
  feature: EditorFeature;
  token: TriggerToken<'variable', VariableRef>;
  /**
   * Calls `listener` each time `refreshVariables` runs, for a surface outside the document that draws the
   * variables, such as a code pane. Returns the call that stops it.
   */
  watchDeclarations(listener: () => void): () => void;
}

/** The glyph a variable's type shows, in a menu and on its chip. */
export const VARIABLE_TYPE_ICONS: Record<VariableType, typeof TypeIcon> = {
  string: TypeIcon,
  duration: TimerIcon,
  url: LinkIcon,
  email: MailIcon,
};

export function variableIcon(type: VariableType): ReactNode {
  const Icon = VARIABLE_TYPE_ICONS[type];
  return <Icon aria-hidden />;
}

/** The text a variable reads as: its declaration's label, or its name when it has none. */
export function variableLabel(declaration: VariableDeclaration): string {
  return declaration.label || declaration.name;
}

/** Whether `query` finds `declaration`: a case-insensitive match on its label or its name. */
export function matchesVariable(declaration: VariableDeclaration, query: string): boolean {
  const needle = query.trim().toLowerCase();
  return variableLabel(declaration).toLowerCase().includes(needle) || declaration.name.toLowerCase().includes(needle);
}

/** Commit the variable `name` at the caret. */
export function insertVariable(editor: IEditor, name: string): boolean {
  return editor.run('insertVariable', { name });
}

/** Tell the chips the declarations changed, so each reads its label and its problem again. */
export function refreshVariables(editor: IEditor): boolean {
  return editor.run('refreshVariables');
}

// The email profile's own spec, so the node keeps the name and attribute its codecs read.
function emailVariableSpec(): NodeSpec<VariableAttrs> {
  const spec = emailNodeSpecs.nodes.find((node) => node.name === 'variable');
  if (!spec) {
    throw new EditorError('editor.variable.no_node_spec', 'The email profile declares no variable node');
  }
  return spec as NodeSpec<VariableAttrs>;
}

const COMPLETE_TOKEN = /\{\{\w+\}\}$/;

/** Whether a `type` block may hold a variable; a text-only block such as code may not. */
const takesVariable = (type: NodeType, variable: NodeType): boolean => type.contentMatch.matchType(variable) !== null;

function splitText(node: ProseMirrorNode, variable: NodeType): ProseMirrorNode[] {
  const text = node.text ?? '';
  const parts: ProseMirrorNode[] = [];
  let last = 0;
  for (const match of text.matchAll(VARIABLE_TOKEN)) {
    if (match.index > last) parts.push(node.type.schema.text(text.slice(last, match.index), node.marks));
    parts.push(variable.create({ name: match[1] }));
    last = match.index + match[0].length;
  }
  if (last === 0) return [node];
  if (last < text.length) parts.push(node.type.schema.text(text.slice(last), node.marks));
  return parts;
}

/** Where the paste lands: whether the block at each open edge of the slice may hold a variable. */
interface Landing {
  start: boolean;
  end: boolean;
}

/** Each `{{name}}` in the pasted text becomes a variable, in the blocks that may hold one. */
function splitTokens(
  fragment: Fragment,
  variable: NodeType,
  allowed: boolean,
  openStart: number,
  openEnd: number,
  landing: Landing,
): Fragment {
  const nodes: ProseMirrorNode[] = [];
  const last = fragment.childCount - 1;
  fragment.forEach((node, _offset, index) => {
    if (node.isText) {
      nodes.push(...(allowed ? splitText(node, variable) : [node]));
      return;
    }
    const startOpen = index === 0 && openStart > 0;
    const endOpen = index === last && openEnd > 0;
    let inside = allowed;
    if (node.isTextblock) {
      // A textblock cut open at an edge of the slice merges into the block the paste lands in, so that block decides.
      inside =
        startOpen || endOpen
          ? (!startOpen || landing.start) && (!endOpen || landing.end)
          : takesVariable(node.type, variable);
    }
    const content = splitTokens(
      node.content,
      variable,
      inside,
      startOpen ? openStart - 1 : 0,
      endOpen ? openEnd - 1 : 0,
      landing,
    );
    nodes.push(node.copy(content));
  });
  return Fragment.fromArray(nodes);
}

/**
 * How many times the host said the declarations changed. A chip subscribes to it, because the engine does not
 * render a node view again while its node is unchanged, and a declaration lives outside the document.
 */
function declarationsVersion() {
  let version = 0;
  const listeners = new Set<() => void>();
  return {
    bump: () => {
      version += 1;
      for (const listener of listeners) listener();
    },
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    read: () => version,
  };
}

type DeclarationsVersion = ReturnType<typeof declarationsVersion>;
type Transaction = EditorView['state']['tr'];

const TOKEN_TEXT_KEY = new PluginKey<DecorationSet>('variableTokenText');
// cva rather than plain strings, so `shadcn add` writes the slot as the installing project's style draws it.
const tokenTextVariants = cva('cn-editor-inline', {
  variants: {
    declared: { true: 'bg-primary/10 text-primary', false: 'bg-destructive/10 text-destructive' },
  },
});

/** The `{{name}}` tokens of `block`, a text-only block at `pos`, each drawn as a token in place. */
function blockTokens(block: ProseMirrorNode, pos: number, declared: ReadonlySet<string>): Decoration[] {
  const decorations: Decoration[] = [];
  block.forEach((child, offset) => {
    for (const match of (child.text ?? '').matchAll(VARIABLE_TOKEN)) {
      const from = pos + 1 + offset + match.index;
      const name = match[1];
      decorations.push(
        Decoration.inline(
          from,
          from + match[0].length,
          declared.has(name)
            ? { class: tokenTextVariants({ declared: true }), 'data-variable': name }
            : {
                class: tokenTextVariants({ declared: false }),
                'data-variable': name,
                'data-problem': 'variable-undeclared',
                'aria-invalid': 'true',
              },
        ),
      );
    }
  });
  return decorations;
}

/** Calls `visit` on each block between `from` and `to` that holds text only; a block that takes a chip is skipped. */
function eachTextOnlyBlock(
  doc: ProseMirrorNode,
  from: number,
  to: number,
  visit: (block: ProseMirrorNode, pos: number) => void,
): void {
  const variable = doc.type.schema.nodes.variable;
  doc.nodesBetween(from, to, (node, pos) => {
    if (!node.isTextblock) return true;
    if (!variable || !takesVariable(node.type, variable)) visit(node, pos);
    return false;
  });
}

/** Where `tr` changed its document, as ranges of the document after it. */
function changedRanges(tr: Transaction): { from: number; to: number }[] {
  const ranges: { from: number; to: number }[] = [];
  tr.mapping.maps.forEach((map, index) => {
    const after = tr.mapping.slice(index + 1);
    map.forEach((_oldFrom, _oldTo, from, to) => ranges.push({ from: after.map(from, -1), to: after.map(to, 1) }));
  });
  return ranges;
}

/**
 * Draws the tokens of the text-only blocks: all of them when the host says the declarations changed, and on an
 * edit only the blocks the edit touched, the rest mapped across it.
 */
function tokenText(getDeclarations: () => readonly VariableDeclaration[], version: DeclarationsVersion): Plugin {
  const declared = () => new Set(getDeclarations().map((declaration) => declaration.name));
  const build = (doc: ProseMirrorNode) => {
    const names = declared();
    const decorations: Decoration[] = [];
    eachTextOnlyBlock(doc, 0, doc.content.size, (block, pos) => decorations.push(...blockTokens(block, pos, names)));
    return DecorationSet.create(doc, decorations);
  };
  const redrawTouched = (tr: Transaction, drawn: DecorationSet) => {
    const names = declared();
    let next = drawn.map(tr.mapping, tr.doc);
    const size = tr.doc.content.size;
    const seen = new Set<number>();
    for (const { from, to } of changedRanges(tr)) {
      eachTextOnlyBlock(tr.doc, Math.max(0, from - 1), Math.min(size, to + 1), (block, pos) => {
        if (seen.has(pos)) return;
        seen.add(pos);
        next = next.remove(next.find(pos, pos + block.nodeSize)).add(tr.doc, blockTokens(block, pos, names));
      });
    }
    return next;
  };
  return new Plugin<DecorationSet>({
    key: TOKEN_TEXT_KEY,
    state: {
      init: (_config, state) => build(state.doc),
      apply: (tr, drawn) => {
        if (tr.getMeta(TOKEN_TEXT_KEY)) return build(tr.doc);
        return tr.docChanged ? redrawTouched(tr, drawn) : drawn;
      },
    },
    props: { decorations: (state) => TOKEN_TEXT_KEY.getState(state) },
    view: (view) => ({
      destroy: version.subscribe(() => view.dispatch(view.state.tr.setMeta(TOKEN_TEXT_KEY, true))),
    }),
  });
}

/**
 * The engine half of the feature: the paste import, the typed-token rule and the tokens drawn in a text-only
 * block. Each live engine is in `engines`, so a command reaches the block its caret is in.
 */
function variableEngine(
  getDeclarations: () => readonly VariableDeclaration[],
  version: DeclarationsVersion,
  engines: Set<Editor>,
): Extension {
  return Extension.create({
    name: 'variableEngine',
    onCreate() {
      engines.add(this.editor);
    },
    onDestroy() {
      engines.delete(this.editor);
    },
    addInputRules() {
      return [
        new InputRule({
          find: COMPLETE_TOKEN,
          handler: ({ state, range, match }) => {
            const variable = state.schema.nodes.variable;
            // A text-only block keeps the token as text, as a paste into it does.
            if (variable && takesVariable(state.doc.resolve(range.from).parent.type, variable)) {
              state.tr.replaceWith(range.from, range.to, variable.create({ name: match[0].slice(2, -2) }));
            }
          },
        }),
      ];
    },
    addProseMirrorPlugins() {
      return [
        new Plugin({
          key: new PluginKey('variablePaste'),
          props: {
            transformPasted: (slice, view) => {
              const variable = view.state.schema.nodes.variable;
              if (!variable) return slice;
              const { $from, $to } = view.state.selection;
              const landing = {
                start: !$from.parent.isTextblock || takesVariable($from.parent.type, variable),
                end: !$to.parent.isTextblock || takesVariable($to.parent.type, variable),
              };
              const content = splitTokens(
                slice.content,
                variable,
                landing.start,
                slice.openStart,
                slice.openEnd,
                landing,
              );
              return new Slice(content, slice.openStart, slice.openEnd);
            },
          },
        }),
        tokenText(getDeclarations, version),
      ];
    },
  });
}

/**
 * The typed-variable feature: a `variable` chip, its `{{` trigger, the rule that turns a typed `{{name}}` into
 * a chip, and its paste import. A chip reads the declarations through `getDeclarations` when it renders; a
 * host that changes them runs `refreshVariables` so every chip reads them again.
 */
export function variableFeature(getDeclarations: () => readonly VariableDeclaration[]): VariableFeature {
  const version = declarationsVersion();
  const engines = new Set<Editor>();
  // A text-only block, such as html, is stored as its text, so a variable goes in as its `{{name}}` token.
  const holdsTextOnly = (editor: IEditor): boolean => {
    const engine = [...engines].find((candidate) => facadeFor(candidate as unknown as EngineHandle) === editor);
    const variable = engine?.state.schema.nodes.variable;
    if (!engine || !variable) return false;
    const { $from } = engine.state.selection;
    return $from.parent.isTextblock && !takesVariable($from.parent.type, variable);
  };

  function VariableChip({ name, contentEditable }: { name: string; contentEditable?: boolean }) {
    useSyncExternalStore(version.subscribe, version.read, version.read);
    const declaration = getDeclarations().find((candidate) => candidate.name === name);
    return (
      <Badge
        data-slot="variable"
        data-variable={name}
        data-variable-type={declaration?.type}
        data-problem={declaration ? undefined : 'variable-undeclared'}
        aria-invalid={declaration ? undefined : true}
        contentEditable={contentEditable}
        className="bg-primary/10 text-primary data-problem:border-destructive data-problem:text-destructive h-auto py-0 text-[length:inherit] data-problem:bg-transparent"
      >
        {declaration && variableIcon(declaration.type)}
        {declaration ? variableLabel(declaration) : name}
      </Badge>
    );
  }

  function VariableView({ attrs }: NodeViewProps<VariableAttrs>) {
    return <VariableChip name={attrs.name} contentEditable={false} />;
  }

  const codec: NodeCodec<VariableAttrs> = {
    node: 'variable',
    toMarkdown: (node) => `{{${node.attrs?.name ?? ''}}}`,
    toHTML: (node) => {
      const name = node.attrs?.name ?? '';
      return `<span data-variable="${escapeHtml(name)}">{{${escapeHtml(name)}}}</span>`;
    },
    toReact: (node) => <VariableChip name={node.attrs?.name ?? ''} />,
    fromHTML: (element) => {
      const name = element.getAttribute('data-variable');
      return name ? { type: 'variable', attrs: { name } } : null;
    },
    // A token in prose Markdown stays text; the paste import is what reads it.
    fromMarkdown: () => null,
  };

  const feature = defineFeature({
    id: 'variable',
    nodes: [
      {
        ...emailVariableSpec(),
        selectable: true,
        text: (attrs: VariableAttrs) => `{{${attrs.name}}}`,
        render: VariableView,
      },
    ],
    codecs: [codec as NodeCodec],
    commands: {
      insertVariable: {
        args: z.object({ name: z.string().regex(/^\w+$/) }),
        run: (editor, args) =>
          editor.run('insertContent', {
            content: holdsTextOnly(editor)
              ? { type: 'text', text: `{{${args.name}}}` }
              : { type: 'variable', attrs: { name: args.name } },
          }),
      },
      refreshVariables: {
        run: () => {
          version.bump();
          return true;
        },
      },
    },
    advanced: { engineExtensions: [variableEngine(getDeclarations, version, engines)] },
  });

  const option = (declaration: VariableDeclaration): TriggerOption => ({
    id: declaration.name,
    label: variableLabel(declaration),
    slug: declaration.name,
    icon: variableIcon(declaration.type),
  });

  const token = referenceToken<'variable', VariableRef>('variable', '{{', {
    nodeName: 'variable',
    // Templates write a token right after a word or a bracket: `Code:{{code}}`, `({{name}})`.
    boundary: 'any',
    source: () => getDeclarations().map(option),
    insert: (editor, chosen) => {
      insertVariable(editor, chosen.id);
    },
    readRef: (attrs) => ({ name: String(attrs.name ?? '') }),
    emptyText: DEFAULT_PROFILE_MESSAGES.noVariables,
  });

  return { feature, token, watchDeclarations: version.subscribe };
}
