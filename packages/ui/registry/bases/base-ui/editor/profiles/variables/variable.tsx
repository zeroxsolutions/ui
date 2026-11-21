import { useSyncExternalStore, type ReactNode } from 'react';
import { z } from 'zod';
import { LinkIcon, MailIcon, TimerIcon, TypeIcon } from 'lucide-react';
import { Badge } from '@/registry/bases/base-ui/ui/badge';
import {
  Extension,
  Fragment,
  InputRule,
  Plugin,
  PluginKey,
  Slice,
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

type VariableAttrs = { name: string };

/** What a committed variable reads back as. */
export interface VariableRef {
  name: string;
}

export interface VariableFeature {
  feature: EditorFeature;
  token: TriggerToken<'variable', VariableRef>;
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

/** The engine half of the feature: the paste import and the typed-token rule. */
function variableEngine(): Extension {
  return Extension.create({
    name: 'variableEngine',
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
        className="bg-primary/10 text-primary data-problem:bg-destructive/10 data-problem:text-destructive h-auto text-[length:inherit]"
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
          editor.run('insertContent', { content: { type: 'variable', attrs: { name: args.name } } }),
      },
      refreshVariables: {
        run: () => {
          version.bump();
          return true;
        },
      },
    },
    advanced: { engineExtensions: [variableEngine()] },
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
    emptyText: 'No variables found',
  });

  return { feature, token };
}
