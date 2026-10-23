import { Check, Trash2 } from 'lucide-react';
import * as React from 'react';

import { Button } from '@/registry/bases/base-ui/ui/button';
import { Empty } from '@/registry/bases/base-ui/ui/empty';
import { Field, FieldLabel } from '@/registry/bases/base-ui/ui/field';
import { Input } from '@/registry/bases/base-ui/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/registry/bases/base-ui/ui/popover';
import { TabsContent } from '@/registry/bases/base-ui/ui/tabs';
import { cn } from '@/registry/bases/base-ui/lib/utils';
import { EmojiPicker } from '@/registry/bases/base-ui/components/data-entry/emoji-picker';

interface AvatarPickerValue {
  /** Emoji glyph avatar, or null. */
  emoji?: string | null;
  /** Uploaded image avatar (data URL / asset URL), or null. */
  imageUrl?: string | null;
  /** Tile background color (any CSS color), or null. */
  color?: string | null;
}

/** The `value` of each pane, and so of the `TabsTrigger` the consumer declares for it. */
type AvatarPickerTab = 'emoji' | 'upload' | 'color';

interface AvatarPickerContextValue {
  value: AvatarPickerValue;
  /** Set the emoji (clears any image). */
  setEmoji: (emoji: string) => void;
  /** Set the tile color. */
  setColor: (color: string) => void;
  /** Set the image URL (clears any emoji). */
  setImage: (url: string) => void;
  /** Clear emoji + image. */
  remove: () => void;
}

const AvatarPickerContext = React.createContext<AvatarPickerContextValue | null>(null);

/** Read the value/Setters shared by the surrounding <AvatarPicker>. */
function useAvatarPicker(): AvatarPickerContextValue {
  const ctx = React.useContext(AvatarPickerContext);
  if (!ctx) {
    throw new Error('AvatarPicker parts must be used within <AvatarPicker>');
  }
  return ctx;
}

interface AvatarPickerProps extends React.ComponentProps<typeof Popover> {
  value: AvatarPickerValue;
  /** Fires with the new avatar value when a part edits it. */
  onValueChange: (value: AvatarPickerValue) => void;
}

/**
 * Avatar picker: a Popover whose parts edit one avatar value. The consumer
 * composes the panes inside upstream `Tabs`, declaring a `TabsTrigger` per pane
 * it includes (or none, for a single pane), and places `AvatarPickerRemoveButton`:
 *
 *   <AvatarPicker value={avatar} onValueChange={setAvatar}>
 *     <AvatarPickerTrigger><Avatar>...</Avatar></AvatarPickerTrigger>
 *     <AvatarPickerContent>
 *       <Tabs defaultValue="emoji">
 *         <div className="flex items-center gap-1">
 *           <TabsList variant="line">
 *             <TabsTrigger value="emoji" aria-label="Emoji"><Smile /></TabsTrigger>
 *             <TabsTrigger value="color" aria-label="Color"><Palette /></TabsTrigger>
 *           </TabsList>
 *           <AvatarPickerRemoveButton className="ml-auto" />
 *         </div>
 *         <AvatarPickerEmojiContent>
 *           <EmojiPickerSearch />
 *           <EmojiPickerContent>
 *             <EmojiPickerEmpty>
 *               <Empty><EmptyHeader><EmptyTitle>No emoji found</EmptyTitle></EmptyHeader></Empty>
 *             </EmojiPickerEmpty>
 *           </EmojiPickerContent>
 *           <EmojiPickerNav />
 *         </AvatarPickerEmojiContent>
 *         <AvatarPickerColorContent>
 *           <AvatarPickerColorGroup aria-label="Colors" />
 *           <AvatarPickerColorField>Custom</AvatarPickerColorField>
 *         </AvatarPickerColorContent>
 *       </Tabs>
 *     </AvatarPickerContent>
 *   </AvatarPicker>
 */
function AvatarPicker({ value, onValueChange, ...props }: AvatarPickerProps): React.ReactNode {
  const ctx: AvatarPickerContextValue = {
    value,
    setEmoji: (emoji) => onValueChange({ ...value, emoji, imageUrl: null }),
    setColor: (color) => onValueChange({ ...value, color }),
    setImage: (imageUrl) => onValueChange({ ...value, imageUrl, emoji: null }),
    remove: () => onValueChange({ ...value, emoji: null, imageUrl: null }),
  };
  return (
    <AvatarPickerContext.Provider value={ctx}>
      <Popover data-slot="avatar-picker" {...props} />
    </AvatarPickerContext.Provider>
  );
}

