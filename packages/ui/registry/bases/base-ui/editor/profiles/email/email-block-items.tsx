'use client';

import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { ImageIcon } from '@/registry/bases/base-ui/icons/lucide/image-icon';
import { PlusIcon } from '@/registry/bases/base-ui/icons/lucide/plus-icon';
import { TrashIcon } from '@/registry/bases/base-ui/icons/lucide/trash-icon';
import { Button } from '@/registry/bases/base-ui/ui/button';
import { Field, FieldError, FieldLabel } from '@/registry/bases/base-ui/ui/field';
import {
  Popover,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from '@/registry/bases/base-ui/ui/popover';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/registry/bases/base-ui/ui/tooltip';
import { cn } from '@/registry/bases/base-ui/lib/utils';
import type { IEditor } from '@zeroxsolutions/editor-core/document/core/index';
import type { BlockEditorField, BlockEditorItems } from '@zeroxsolutions/editor-core/template/email/index';
import { DEFAULT_PROFILE_MESSAGES } from '../messages';
import { VariableTextField } from '../variables/variable-text-field';
import { UploadStatus } from '../../document/uploads/upload-status';
import { UploadTabs } from '../../document/uploads/upload-tabs';
import { useUploadEntry, type BlockPlace } from '../../document/uploads/use-block-upload';
import { emailAddressProblems } from './email-address-popover';
import { useEmailImageUpload } from './email-uploads';
import { contextOf, selectBlockOf } from './kit-context';

/** One item of an items field: each of its fields' text, `''` where it holds none. */
export type EmailBlockItem = Readonly<Record<string, string>>;

/** `value` as `items`' items: each stored entry an object of the item's fields, `''` where it holds none. */
export function emailBlockItemsOf(items: BlockEditorItems, value: unknown): EmailBlockItem[] {
  if (!Array.isArray(value)) return [];
  return value.map((entry: unknown) => {
    const stored = typeof entry === 'object' && entry !== null ? (entry as Record<string, unknown>) : {};
    return Object.fromEntries(
      items.fields.map(({ name }) => [name, typeof stored[name] === 'string' ? (stored[name] as string) : '']),
    );
  });
}

/** An image address the editor can draw: a literal web address; one that names a variable has nothing to draw yet. */
const DRAWN_IMAGE = /^https?:\/\//i;

export interface EmailBlockItemsProps {
  /** The email editor the block is in; null where the block is drawn outside one. */
  editor: IEditor | null;
  /** Where the block is in the editor, which an upload into an item's image is kept at; null outside one. */
  place?: BlockPlace | null;
  items: BlockEditorItems;
  entries: readonly EmailBlockItem[];
  /** The items field's name, as the block's words give it. */
  label: string;
  fieldLabel(field: string, fallback: string): string;
  readOnly: boolean;
  /** False in locked structure and on a required block: the items' text still edits, none is added or removed. */
  restructure: boolean;
  /** Each item's image loads over `https:` only, as a library block's does. */
  secure?: boolean;
  /** The side of an item drawn as its image, in px. */
  size?: number;
  align?: 'left' | 'center' | 'right';
  onValueChange(entries: EmailBlockItem[]): void;
}

/** One field of an item in its popover; an address is written once the email can send it, or once it is empty. */
function EmailBlockItemField({
  editor,
  place,
  items,
  index,
  field,
  label,
  value,
  secure,
  autoFocus,
  onValueChange,
}: {
  editor: IEditor;
  place: BlockPlace | null;
  items: BlockEditorItems;
  /** The item's place in the field, which an upload into its image lands at. */
  index: number;
  field: BlockEditorField;
  label: string;
  value: string;
  secure: boolean;
  autoFocus: boolean;
  onValueChange(value: string): void;
}): ReactNode {
  const upload = useEmailImageUpload(
    field.kind === 'imageUrl' ? editor : null,
    place,
    itemSlot(items, index, field.name),
    secure,
    (attrs, url, _file, slot) => ({
      [items.name]: emailBlockItemsOf(items, attrs[items.name]).map((item, place) =>
        place === itemIndexOf(slot) ? { ...item, [field.name]: url } : item,
      ),
    }),
    (before, after, slot) => followItem(items, field.name, before, after, slot),
  );
  const entry = upload?.upload.entry ?? null;
  const id = useId();
  const problemId = useId();
  const context = contextOf(editor)?.context;
  const messages = context?.messages() ?? DEFAULT_PROFILE_MESSAGES;
  const declarations = () => context?.declarations() ?? [];
  const [draft, setDraft] = useState(value);
  const address = field.kind !== 'plainText';
  const problems =
    address && draft.trim() !== ''
      ? emailAddressProblems(draft, field.kind === 'link' ? 'link' : 'image', secure, declarations(), messages)
      : [];
  return (
    <Field data-invalid={problems.length > 0 || undefined}>
      <FieldLabel id={id}>{label}</FieldLabel>
      <UploadTabs
        upload={upload?.upload ?? null}
        messages={upload?.messages ?? messages.uploads}
        defaultTab={value === '' ? 'upload' : 'link'}
      >
        <VariableTextField
          value={address ? draft : value}
          onValueChange={(next) => {
            if (!address) return onValueChange(next);
            setDraft(next);
            const kind = field.kind === 'link' ? 'link' : 'image';
            if (next.trim() === '' || emailAddressProblems(next, kind, secure, declarations(), messages).length === 0) {
              // The author's address wins over a file still uploading into it.
              upload?.upload.cancel();
              onValueChange(next.trim());
            }
          }}
          declarations={declarations}
          variables={context?.variables}
          label={label}
          placeholder={
            field.kind === 'imageUrl'
              ? messages.imageAddressPlaceholder
              : field.kind === 'link'
                ? messages.linkPlaceholder
                : ''
          }
          invalid={problems.length > 0}
          describedBy={problems.length > 0 ? problemId : undefined}
          autoFocus={autoFocus}
          messages={messages}
          className="cn-input h-auto min-h-8"
        />
        {problems.length > 0 && <FieldError id={problemId} errors={problems.map((message) => ({ message }))} />}
      </UploadTabs>
      {upload && entry && (
        <UploadStatus
          entry={entry}
          messages={upload.messages}
          onCancel={upload.upload.cancel}
          onRetry={upload.upload.retry}
        />
      )}
    </Field>
  );
}

/** The upload slot of `field` of the item at `index` of `items`. */
function itemSlot(items: BlockEditorItems, index: number, field: string): string {
  return `${items.name}.${index}.${field}`;
}

/** The place of the item an upload slot names. */
function itemIndexOf(slot: string): number {
  return Number(slot.split('.')[1]);
}

/**
 * Where the item an upload fills is once the items change: in place while their count stays, as an edit keeps
 * it; else the item that holds what it held besides the uploading field, the nearest where several do; null
 * where none does, as when it was removed or an undo took it away.
 */
function followItem(
  items: BlockEditorItems,
  field: string,
  before: Readonly<Record<string, unknown>>,
  after: Readonly<Record<string, unknown>>,
  slot: string,
): string | null {
  if (before[items.name] === after[items.name]) return slot;
  const index = itemIndexOf(slot);
  const old = emailBlockItemsOf(items, before[items.name]);
  const now = emailBlockItemsOf(items, after[items.name]);
  const item = old[index];
  if (!item) return null;
  if (now.length === old.length) return now[index] ? slot : null;
  const matches = now.flatMap((other, at) =>
    items.fields.every(({ name }) => name === field || other[name] === item[name]) ? [at] : [],
  );
  if (matches.length === 0) return null;
  const nearest = matches.reduce((best, at) => (Math.abs(at - index) < Math.abs(best - index) ? at : best));
  return itemSlot(items, nearest, field);
}

/** An item's face: its image, the file uploading into it drawn faint, or its text. */
function EmailBlockItemFace({
  place,
  items,
  index,
  entry,
  size,
}: {
  place: BlockPlace | null;
  items: BlockEditorItems;
  index: number;
  entry: EmailBlockItem;
  size: number;
}): ReactNode {
  const image = items.fields.find((field) => field.kind === 'imageUrl');
  const text = items.fields.find((field) => field.kind === 'plainText');
  const uploading = useUploadEntry(image ? place : null, image ? itemSlot(items, index, image.name) : '');
  const src = uploading?.preview ?? (image ? entry[image.name]?.trim() : '');
  if (image && src && (uploading?.preview || DRAWN_IMAGE.test(src))) {
    return (
      <img
        src={src}
        alt=""
        width={size}
        height={size}
        data-dimmed={uploading !== null || undefined}
        className="block object-contain data-dimmed:opacity-50"
        style={{ width: size, height: size }}
      />
    );
  }
  if (image) {
    return (
      <span
        className="text-muted-foreground flex items-center justify-center border border-dashed"
        style={{ width: size, height: size }}
      >
        <ImageIcon size={Math.round(size / 2)} aria-hidden />
      </span>
    );
  }
  return <span className="text-sm underline underline-offset-4">{(text && entry[text.name]) || ''}</span>;
}

/**
 * An items field drawn as the email draws it: a row of the items, each its image where it has one, else its text.
 * An item opens a popover of its fields and the control that removes it; the plus at the row's end adds one and
 * opens its popover. Outside an editor the row is drawn alone.
 */
export function EmailBlockItems({
  editor,
  items,
  entries,
  label,
  fieldLabel,
  readOnly,
  restructure,
  place = null,
  secure = false,
  size = 24,
  align = 'left',
  onValueChange,
}: EmailBlockItemsProps): ReactNode {
  const [openAt, setOpenAt] = useState<number | null>(null);
  const add = useRef<HTMLButtonElement>(null);
  // Whether the open item was removed, so the focus goes to the plus rather than to a trigger that is gone.
  const removed = useRef(false);
  // Once the removed item's popover and its trigger are gone, the focus goes to the plus, which stays.
  // The popover that held it either unmounts with its trigger or closes onto it, so both move the focus there.
  useEffect(() => {
    if (removed.current) add.current?.focus();
  }, [entries.length]);
  const messages = (editor && contextOf(editor)?.context.messages()) ?? DEFAULT_PROFILE_MESSAGES;
  const text = items.fields.find((field) => field.kind === 'plainText');
  const empty = (): EmailBlockItem => Object.fromEntries(items.fields.map(({ name }) => [name, '']));
  const nameOf = (entry: EmailBlockItem, index: number) =>
    (text && entry[text.name]) || messages.itemRow(label, index + 1);

  return (
    <div
      role="group"
      aria-label={label}
      data-slot="email-block-items"
      data-name={items.name}
      className={cn(
        'not-prose flex flex-wrap items-center gap-2',
        align === 'center' && 'justify-center',
        align === 'right' && 'justify-end',
      )}
      onFocus={(event) => editor && selectBlockOf(editor, event.currentTarget)}
    >
      {entries.map((entry, index) =>
        editor === null || readOnly ? (
          <span key={index} data-slot="email-block-item" aria-label={nameOf(entry, index)} role="img">
            <EmailBlockItemFace place={place} items={items} index={index} entry={entry} size={size} />
          </span>
        ) : (
          <Popover
            // An item has no identity of its own; its place is what the author sees and edits.
            key={index}
            open={openAt === index}
            onOpenChange={(next, details) => {
              const to = details.event instanceof FocusEvent ? details.event.relatedTarget : details.event?.target;
              if (
                !next &&
                to instanceof Element &&
                to.closest('[data-slot=variable-menu], [data-slot=combobox-content]')
              ) {
                return;
              }
              if (next) removed.current = false;
              setOpenAt(next ? index : null);
            }}
          >
            <Tooltip>
              <TooltipTrigger
                render={
                  <PopoverTrigger
                    render={
                      <button
                        type="button"
                        data-slot="email-block-item"
                        aria-label={nameOf(entry, index)}
                        className="hover:bg-muted focus-visible:ring-ring/50 p-1 outline-none focus-visible:ring-3"
                      />
                    }
                  />
                }
              >
                <EmailBlockItemFace place={place} items={items} index={index} entry={entry} size={size} />
              </TooltipTrigger>
              <TooltipContent>{nameOf(entry, index)}</TooltipContent>
            </Tooltip>
            <PopoverContent
              align="start"
              className="w-80 gap-3"
              data-slot="email-block-item-popover"
              aria-label={messages.itemRow(label, index + 1)}
              finalFocus={() => (removed.current ? (add.current ?? false) : true)}
            >
              <PopoverHeader>
                <PopoverTitle>{messages.itemRow(label, index + 1)}</PopoverTitle>
              </PopoverHeader>
              {items.fields.map((field, at) => (
                <EmailBlockItemField
                  key={field.name}
                  editor={editor}
                  place={place}
                  items={items}
                  index={index}
                  field={field}
                  label={fieldLabel(field.name, field.label)}
                  value={entry[field.name] ?? ''}
                  secure={secure}
                  autoFocus={at === 0}
                  onValueChange={(value) =>
                    onValueChange(
                      entries.map((item, place) => (place === index ? { ...item, [field.name]: value } : item)),
                    )
                  }
                />
              ))}
              <div className="flex justify-start">
                <Tooltip>
                  <TooltipTrigger
                    render={
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        aria-label={messages.removeItem}
                        disabled={!restructure || entries.length <= items.min}
                        onClick={() => {
                          removed.current = true;
                          setOpenAt(null);
                          onValueChange(entries.filter((_item, place) => place !== index));
                        }}
                      />
                    }
                  >
                    <TrashIcon size={16} aria-hidden />
                  </TooltipTrigger>
                  <TooltipContent>{messages.removeItem}</TooltipContent>
                </Tooltip>
              </div>
            </PopoverContent>
          </Popover>
        ),
      )}
      {editor !== null && !readOnly && (
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                ref={add}
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label={messages.addItemTo(label)}
                disabled={!restructure || entries.length >= items.max}
                className="text-muted-foreground"
                onClick={() => {
                  removed.current = false;
                  onValueChange([...entries, empty()]);
                  setOpenAt(entries.length);
                }}
              />
            }
          >
            <PlusIcon size={16} aria-hidden />
          </TooltipTrigger>
          <TooltipContent>{messages.addItemTo(label)}</TooltipContent>
        </Tooltip>
      )}
    </div>
  );
}
