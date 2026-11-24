import { useId, useState, type ReactNode } from 'react';
import { z } from 'zod';
import { BlocksIcon } from '@/registry/bases/base-ui/icons/lucide/blocks-icon';
import { Button } from '@/registry/bases/base-ui/ui/button';
import { Input } from '@/registry/bases/base-ui/ui/input';
import { cn } from '@/registry/bases/base-ui/lib/utils';
import {
  defineFeature,
  type BlockMenuItem,
  type EditorFeature,
  type IEditor,
  type NodeCodec,
  type NodeJSON,
  type NodeViewProps,
} from '@zeroxsolutions/editor-core/document/core/index';
import { emailBlockCodec } from '@zeroxsolutions/editor-core/profiles/index';
import type {
  EmailBlockDefinition,
  BlockEditor,
  BlockEditorAttribute,
  BlockEditorItems,
} from '@zeroxsolutions/editor-core/template/email/index';
import type { ReactNodeCodec } from '../../react-types';
import { DEFAULT_PROFILE_MESSAGES, type CustomBlockMessages, type ProfileEditorMessages } from '../messages';
import type { VariableFeature } from '../variables/variable';
import { VariableTextField } from '../variables/variable-text-field';
import type { VariableDeclaration } from '@zeroxsolutions/editor-core/profiles/index';
import { blockAt, cellAt, contextOf, laneAt, ownBlockMenus, selectBlockOf, type Found } from './kit-context';
import { blockClasses } from './nodes/block-style';

export interface EmailBlockFeatureOptions {
  /** The slash menu's icon for the block; a blocks icon when absent. */
  icon?: unknown;
  /** Draws the block in the editor in place of the default frame; it gets the node's attributes and its body. */
  nodeView?(props: NodeViewProps<Record<string, unknown>>): ReactNode;
  /** The words of the slash item, read once, when the feature is built; the kit's own in the editor's views. */
  messages?: () => ProfileEditorMessages;
}

type AttributeValue = string | boolean | number;

/** The words the editor draws the block in: the host's for the type, the definition's labels under them. */
function wordsOf(editor: BlockEditor, messages: ProfileEditorMessages) {
  const own: CustomBlockMessages = messages.customBlocks?.[editor.type] ?? {};
  return {
    title: own.title ?? editor.label,
    description: own.description ?? editor.description,
    field: (name: string, label: string) => own.fields?.[name] ?? label,
    attribute: (attribute: BlockEditorAttribute) => own.attributes?.[attribute.name] ?? attribute.label,
    value: (attribute: string, value: string, label: string) => own.values?.[attribute]?.[value] ?? label,
  };
}

function attributeSchema(attribute: BlockEditorAttribute): z.ZodType<AttributeValue> {
  if (attribute.kind === 'choice') return z.enum(attribute.values.map(({ value }) => value) as [string, ...string[]]);
  if (attribute.kind === 'toggle') return z.boolean();
  return z.number().min(attribute.min).max(attribute.max);
}

/** What `value` reads as on `attrs`: the attribute's default while the block does not set it. */
function current(attrs: Record<string, unknown>, attribute: BlockEditorAttribute): AttributeValue {
  const value = attrs[attribute.name];
  return value === null || value === undefined ? attribute.default : (value as AttributeValue);
}

/** Why a change to the block the views and commands act on is refused, or null; null outside an email kit too. */
function refusalOf(editor: IEditor, block: Found): string | null {
  const context = contextOf(editor)?.context;
  if (!context) return null;
  const words = context.messages();
  if (context.locked()) return words.deleteLocked;
  const id = block.node.attrs.id;
  return typeof id === 'string' && context.required().includes(id) ? words.deleteRequired : null;
}

/** The frame the block is drawn in, before the editor mounts and in it: its name over its body and its fields. */
function EmailBlockFrame({ type, title, children }: { type: string; title: string; children: ReactNode }) {
  return (
    <div
      data-slot="email-block"
      data-type={type}
      className={cn('cn-editor-block flex flex-col gap-2 border p-3', blockClasses({}))}
    >
      <span contentEditable={false} className="text-muted-foreground text-xs font-medium select-none">
        {title}
      </span>
      {children}
    </div>
  );
}

