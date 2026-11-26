import { useId, useState, type ReactNode } from 'react';
import { z } from 'zod';
import { BlocksIcon } from '@/registry/bases/base-ui/icons/lucide/blocks-icon';
import { ImageIcon } from '@/registry/bases/base-ui/icons/lucide/image-icon';
import { LinkIcon } from '@/registry/bases/base-ui/icons/lucide/link-icon';
import { SettingsIcon } from '@/registry/bases/base-ui/icons/lucide/settings-icon';
import { Button } from '@/registry/bases/base-ui/ui/button';
import { Input } from '@/registry/bases/base-ui/ui/input';
import { Label } from '@/registry/bases/base-ui/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from '@/registry/bases/base-ui/ui/popover';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/registry/bases/base-ui/ui/tooltip';
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
  BlockEditorField,
} from '@zeroxsolutions/editor-core/template/email/index';
import type { ReactNodeCodec } from '../../react-types';
import { DEFAULT_PROFILE_MESSAGES, type CustomBlockMessages, type ProfileEditorMessages } from '../messages';
import { EmailAddressPopover, emailImageVariable } from './email-address-popover';
import { EmailBlockItems, emailBlockItemsOf } from './email-block-items';
import { EmailInlineField } from './email-inline-field';
import { blockAt, cellAt, contextOf, laneAt, ownBlockMenus, selectBlockOf, type Found } from './kit-context';
import { blockClasses } from './nodes/block-style';
import { UploadStatus } from '../../document/uploads/upload-status';
import type { BlockPlace } from '../../document/uploads/use-block-upload';
import { useEmailImageUpload } from './email-uploads';

