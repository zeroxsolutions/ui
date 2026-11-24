import { useEffect, useReducer, type ReactNode } from 'react';
import { z } from 'zod';
import { BlocksIcon } from '@/registry/bases/base-ui/icons/lucide/blocks-icon';
import type { Block } from '@zeroxsolutions/editor-core/blocks/index';
import {
  defineFeature,
  type BlockMenuItem,
  type EditorFeature,
  type IEditor,
  type NodeCodec,
  type NodeJSON,
  type NodeViewProps,
} from '@zeroxsolutions/editor-core/document/core/index';
import type {
  BlockEditor,
  BlockEditorAttribute,
  EmailBlockAttribute,
  EmailBlockAttributes,
  EmailBlockContent,
  EmailBlockField,
  RichTextField,
} from '@zeroxsolutions/editor-core/template/email/index';
import type { ReactNodeCodec, ReactSerializeContext } from '../../react-types';

type FieldMap = Readonly<Record<string, EmailBlockField>>;
type AttributeMap = Readonly<Record<string, EmailBlockAttribute>>;

/** A block's fields as a view reads them: each text field's text, `''` where unset, and each items field's items. */
export type BlockViewFields<F extends FieldMap> = {
  readonly [K in keyof EmailBlockContent<F> as F[K] extends RichTextField ? never : K]: EmailBlockContent<F>[K];
};

/** What a block's view draws from, in the editor and in the Viewer alike. */
export interface BlockViewProps<F extends FieldMap, A extends AttributeMap> {
  readonly fields: BlockViewFields<F>;
  /** Each attribute's value, its default where the block does not set it. */
  readonly attributes: EmailBlockAttributes<A>;
  /** The body: the editable inline content in the editor, its text in the Viewer; null for a block with none. */
  readonly body: ReactNode;
  /** False in the Viewer and in a read-only editor. */
  readonly editable: boolean;
  readonly selected: boolean;
  /** Writes fields and attributes onto the block; does nothing in the Viewer. */
  update(patch: Readonly<Record<string, unknown>>): void;
  /** The whole document, for a block that draws from it (`readsDocument`); null otherwise. */
  readonly doc: NodeJSON | null;
}

/** The view props of block `B`, as `defineBlock` returned it. */
export type BlockViewPropsOf<B> = B extends Block<string, infer F, infer A> ? BlockViewProps<F, A> : never;

export interface BlockFeatureOptions<F extends FieldMap, A extends AttributeMap> {
  /** Draws the block, the same in the editor and the Viewer. */
  view(props: BlockViewProps<F, A>): ReactNode;
  /** The slash menu's icon; the definition's, then a blocks icon, when absent. */
  icon?: unknown;
  /** Attributes and fields a block inserted from the slash menu starts with. */
  insert?: Readonly<Record<string, unknown>>;
  /** The view reads `doc`, drawn again on every change of the document. */
  readsDocument?: boolean;
}

type AttributeValue = string | boolean | number;

function currentOf(attrs: Readonly<Record<string, unknown>>, attribute: BlockEditorAttribute): AttributeValue {
  const value = attrs[attribute.name];
  return value === null || value === undefined ? attribute.default : (value as AttributeValue);
}

/** The fields and attributes a view reads off `attrs`, whatever they hold. */
function viewValues(block: BlockEditor, attrs: Readonly<Record<string, unknown>>) {
  const text = (value: unknown): string => (typeof value === 'string' ? value : '');
  const fields = {
    ...Object.fromEntries(block.fields.map(({ name }) => [name, text(attrs[name])])),
    ...Object.fromEntries(
      block.items.map((items) => [
        items.name,
        (Array.isArray(attrs[items.name]) ? (attrs[items.name] as unknown[]) : []).map((entry) => {
          const stored = typeof entry === 'object' && entry !== null ? (entry as Record<string, unknown>) : {};
          return Object.fromEntries(items.fields.map(({ name }) => [name, text(stored[name])]));
        }),
      ]),
    ),
  };
  const attributes = Object.fromEntries(
    block.attributes.map((attribute) => [attribute.name, currentOf(attrs, attribute)]),
  );
  return { fields, attributes };
}

/** Draws the calling view again on each change of `editor`'s document, while `active`. */
function useDocumentChanges(editor: IEditor, active: boolean): void {
  const [, redraw] = useReducer((count: number) => count + 1, 0);
  useEffect(() => (active ? editor.onChange(() => redraw()) : undefined), [editor, active]);
}

/** Whether `attribute` of the selected `node` reads as `value`, its default counting where nothing else is set. */
function holds(editor: IEditor, node: string, attribute: BlockEditorAttribute, value: AttributeValue): boolean {
  if (editor.isActive(node, { [attribute.name]: value })) return true;
  if (value !== attribute.default) return false;
  const others: AttributeValue[] =
    attribute.kind === 'choice'
      ? attribute.values.map((entry) => entry.value).filter((entry) => entry !== value)
      : attribute.kind === 'toggle'
        ? [!value]
        : [];
  return others.every((other) => !editor.isActive(node, { [attribute.name]: other }));
}