function EmailBlockNumberField({
  label,
  value,
  min,
  max,
  disabled,
  onValueChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  disabled: boolean;
  onValueChange(value: number): void;
}) {
  const id = useId();
  // What the author is typing, which may pass through a value out of range, as `1` on the way to `15`; the block
  // takes it once it is in range, and the field shows the block's value again when it loses the focus.
  const [draft, setDraft] = useState<string | null>(null);
  return (
    <div className="flex items-center gap-2">
      <label htmlFor={id} className="text-muted-foreground text-xs">
        {label}
      </label>
      <Input
        id={id}
        type="number"
        className="w-20"
        value={draft ?? value}
        min={min}
        max={max}
        disabled={disabled}
        onChange={(event) => {
          setDraft(event.currentTarget.value);
          const next = event.currentTarget.valueAsNumber;
          if (Number.isFinite(next) && next >= min && next <= max && next !== value) onValueChange(next);
        }}
        onBlur={() => setDraft(null)}
      />
    </div>
  );
}

type Item = Readonly<Record<string, string>>;

/** `value` as `items`' items: each stored entry an object of the item's fields, `''` where it holds none. */
function itemsOf(items: BlockEditorItems, value: unknown): Item[] {
  if (!Array.isArray(value)) return [];
  return value.map((entry: unknown) => {
    const stored = typeof entry === 'object' && entry !== null ? (entry as Record<string, unknown>) : {};
    return Object.fromEntries(
      items.fields.map(({ name }) => [name, typeof stored[name] === 'string' ? (stored[name] as string) : '']),
    );
  });
}

/**
 * An items field: a row per item, its fields in variable text fields, with Remove beside it and Add under the
 * rows. `restructure` is false in locked structure and on a required block, where the rows' text still edits.
 */
function EmailBlockItemsField({
  items,
  entries,
  label,
  fieldLabel,
  readOnly,
  restructure,
  declarations,
  variables,
  messages,
  onValueChange,
}: {
  items: BlockEditorItems;
  entries: readonly Item[];
  label: string;
  fieldLabel(field: string, fallback: string): string;
  readOnly: boolean;
  restructure: boolean;
  declarations(): readonly VariableDeclaration[];
  variables: VariableFeature | undefined;
  messages: ProfileEditorMessages;
  onValueChange(entries: Item[]): void;
}): ReactNode {
  const empty = (): Item => Object.fromEntries(items.fields.map(({ name }) => [name, '']));
  return (
    <fieldset data-slot="email-block-items" data-name={items.name} className="flex flex-col gap-2">
      <legend className="text-muted-foreground mb-1 text-xs">{label}</legend>
      {entries.map((entry, index) => (
        <div
          // An item has no identity of its own; its place is what the author sees and edits.
          key={index}
          role="group"
          aria-label={messages.itemRow(label, index + 1)}
          data-slot="email-block-item"
          className="flex items-start gap-2"
        >
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            {items.fields.map((field) => (
              <VariableTextField
                key={field.name}
                value={entry[field.name] ?? ''}
                onValueChange={(value) =>
                  onValueChange(entries.map((item, at) => (at === index ? { ...item, [field.name]: value } : item)))
                }
                declarations={declarations}
                variables={variables}
                label={fieldLabel(field.name, field.label)}
                placeholder={fieldLabel(field.name, field.label)}
                readOnly={readOnly}
                messages={messages}
                className={cn('border-b', field.kind !== 'plainText' && 'font-mono text-sm')}
              />
            ))}
          </div>
          {!readOnly && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={!restructure || entries.length <= items.min}
              onClick={() => onValueChange(entries.filter((_item, at) => at !== index))}
            >
              {messages.removeItem}
            </Button>
          )}
        </div>
      ))}
      {!readOnly && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="self-start"
          disabled={!restructure || entries.length >= items.max}
          onClick={() => onValueChange([...entries, empty()])}
        >
          {messages.addItem}
        </Button>
      )}
    </fieldset>
  );
}

/**
 * The feature of a product's block in the email editor: its node, with its body as the node's inline content
 * and its other fields and its number attributes in fields under it; its email codec; its slash item; and
 * block menu items, which `emailKit` draws among its own: a radio submenu per choice, a checkbox per toggle.
 * Hand it to `emailKit`'s `extra`, or the definition to `EmailEditor`'s `blocks`, which builds this.
 */