/**
 * The ghost icon button that opens the editor, around the avatar the consumer
 * composes as its children. Named "Edit avatar" unless an `aria-label` is given;
 * `render` swaps the button for another element.
 */
function AvatarPickerTrigger({
  'aria-label': ariaLabel = 'Edit avatar',
  ...props
}: React.ComponentProps<typeof PopoverTrigger>): React.ReactNode {
  return (
    <PopoverTrigger
      data-slot="avatar-picker-trigger"
      aria-label={ariaLabel}
      render={<Button variant="ghost" size="icon-lg" />}
      {...props}
    />
  );
}

/** The popover body the consumer fills with `Tabs` and the panes, opening below the trigger's start edge. */
function AvatarPickerContent({
  className,
  align = 'start',
  side = 'bottom',
  ...props
}: React.ComponentProps<typeof PopoverContent>): React.ReactNode {
  return (
    <PopoverContent
      data-slot="avatar-picker-content"
      align={align}
      side={side}
      className={cn('w-84', className)}
      {...props}
    />
  );
}

/**
 * The ghost button that clears both emoji and image, unless the consumer's own
 * `onClick` prevents default. Named "Remove avatar" unless an `aria-label` is
 * given; `children` replace its trash icon.
 */
function AvatarPickerRemoveButton({
  onClick,
  children,
  'aria-label': ariaLabel = 'Remove avatar',
  ...props
}: React.ComponentProps<typeof Button>): React.ReactNode {
  const { remove } = useAvatarPicker();
  return (
    <Button
      data-slot="avatar-picker-remove-button"
      type="button"
      variant="ghost"
      size="icon-sm"
      aria-label={ariaLabel}
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented) remove();
      }}
      {...props}
    >
      {children ?? <Trash2 />}
    </Button>
  );
}

/**
 * Emoji pane (tab value `emoji`): an `EmojiPicker` whose pick sets the emoji and
 * clears any image. `children` are the picker's parts, composed by the consumer
 * (`EmojiPickerSearch`, `EmojiPickerContent`, `EmojiPickerNav`), stacked in a
 * column with a gap. Flush against the search, the grid's pinned heading would
 * paint over the field's focus ring.
 */
function AvatarPickerEmojiContent({
  className,
  children,
  ...props
}: Omit<React.ComponentProps<typeof TabsContent>, 'value'>): React.ReactNode {
  const { setEmoji } = useAvatarPicker();
  return (
    <TabsContent
      data-slot="avatar-picker-emoji-content"
      value="emoji"
      className={cn('flex flex-col gap-2 [--emoji-picker-surface:var(--popover)]', className)}
      {...props}
    >
      <EmojiPicker onSelect={setEmoji}>{children}</EmojiPicker>
    </TabsContent>
  );
}

interface AvatarPickerUploadContextValue {
  /** Opens the pane's file picker. */
  choose: () => void;
  /** True while `onUpload` is pending. */
  uploading: boolean;
}

const AvatarPickerUploadContext = React.createContext<AvatarPickerUploadContextValue | null>(null);

interface AvatarPickerUploadContentProps extends Omit<React.ComponentProps<typeof TabsContent>, 'value'> {
  /**
   * Hand the raw file to a backend and resolve the persisted URL (which becomes
   * `imageUrl`); resolve `null` for a no-op. Omit to read the file inline as a
   * data URL.
   */
  onUpload?: (file: File) => string | null | Promise<string | null>;
}

/**
 * Upload pane (tab value `upload`): an `Empty` frame holding the file input. The
 * consumer composes its copy as children (`EmptyHeader`, `EmptyMedia`,
 * `EmptyTitle`, `EmptyDescription`), an `AvatarPickerUploadPreview`, and an
 * `AvatarPickerUploadTrigger` inside `EmptyContent`. A file picked, or an image
 * dropped on the pane, goes to `onUpload`, or is read inline as a data URL when
 * that is omitted; a dropped file that is not an image is ignored.
 *
 * The pane carries its state for the children's
 * `group-data-<state>/avatar-picker-upload:` classes: `data-uploading` (and
 * `aria-busy`) while `onUpload` is pending, `data-dragging` while files are held
 * over it, and `data-has-image` while the avatar is an image.
 */