/** The block menu items of `block`'s attributes: a radio submenu per choice, a checkbox per toggle. */
function attributeMenu(block: BlockEditor, editor: IEditor): BlockMenuItem[] {
  if (!editor.isActive(block.node)) return [];
  return block.attributes.flatMap((attribute): BlockMenuItem[] => {
    const id = `block-${block.type}-${attribute.name}`;
    if (attribute.kind === 'choice') {
      return attribute.values.map(({ value, label }) => ({
        id: `${id}-${value}`,
        title: label,
        group: attribute.label,
        command: 'updateAttributes',
        args: { name: block.node, attrs: { [attribute.name]: value } },
        active: (current) => holds(current, block.node, attribute, value),
      }));
    }
    if (attribute.kind === 'toggle') {
      const on = holds(editor, block.node, attribute, true);
      return [
        {
          id,
          title: attribute.label,
          checkbox: true,
          command: 'updateAttributes',
          args: { name: block.node, attrs: { [attribute.name]: !on } },
          active: () => on,
        },
      ];
    }
    // A number has no place in a menu; a view that offers it sets it.
    return [];
  });
}

/**
 * The Document Editor feature of a block `defineBlock` declared with a document side: its node drawn by `view`
 * in the editor, its HTML and Markdown codec with a Viewer render drawing the same `view`, a slash item that
 * inserts it, and block menu items for its attributes: a radio submenu per choice, a checkbox per toggle.
 *
 * @throws {Error} for a definition with no document side
 */
export function blockFeature<Type extends string, F extends FieldMap, A extends AttributeMap>(
  definition: Block<Type, F, A>,
  options: BlockFeatureOptions<F, A>,
): EditorFeature {
  const { document: side, editor: block } = definition;
  if (side === null) throw new Error(`The block "${definition.type}" has no document side.`);
  const View = options.view as (props: BlockViewProps<FieldMap, AttributeMap>) => ReactNode;
  const readsDocument = options.readsDocument ?? false;
  const insertCommand = `insertBlock:${block.type}`;
  const attrs = side.node.attrs as z.ZodObject<Record<string, z.ZodType>>;

  function BlockNodeView({ attrs: values, updateAttrs, editable, selected, editor, children }: NodeViewProps) {
    useDocumentChanges(editor, readsDocument);
    return (
      <View
        {...viewValues(block, values)}
        body={block.body === null ? null : (children as ReactNode)}
        editable={editable}
        selected={selected}
        update={(patch) => updateAttrs(patch)}
        doc={readsDocument ? editor.getJSON() : null}
      />
    );
  }

  const reactCodec: ReactNodeCodec = {
    node: block.node,
    toReact: (node: NodeJSON, ctx: ReactSerializeContext) => (
      <View
        {...viewValues(block, node.attrs ?? {})}
        body={block.body === null ? null : ctx.renderChildren(node)}
        editable={false}
        selected={false}
        update={() => {}}
        doc={readsDocument ? ctx.doc : null}
      />
    ),
  };

  /** What `values` holds that the node takes, each read through its schema; the rest is dropped. */
  const accepted = (values: Readonly<Record<string, unknown>>): Record<string, unknown> =>
    Object.fromEntries(
      Object.entries(values).flatMap(([name, value]) => {
        const schema = attrs.shape[name];
        const parsed = schema?.safeParse(value);
        return parsed?.success && parsed.data !== undefined ? [[name, parsed.data]] : [];
      }),
    );

  return defineFeature({
    id: `block:${block.type}`,
    nodes: [{ ...side.node, render: BlockNodeView }],
    codecs: [{ ...side.codec, toReact: reactCodec.toReact } as NodeCodec],
    commands: {
      [insertCommand]: {
        args: z.object({ attributes: z.record(z.string(), z.unknown()).optional() }).optional(),
        run: (editor, args?: { attributes?: Record<string, unknown> }) =>
          editor.run('insertContent', {
            content: { type: block.node, attrs: accepted({ ...options.insert, ...args?.attributes }) },
          }),
      },
    },
    slash: [
      {
        id: `block-${block.type}`,
        title: block.label,
        ...(block.description === '' ? {} : { description: block.description }),
        icon: options.icon ?? definition.icon ?? BlocksIcon,
        group: 'Blocks',
        keywords: [block.type, ...block.keywords],
        command: insertCommand,
      },
    ],
    blockMenu: [
      {
        id: `block-${block.type}-attributes`,
        title: block.label,
        command: 'updateAttributes',
        items: (editor) => attributeMenu(block, editor),
      },
    ],
  });
}
