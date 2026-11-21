import type { ReactNode } from 'react';
import { z } from 'zod';
import { LinkIcon, MailIcon, TimerIcon, TypeIcon } from 'lucide-react';
import { Fragment, Slice, type Node as ProseNode, type NodeType } from '@tiptap/pm/model';
import { Badge } from '@/registry/bases/base-ui/ui/badge';
import { Plugin, PluginKey } from '@zeroxsolutions/editor-core/document/advanced';
import {
  defineFeature,
  type EditorFeature,
  type IEditor,
  type NodeCodec,
  type NodeSpec,
  type NodeViewProps,
} from '@zeroxsolutions/editor-core/document/core/index';
import { referenceToken, type TriggerOption, type TriggerToken } from '@zeroxsolutions/editor-core/composer/index';
import { emailNodeSpecs, type VariableDeclaration } from '@zeroxsolutions/editor-core/profiles/index';
import { VARIABLE_TOKEN, type VariableType } from '@zeroxsolutions/editor-core/template/index';

type VariableAttrs = { name: string };

/** What a committed variable reads back as. */
export interface VariableRef {
  name: string;
}

export interface VariableFeature {
  feature: EditorFeature;
  token: TriggerToken<'variable', VariableRef>;
}

/** The glyph a variable's type shows in a menu. */
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

/** Commit the variable `name` at the caret. */
export function insertVariable(editor: IEditor, name: string): boolean {
  return editor.run('insertVariable', { name });
}

const escapeHtml = (value: string): string =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// The email profile's own spec, so the node keeps the name and attribute its codecs read.
const variableSpec = emailNodeSpecs.nodes.find((node) => node.name === 'variable') as NodeSpec<VariableAttrs>;

/** Each `{{name}}` in the pasted text nodes becomes a variable, where the content allows one. */
function splitTokens(fragment: Fragment, variable: NodeType, allowed: boolean): Fragment {
  const nodes: ProseNode[] = [];
  fragment.forEach((node) => {
    if (!node.isText) {
      const inside = node.isTextblock ? node.type.contentMatch.matchType(variable) !== null : allowed;
      nodes.push(node.copy(splitTokens(node.content, variable, inside)));
      return;
    }
    const text = node.text ?? '';
    if (!allowed) {
      nodes.push(node);
      return;
    }
    let last = 0;
    for (const match of text.matchAll(VARIABLE_TOKEN)) {
      if (match.index > last) nodes.push(node.type.schema.text(text.slice(last, match.index), node.marks));
      nodes.push(variable.create({ name: match[1] }));
      last = match.index + match[0].length;
    }
    if (last === 0) nodes.push(node);
    else if (last < text.length) nodes.push(node.type.schema.text(text.slice(last), node.marks));
  });
  return Fragment.fromArray(nodes);
}

function pasteTokens(): Plugin {
  return new Plugin({
    key: new PluginKey('variablePaste'),
    props: {
      transformPasted: (slice, view) => {
        const variable = view.state.schema.nodes.variable;
        if (!variable) return slice;
        // An open slice's loose text lands in the block the caret is in.
        const allowed = view.state.selection.$from.parent.type.contentMatch.matchType(variable) !== null;
        return new Slice(splitTokens(slice.content, variable, allowed), slice.openStart, slice.openEnd);
      },
    },
  });
}

/**
 * The typed-variable feature: a `variable` chip, its `{{` trigger and its paste import. The chip reads the
 * declarations through `getDeclarations` each time it renders, so a host that changes them sees the label
 * and the undeclared mark follow.
 */
export function variableFeature(getDeclarations: () => readonly VariableDeclaration[]): VariableFeature {
  function VariableChip({ name, contentEditable }: { name: string; contentEditable?: boolean }) {
    const declaration = getDeclarations().find((candidate) => candidate.name === name);
    return (
      <Badge
        data-slot="variable"
        data-variable={name}
        data-variable-type={declaration?.type}
        data-problem={declaration ? undefined : 'variable-undeclared'}
        contentEditable={contentEditable}
        className="bg-primary/10 text-primary data-problem:bg-destructive/10 data-problem:text-destructive h-auto text-[length:inherit]"
      >
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
    nodes: [{ ...variableSpec, selectable: true, render: VariableView }],
    codecs: [codec as NodeCodec],
    commands: {
      insertVariable: {
        args: z.object({ name: z.string().regex(/^\w+$/) }),
        run: (editor, args) =>
          editor.run('insertContent', { content: { type: 'variable', attrs: { name: args.name } } }),
      },
    },
    advanced: { prosePlugins: [pasteTokens()] },
  });

  const option = (declaration: VariableDeclaration): TriggerOption => ({
    id: declaration.name,
    label: variableLabel(declaration),
    slug: declaration.name,
    icon: variableIcon(declaration.type),
  });

  const token = referenceToken<'variable', VariableRef>('variable', '{{', {
    nodeName: 'variable',
    source: () => getDeclarations().map(option),
    insert: (editor, chosen) => {
      insertVariable(editor, chosen.id);
    },
    readRef: (attrs) => ({ name: String(attrs.name ?? '') }),
    emptyText: 'No variables found',
  });

  return { feature, token };
}