function AvatarPickerUploadContent({
  className,
  children,
  onUpload,
  onDragEnter,
  onDragOver,
  onDragLeave,
  onDrop,
  ...props
}: AvatarPickerUploadContentProps): React.ReactNode {
  const { value, setImage } = useAvatarPicker();
  const fileRef = React.useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = React.useState(false);
  const [dragging, setDragging] = React.useState(false);
  // Entering one of the pane's own children fires dragenter on it before dragleave on the pane, and
  // Safari leaves dragleave's relatedTarget null, so the drag is over the pane while this is above zero.
  const dragDepth = React.useRef(0);

  const onFile = (file: File | undefined): void => {
    if (!file) return;
    if (onUpload) {
      setUploading(true);
      Promise.resolve(onUpload(file))
        .then((url) => {
          if (url) setImage(url);
        })
        .catch(() => {
          /* the consumer owns error messaging; just leave the uploading state */
        })
        .finally(() => setUploading(false));
      return;
    }
    const reader = new FileReader();
    reader.onload = (): void => setImage(String(reader.result));
    reader.readAsDataURL(file);
  };

  // A drag that carries no files, such as selected text, is left to the browser.
  const holdsFiles = (event: React.DragEvent): boolean => !uploading && event.dataTransfer.types.includes('Files');

  return (
    <AvatarPickerUploadContext.Provider value={{ choose: () => fileRef.current?.click(), uploading }}>
      <TabsContent
        data-slot="avatar-picker-upload-content"
        data-uploading={uploading || undefined}
        data-dragging={dragging || undefined}
        data-has-image={value.imageUrl ? true : undefined}
        aria-busy={uploading}
        value="upload"
        className={cn('group/avatar-picker-upload', className)}
        onDragEnter={(event) => {
          onDragEnter?.(event);
          if (!holdsFiles(event)) return;
          event.preventDefault();
          dragDepth.current += 1;
          setDragging(true);
        }}
        // Without preventDefault on every dragover the browser refuses the drop.
        onDragOver={(event) => {
          onDragOver?.(event);
          if (holdsFiles(event)) event.preventDefault();
        }}
        onDragLeave={(event) => {
          onDragLeave?.(event);
          dragDepth.current = Math.max(0, dragDepth.current - 1);
          if (dragDepth.current === 0) setDragging(false);
        }}
        onDrop={(event) => {
          onDrop?.(event);
          dragDepth.current = 0;
          setDragging(false);
          if (!holdsFiles(event)) return;
          event.preventDefault();
          // `accept` filters only the file picker; a drop can carry any file.
          onFile([...event.dataTransfer.files].find((file) => file.type.startsWith('image/')));
        }}
        {...props}
      >
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => onFile(e.target.files?.[0] ?? undefined)}
        />
        <Empty className="group-data-dragging/avatar-picker-upload:border-primary group-data-dragging/avatar-picker-upload:bg-muted/50 border border-transparent">
          {children}
        </Empty>
      </TabsContent>
    </AvatarPickerUploadContext.Provider>
  );
}

/**
 * The avatar's current image, drawn round and cropped to fill like the `Avatar`
 * it becomes; renders nothing while the avatar is not an image. Name it with
 * `alt`.
 */
function AvatarPickerUploadPreview({ className, ...props }: React.ComponentProps<'img'>): React.ReactNode {
  const { value } = useAvatarPicker();
  if (!value.imageUrl) return null;
  return (
    <img
      data-slot="avatar-picker-upload-preview"
      src={value.imageUrl}
      className={cn('size-24 rounded-full object-cover', className)}
      {...props}
    />
  );
}

/**
 * The outline button that opens the upload pane's file picker, disabled while an
 * upload is pending. `children` are its label.
 */
function AvatarPickerUploadTrigger({ onClick, ...props }: React.ComponentProps<typeof Button>): React.ReactNode {
  const ctx = React.useContext(AvatarPickerUploadContext);
  if (!ctx) {
    throw new Error('AvatarPickerUploadTrigger must be used within <AvatarPickerUploadContent>');
  }
  return (
    <Button
      data-slot="avatar-picker-upload-trigger"
      type="button"
      variant="outline"
      size="sm"
      disabled={ctx.uploading}
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented) ctx.choose();
      }}
      {...props}
    />
  );
}