export function emailBlockFeature(
  definition: Pick<EmailBlockDefinition, 'editor'>,
  options: EmailBlockFeatureOptions = {},
): EditorFeature {
  const { editor: block } = definition;
  const words = wordsOf(block, options.messages?.() ?? DEFAULT_PROFILE_MESSAGES);
  const insertCommand = `insertEmailBlock:${block.type}`;
  const setCommand = `setEmailBlockAttribute:${block.type}`;

  const attrs = z.object({
    ...Object.fromEntries(block.fields.map(({ name }) => [name, z.string().optional()])),
    ...Object.fromEntries(block.items.map(({ name }) => [name, z.array(z.record(z.string(), z.string())).optional()])),
    ...Object.fromEntries(block.attributes.map((attribute) => [attribute.name, attributeSchema(attribute).optional()])),
    ...(block.body === null ? {} : { source: z.string().optional() }),
  });

  const blockOf = (editor: IEditor): Found | undefined => {
    const found = contextOf(editor);
    const at = found && blockAt(found.engine.state);
    return at?.node.type.name === block.node ? at : undefined;
  };
  const insertable = (editor: IEditor): boolean => {
    const found = contextOf(editor);
    if (!found || found.context.locked() || !found.context.admitted.has(block.node)) return false;
    if (cellAt(found.engine.state) !== undefined) return false;
    // A lane holds no block of lanes, as it holds no columns block.
    return block.lanes === null || laneAt(found.engine.state) === undefined;
  };
  const settable = (editor: IEditor, name: string, value: AttributeValue) => {
    const found = contextOf(editor);
    const at = blockOf(editor);
    const attribute = block.attributes.find((candidate) => candidate.name === name);
    if (!found || !at || !attribute || refusalOf(editor, at) !== null) return undefined;
    return attributeSchema(attribute).safeParse(value).success ? { engine: found.engine, at } : undefined;
  };

  function EmailBlockView(props: NodeViewProps<Record<string, unknown>>) {
    const { attrs: values, updateAttrs, editable, editor, children } = props;
    if (options.nodeView) return options.nodeView(props);
    const context = contextOf(editor)?.context;
    const messages = context?.messages() ?? DEFAULT_PROFILE_MESSAGES;
    const shown = wordsOf(block, messages);
    const required = typeof values.id === 'string' && (context?.required().includes(values.id) ?? false);
    const restyle = editable && !(context?.locked() ?? false) && !required;
    const numbers = block.attributes.filter((attribute) => attribute.kind === 'number');
    return (
      <EmailBlockFrame type={block.type} title={shown.title}>
        {block.body !== null && (
          <div data-slot="email-block-body" className="min-h-6">
            {children as ReactNode}
          </div>
        )}
        {block.lanes !== null && <div data-slot="email-block-lanes">{children as ReactNode}</div>}
        {(block.fields.length > 0 || block.items.length > 0 || numbers.length > 0) && (
          <div
            contentEditable={false}
            // A field takes the focus without moving the selection; Mod-/ acts on the selected block.
            onFocus={(event) => selectBlockOf(editor, event.currentTarget)}
            className="flex flex-col gap-2"
          >
            {block.fields.map((field) => (
              <VariableTextField
                key={field.name}
                value={typeof values[field.name] === 'string' ? (values[field.name] as string) : ''}
                onValueChange={(value) => updateAttrs({ [field.name]: value })}
                declarations={() => context?.declarations() ?? []}
                variables={context?.variables}
                label={shown.field(field.name, field.label)}
                placeholder={shown.field(field.name, field.label)}
                readOnly={!editable}
                messages={messages}
                className={cn('border-b', field.kind !== 'plainText' && 'font-mono text-sm')}
              />
            ))}
            {block.items.map((items) => (
              <EmailBlockItemsField
                key={items.name}
                items={items}
                entries={itemsOf(items, values[items.name])}
                label={shown.field(items.name, items.label)}
                fieldLabel={(field, fallback) => shown.field(`${items.name}.${field}`, fallback)}
                readOnly={!editable}
                restructure={restyle}
                declarations={() => context?.declarations() ?? []}
                variables={context?.variables}
                messages={messages}
                onValueChange={(entries) => updateAttrs({ [items.name]: entries })}
              />
            ))}
            {numbers.map(
              (attribute) =>
                attribute.kind === 'number' && (
                  <EmailBlockNumberField
                    key={attribute.name}
                    label={shown.attribute(attribute)}
                    value={current(values, attribute) as number}
                    min={attribute.min}
                    max={attribute.max}
                    disabled={!restyle}
                    onValueChange={(value) => updateAttrs({ [attribute.name]: value })}
                  />
                ),
            )}
          </div>
        )}
      </EmailBlockFrame>
    );
  }

  const reactCodec: ReactNodeCodec = {
    node: block.node,
    toReact: (node, ctx) => (
      <EmailBlockFrame type={block.type} title={words.title}>
        {block.body !== null && <div data-slot="email-block-body">{ctx.renderChildren(node)}</div>}
        {block.lanes !== null && (
          <div data-slot="email-block-lanes">
            <div data-node-view-content="">
              <div data-node-view-content-react="">{ctx.renderChildren(node)}</div>
            </div>
          </div>
        )}
        {block.fields.map((field) => (
          <span key={field.name} className="border-b">
            {String(node.attrs?.[field.name] ?? '')}
          </span>
        ))}
        {block.items.flatMap((items) =>
          itemsOf(items, node.attrs?.[items.name]).map((entry, index) => (
            <span key={`${items.name}-${index}`} data-slot="email-block-item" className="flex flex-col border-b">
              {items.fields.map((field) => (
                <span key={field.name}>{entry[field.name]}</span>
              ))}
            </span>
          )),
        )}
      </EmailBlockFrame>
    ),
  };

  const feature = defineFeature({
    id: `emailBlock:${block.type}`,
    nodes: [
      {
        name: block.node,
        group: 'block',
        draggable: true,
        selectable: true,
        attrs,
        ...(block.body !== null
          ? { content: 'inline*' }
          : block.lanes !== null
            ? { content: `column{${block.lanes.min},${block.lanes.max}}` }
            : { atom: true }),
        render: EmailBlockView,
      },
    ],
    codecs: [{ ...emailBlockCodec(block), toReact: reactCodec.toReact } as NodeCodec],
    commands: {
      [insertCommand]: {
        run: (editor) => {
          if (!insertable(editor)) return false;
          const lane = (): NodeJSON => ({ type: 'column', content: [{ type: 'paragraph' }] });
          const content =
            block.lanes === null ? {} : { content: Array.from({ length: block.lanes.min }, () => lane()) };
          return editor.run('insertContent', { content: { type: block.node, ...content } });
        },
        can: (editor) => insertable(editor),
      },
      [setCommand]: {
        args: z.object({ name: z.string(), value: z.union([z.string(), z.boolean(), z.number()]) }),
        run: (editor, { name, value }: { name: string; value: AttributeValue }) => {
          const target = settable(editor, name, value);
          if (!target) return false;
          const before = target.engine.state.doc;
          target.engine.view.dispatch(target.engine.state.tr.setNodeAttribute(target.at.pos, name, value));
          return target.engine.state.doc !== before;
        },
        can: (editor, { name, value }: { name: string; value: AttributeValue }) =>
          settable(editor, name, value) !== undefined,
      },
    },
    slash: [
      {
        id: `email-block-${block.type}`,
        title: words.title,
        description: words.description,
        icon: options.icon ?? BlocksIcon,
        group: (options.messages?.() ?? DEFAULT_PROFILE_MESSAGES).blockGroup,
        keywords: [block.type, ...block.keywords],
        command: insertCommand,
      },
    ],
  });

  ownBlockMenus.set(feature, (editor, at, own): BlockMenuItem[] => {
    if (at.node.type.name !== block.node) return [];
    const shown = wordsOf(block, contextOf(editor)?.context.messages() ?? DEFAULT_PROFILE_MESSAGES);
    const values = at.node.attrs as Record<string, unknown>;
    return block.attributes.flatMap((attribute): BlockMenuItem[] => {
      const id = `email-${block.type}-${attribute.name}`;
      if (attribute.kind === 'choice') {
        return attribute.values.map(({ value, label }) => ({
          id: `${id}-${value}`,
          title: shown.value(attribute.name, value, label),
          group: shown.attribute(attribute),
          command: setCommand,
          args: { name: attribute.name, value },
          active: () => current(values, attribute) === value,
          disabledReason: own,
        }));
      }
      if (attribute.kind === 'toggle') {
        const on = current(values, attribute) === true;
        return [
          {
            id,
            title: shown.attribute(attribute),
            checkbox: true,
            command: setCommand,
            args: { name: attribute.name, value: !on },
            active: () => on,
            disabledReason: own,
          },
        ];
      }
      // A number is set in the block's own field, which a menu has no place for.
      return [];
    });
  });
  return feature;
}