export interface EmailBlockFeatureOptions {
  /** The slash menu's icon for the block; a blocks icon when absent. */
  icon?: unknown;
  /** Draws the block in the editor in place of `view`, from the node view's own props. */
  nodeView?(props: NodeViewProps<Record<string, unknown>>): ReactNode;
  /**
   * Draws the block's content in the editor and outside it, inside the root that names it; the default draws the
   * fields as the email does, each written in place.
   */
  view?(props: EmailBlockViewProps): ReactNode;
  /** The words of the slash item, read once, when the feature is built; the kit's own in the editor's views. */
  messages?: () => ProfileEditorMessages;
  /** Whether a lane takes the block. Default true; a block drawn at the card's whole width sets false. */
  inLanes?: boolean;
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

/** The root every product block is drawn in, in the editor and out of it: named by its title, with no caption. */
function EmailBlock({ type, title, children }: { type: string; title: string; children: ReactNode }) {
  return (
    <div
      data-slot="email-block"
      data-type={type}
      role="group"
      aria-label={title}
      className={cn('cn-editor-block group/email-block relative flex flex-col gap-2', blockClasses({}))}
    >
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
    <div className="flex items-center justify-between gap-2">
      <Label htmlFor={id}>{label}</Label>
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

/** The words a block is drawn in: the host's for its type, the definition's labels under them. */
export type EmailBlockWords = ReturnType<typeof wordsOf>;

/** What a block's view draws from, in the editor and outside it, where `editor` is null. */
export interface EmailBlockViewProps {
  readonly block: BlockEditor;
  /** The node's attributes as stored: its fields' text, its items and its attributes. */
  readonly values: Readonly<Record<string, unknown>>;
  /** The body: the editable inline content in the editor, its text outside it; null for a block with none. */
  readonly body: ReactNode;
  /** Whether the block's fields change: false in a read-only editor, in locked structure and outside an editor. */
  readonly editable: boolean;
  /** False on a required block, and wherever `editable` is: no item is added or removed, no setting changes. */
  readonly restructure: boolean;
  /** The email editor the block is in; null where it is drawn outside one. */
  readonly editor: IEditor | null;
  /** Where the block is in the editor, which an upload into it is kept at; null outside one. */
  readonly place: BlockPlace | null;
  readonly words: EmailBlockWords;
  readonly messages: ProfileEditorMessages;
  /** Writes fields and attributes onto the block; does nothing outside an editor. */
  update(patch: Readonly<Record<string, unknown>>): void;
}

/** The text field `name` holds on `values`, `''` where it holds none. */
export function emailBlockText(values: Readonly<Record<string, unknown>>, name: string): string {
  const value = values[name];
  return typeof value === 'string' ? value : '';
}

/** An image the editor can draw: a literal web address; one that names a variable has nothing to draw yet. */
const DRAWN_IMAGE = /^https?:\/\//i;

/**
 * One image field of a product block, as the email draws it; in the editor, the control that opens its address
 * popover, and while a file uploads into it, the file drawn faint with its progress.
 */
function EmailBlockImage({
  field,
  value,
  editor,
  place,
  live,
  label,
  messages,
  update,
}: {
  field: BlockEditorField;
  value: string;
  editor: IEditor | null;
  place: BlockPlace | null;
  live: boolean;
  label: string;
  messages: ProfileEditorMessages;
  update: EmailBlockViewProps['update'];
}): ReactNode {
  const upload = useEmailImageUpload(editor, place, field.name, false, (_attrs, url) => ({
    [field.name]: url,
  }));
  const entry = upload?.upload.entry ?? null;
  const src = (entry?.preview ?? value).trim();
  const variable = emailImageVariable(editor, src);
  const drawn =
    DRAWN_IMAGE.test(src) || entry?.preview ? (
      <img
        src={src}
        alt=""
        data-dimmed={entry !== null || undefined}
        className="block max-w-full data-dimmed:opacity-50"
      />
    ) : (
      variable !== undefined && (
        <span className="cn-editor-block cn-field-description flex aspect-[3/1] w-full items-center justify-center gap-2 border border-dashed">
          <ImageIcon size={16} aria-hidden />
          {variable}
        </span>
      )
    );
  const status = upload && entry && (
    <UploadStatus
      entry={entry}
      messages={upload.messages}
      onCancel={upload.upload.cancel}
      onRetry={upload.upload.retry}
      readOnly={!live}
    />
  );
  if (!live || editor === null) {
    return (
      (drawn || status) && (
        <div contentEditable={false} className="not-prose flex flex-col gap-2">
          {drawn}
          {status}
        </div>
      )
    );
  }
  return (
    <div contentEditable={false} className="not-prose flex flex-col gap-2">
      <EmailAddressPopover
        editor={editor}
        kind="image"
        label={label}
        value={value}
        tooltip={label}
        onApply={(address) => update({ [field.name]: address })}
        onRemove={field.required ? undefined : () => update({ [field.name]: '' })}
        upload={upload}
        trigger={
          <button
            type="button"
            aria-label={label}
            className={cn(
              // An image that has not loaded still leaves a control to open its popover from.
              'cn-editor-block cn-editor-control cn-field-description bg-muted/40 block min-h-12 w-full outline-none',
              !drawn && 'hover:bg-muted/50 flex aspect-[3/1] items-center justify-center gap-2 border border-dashed',
            )}
          >
            {drawn || (
              <>
                <ImageIcon size={16} aria-hidden />
                {messages.imagePlaceholder}
              </>
            )}
          </button>
        }
      />
      {status}
    </div>
  );
}

/**
 * A product block as the email draws it: its images, its body and its plain fields written in place, its items in
 * a row, and its links and number settings behind small icons that open a popover.
 */
function EmailBlockDefaultView({
  block,
  values,
  body,
  editable,
  restructure,
  editor,
  place,
  words,
  messages,
  update,
}: EmailBlockViewProps): ReactNode {
  const numbers = block.attributes.filter((attribute) => attribute.kind === 'number');
  const images = block.fields.filter((field) => field.kind === 'imageUrl');
  const plain = block.fields.filter((field) => field.kind === 'plainText');
  const links = block.fields.filter((field) => field.kind === 'link');
  const live = editor !== null && editable;
  return (
    <>
      {images.map((field) => (
        <EmailBlockImage
          key={field.name}
          field={field}
          value={emailBlockText(values, field.name)}
          editor={editor}
          place={place}
          live={live}
          label={words.field(field.name, field.label)}
          messages={messages}
          update={update}
        />
      ))}
      {block.body !== null && (
        <div data-slot="email-block-body" className="min-h-6">
          {body}
        </div>
      )}
      {block.lanes !== null && <div data-slot="email-block-lanes">{body}</div>}
      {plain.length > 0 && (
        <div contentEditable={false} className="text-muted-foreground flex flex-col text-sm">
          {plain.map((field) => (
            <EmailInlineField
              key={field.name}
              editor={editor}
              label={words.field(field.name, field.label)}
              placeholder={words.field(field.name, field.label)}
              value={emailBlockText(values, field.name)}
              readOnly={!editable}
              onValueChange={(value) => update({ [field.name]: value })}
            />
          ))}
        </div>
      )}
      {block.items.map((items) => (
        <div key={items.name} contentEditable={false}>
          <EmailBlockItems
            editor={editor}
            place={place}
            items={items}
            entries={emailBlockItemsOf(items, values[items.name])}
            label={words.field(items.name, items.label)}
            fieldLabel={(field, fallback) => words.field(`${items.name}.${field}`, fallback)}
            readOnly={!editable}
            restructure={restructure}
            onValueChange={(entries) => update({ [items.name]: entries })}
          />
        </div>
      ))}
      {live && (links.length > 0 || numbers.length > 0) && (
        <div
          contentEditable={false}
          data-slot="email-block-controls"
          className="absolute top-1 right-1 flex gap-0.5"
          onFocus={(event) => selectBlockOf(editor, event.currentTarget)}
        >
          {links.map((field) => {
            const label = words.field(field.name, field.label);
            const value = emailBlockText(values, field.name);
            return (
              <EmailAddressPopover
                key={field.name}
                editor={editor}
                kind="link"
                label={label}
                value={value}
                tooltip={label}
                onApply={(address) => update({ [field.name]: address })}
                onRemove={field.required || value === '' ? undefined : () => update({ [field.name]: '' })}
                trigger={
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    aria-label={label}
                    className={cn(value === '' && 'text-muted-foreground')}
                  >
                    <LinkIcon size={14} aria-hidden />
                  </Button>
                }
              />
            );
          })}
          {numbers.length > 0 && (
            <Popover>
              <Tooltip>
                <TooltipTrigger
                  render={
                    <PopoverTrigger
                      render={
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-xs"
                          aria-label={messages.blockSettings}
                          className="text-muted-foreground"
                        />
                      }
                    />
                  }
                >
                  <SettingsIcon size={14} aria-hidden />
                </TooltipTrigger>
                <TooltipContent>{messages.blockSettings}</TooltipContent>
              </Tooltip>
              <PopoverContent align="end" className="w-64 gap-3" aria-label={messages.blockSettings}>
                <PopoverHeader>
                  <PopoverTitle>{words.title}</PopoverTitle>
                </PopoverHeader>
                {numbers.map(
                  (attribute) =>
                    attribute.kind === 'number' && (
                      <EmailBlockNumberField
                        key={attribute.name}
                        label={words.attribute(attribute)}
                        value={current(values, attribute) as number}
                        min={attribute.min}
                        max={attribute.max}
                        disabled={!restructure}
                        onValueChange={(value) => update({ [attribute.name]: value })}
                      />
                    ),
                )}
              </PopoverContent>
            </Popover>
          )}
        </div>
      )}
    </>
  );
}

/**
 * The feature of a product's block in the email editor: its node, with its body as the node's inline content and
 * its other fields drawn as the email draws them, each written in place or in a popover; its email codec; its slash
 * item; and block menu items, which `emailKit` draws among its own: a radio submenu per choice, a checkbox per
 * toggle.
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
    // A lane holds no block of lanes, as it holds no columns block, and no block drawn at the card's width.
    const lanes = block.lanes !== null || options.inLanes === false;
    return !lanes || laneAt(found.engine.state) === undefined;
  };
  const settable = (editor: IEditor, name: string, value: AttributeValue) => {
    const found = contextOf(editor);
    const at = blockOf(editor);
    const attribute = block.attributes.find((candidate) => candidate.name === name);
    if (!found || !at || !attribute || refusalOf(editor, at) !== null) return undefined;
    return attributeSchema(attribute).safeParse(value).success ? { engine: found.engine, at } : undefined;
  };

  const View = options.view ?? EmailBlockDefaultView;

  function EmailBlockView(props: NodeViewProps<Record<string, unknown>>) {
    const { attrs: values, updateAttrs, editable, editor, children } = props;
    if (options.nodeView) return options.nodeView(props);
    const context = contextOf(editor)?.context;
    const messages = context?.messages() ?? DEFAULT_PROFILE_MESSAGES;
    const shown = wordsOf(block, messages);
    const required = typeof values.id === 'string' && (context?.required().includes(values.id) ?? false);
    // Locked structure refuses every change to a block's own fields, which are its node's attributes; its body,
    // the node's text, still edits.
    const fields = editable && !(context?.locked() ?? false);
    return (
      <EmailBlock type={block.type} title={shown.title}>
        <View
          block={block}
          values={values}
          body={children as ReactNode}
          editable={fields}
          restructure={fields && !required}
          editor={editor}
          place={{ editor, getPos: props.getPos }}
          words={shown}
          messages={messages}
          update={updateAttrs}
        />
      </EmailBlock>
    );
  }

  const reactCodec: ReactNodeCodec = {
    node: block.node,
    toReact: (node, ctx) => {
      const children = ctx.renderChildren(node);
      const body =
        block.lanes === null ? (
          children
        ) : (
          <div data-node-view-content="">
            <div data-node-view-content-react="">{children}</div>
          </div>
        );
      return (
        <EmailBlock type={block.type} title={words.title}>
          <View
            block={block}
            values={(node.attrs ?? {}) as Record<string, unknown>}
            body={block.body === null && block.lanes === null ? null : body}
            editable={false}
            restructure={false}
            editor={null}
            place={null}
            words={words}
            messages={DEFAULT_PROFILE_MESSAGES}
            update={() => {}}
          />
        </EmailBlock>
      );
    },
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