/** Color pane (tab value `color`): the consumer composes `AvatarPickerColorGroup` and `AvatarPickerColorField` in it. */
function AvatarPickerColorContent({
  className,
  ...props
}: Omit<React.ComponentProps<typeof TabsContent>, 'value'>): React.ReactNode {
  return (
    <TabsContent
      data-slot="avatar-picker-color-content"
      value="color"
      className={cn('flex flex-col gap-4', className)}
      {...props}
    />
  );
}

interface AvatarPickerColorGroupProps extends React.ComponentProps<'div'> {
  /**
   * The swatches, each a button named by its colour and pressed while it is the
   * avatar's colour. Defaults to twelve hues spread evenly round the wheel. They
   * are the avatar's own colour, a value the picker hands back, so they stay
   * literal rather than theme tokens. The pressed swatch carries a check in white or near-black,
   * whichever stands out more from it.
   */
  colors?: readonly string[];
}

/**
 * The check's colour on a swatch: white or near-black, whichever contrasts more with a `#rgb` or
 * `#rrggbb` swatch, by WCAG's relative luminance. White for any other colour string, which it cannot read.
 */
function avatarPickerCheckColor(swatch: string): string {
  const hex = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(swatch)?.[1];
  if (!hex) return '#ffffff';
  const full = hex.length === 3 ? [...hex].map((digit) => digit + digit).join('') : hex;
  const [r, g, b] = [0, 2, 4].map((at) => {
    const channel = Number.parseInt(full.slice(at, at + 2), 16) / 255;
    return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  });
  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  // Near-black is #0a0a0a, luminance about 0.003.
  return 1.05 / (luminance + 0.05) >= (luminance + 0.05) / 0.053 ? '#ffffff' : '#0a0a0a';
}

/** A grid of colour swatches; a click sets the avatar's colour. Name the group with an `aria-label`. */
function AvatarPickerColorGroup({
  className,
  colors = [
    '#6366f1',
    '#8b5cf6',
    '#a855f7',
    '#ec4899',
    '#ef4444',
    '#f97316',
    '#f59e0b',
    '#84cc16',
    '#10b981',
    '#14b8a6',
    '#0ea5e9',
    '#3b82f6',
  ],
  ...props
}: AvatarPickerColorGroupProps): React.ReactNode {
  const { value, setColor } = useAvatarPicker();
  return (
    <div
      data-slot="avatar-picker-color-group"
      role="group"
      className={cn('grid grid-cols-6 gap-2', className)}
      {...props}
    >
      {colors.map((c) => (
        <button
          key={c}
          type="button"
          onClick={() => setColor(c)}
          aria-label={c}
          aria-pressed={value.color === c}
          style={{ backgroundColor: c, color: avatarPickerCheckColor(c) }}
          className="focus-visible:ring-ring/50 flex size-8 items-center justify-center rounded-full outline-none focus-visible:ring-3"
        >
          {value.color === c && <Check aria-hidden className="size-4" />}
        </button>
      ))}
    </div>
  );
}

/**
 * A horizontal `Field` holding a colour input bound to the avatar's colour.
 * `children` are its label, which names the input.
 */
function AvatarPickerColorField({ children, ...props }: React.ComponentProps<typeof Field>): React.ReactNode {
  const { value, setColor } = useAvatarPicker();
  const inputId = React.useId();
  return (
    <Field data-slot="avatar-picker-color-field" orientation="horizontal" {...props}>
      <FieldLabel htmlFor={inputId}>{children}</FieldLabel>
      <Input
        id={inputId}
        type="color"
        value={value.color ?? '#000000'}
        onChange={(e) => setColor(e.target.value)}
        className="w-12"
      />
    </Field>
  );
}

export {
  AvatarPicker,
  AvatarPickerTrigger,
  AvatarPickerContent,
  AvatarPickerRemoveButton,
  AvatarPickerEmojiContent,
  AvatarPickerUploadContent,
  AvatarPickerUploadPreview,
  AvatarPickerUploadTrigger,
  AvatarPickerColorContent,
  AvatarPickerColorGroup,
  AvatarPickerColorField,
};
export type {
  AvatarPickerValue,
  AvatarPickerTab,
  AvatarPickerProps,
  AvatarPickerUploadContentProps,
  AvatarPickerColorGroupProps,
};
