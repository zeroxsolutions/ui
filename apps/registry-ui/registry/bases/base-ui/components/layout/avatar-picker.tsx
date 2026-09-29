import { Loader2, Trash2, Upload } from 'lucide-react';
import * as React from 'react';

import { Button } from '@/registry/bases/base-ui/ui/button';
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
 * it includes (or none, for a single pane), and places `AvatarPickerRemove`:
 *
 *   <AvatarPicker value={avatar} onValueChange={setAvatar}>
 *     <AvatarPickerTrigger>{tile}</AvatarPickerTrigger>
 *     <AvatarPickerContent>
 *       <Tabs defaultValue="emoji" className="gap-0">
 *         <div className="flex items-center gap-1 p-2">
 *           <TabsList variant="line">
 *             <TabsTrigger value="emoji" aria-label="Emoji"><Smile /></TabsTrigger>
 *             <TabsTrigger value="color" aria-label="Color"><Palette /></TabsTrigger>
 *           </TabsList>
 *           <AvatarPickerRemove className="ml-auto" />
 *         </div>
 *         <AvatarPickerEmoji />
 *         <AvatarPickerColor />
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

/** The clickable avatar tile that opens the editor. */
function AvatarPickerTrigger({
  className,
  'aria-label': ariaLabel = 'Edit avatar',
  ...props
}: React.ComponentProps<typeof PopoverTrigger>): React.ReactNode {
  return (
    <PopoverTrigger
      data-slot="avatar-picker-trigger"
      aria-label={ariaLabel}
      className={cn(
        'focus-visible:ring-ring/50 inline-flex rounded-[inherit] outline-none focus-visible:ring-2',
        className,
      )}
      {...props}
    />
  );
}

/** The popover body the consumer fills with `Tabs` and the panes. */
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
      className={cn('w-84 gap-0 overflow-hidden p-0', className)}
      {...props}
    />
  );
}

/** Clears both emoji and image, unless the consumer's own `onClick` prevents default. */
function AvatarPickerRemove({
  className,
  onClick,
  'aria-label': ariaLabel = 'Remove avatar',
  ...props
}: React.ComponentProps<typeof Button>): React.ReactNode {
  const { remove } = useAvatarPicker();
  return (
    <Button
      data-slot="avatar-picker-remove"
      type="button"
      variant="ghost"
      size="icon-sm"
      aria-label={ariaLabel}
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented) remove();
      }}
      className={cn('text-muted-foreground hover:text-destructive', className)}
      {...props}
    >
      <Trash2 />
    </Button>
  );
}

/** Emoji pane (tab value `emoji`): picks an emoji and clears any image. */
function AvatarPickerEmoji({
  className,
  ...props
}: Omit<React.ComponentProps<typeof TabsContent>, 'value'>): React.ReactNode {
  const { setEmoji } = useAvatarPicker();
  return (
    <TabsContent data-slot="avatar-picker-emoji" value="emoji" className={cn('p-0', className)} {...props}>
      <EmojiPicker onSelect={setEmoji} />
    </TabsContent>
  );
}

interface AvatarPickerUploadProps extends Omit<React.ComponentProps<typeof TabsContent>, 'value'> {
  /**
   * Hand the raw file to a backend and resolve the persisted URL (which becomes
   * `imageUrl`); resolve `null` for a no-op. Omit to read the file inline as a
   * data URL.
   */
  onUpload?: (file: File) => string | null | Promise<string | null>;
}

/**
 * Upload pane (tab value `upload`). A picked file goes to `onUpload`, or is read
 * inline as a data URL when that is omitted. The pane carries `data-uploading`
 * while `onUpload` is pending, so `children` that replace the default dropzone
 * copy can style off it.
 */
function AvatarPickerUpload({ className, children, onUpload, ...props }: AvatarPickerUploadProps): React.ReactNode {
  const { setImage } = useAvatarPicker();
  const fileRef = React.useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = React.useState(false);

  const onFile = (file: File | undefined): void => {
    if (!file) return;
    if (onUpload) {
      setUploading(true);
      Promise.resolve(onUpload(file))
        .then((url) => {
          if (url) setImage(url);
        })
        .catch(() => {
          /* the consumer owns error messaging; just stop the spinner */
        })
        .finally(() => setUploading(false));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setImage(String(reader.result));
    reader.readAsDataURL(file);
  };

  return (
    <TabsContent
      data-slot="avatar-picker-upload"
      data-uploading={uploading || undefined}
      value="upload"
      className={cn('group/avatar-picker-upload p-3', className)}
      {...props}
    >
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => onFile(e.target.files?.[0] ?? undefined)}
      />
      {/* A raw element, not the Button primitive: a drop target is a tall
          column (icon over copy, `py-10`) that no Button `size` variant
          expresses, and forcing one would mean overriding its fixed height and
          row layout. */}
      <button
        type="button"
        disabled={uploading}
        onClick={() => fileRef.current?.click()}
        className="bg-muted/50 text-muted-foreground hover:bg-muted focus-visible:ring-ring/50 flex w-full flex-col items-center justify-center gap-2 rounded-lg py-10 text-sm transition-colors outline-none focus-visible:ring-2 disabled:opacity-60"
      >
        {children ?? (
          <>
            {uploading ? <Loader2 className="size-6 animate-spin" /> : <Upload className="size-6" />}
            <span>{uploading ? 'Uploading...' : 'Click to upload an image'}</span>
            <span className="text-xs">PNG, JPG or GIF</span>
          </>
        )}
      </button>
    </TabsContent>
  );
}

interface AvatarPickerColorProps extends Omit<React.ComponentProps<typeof TabsContent>, 'value'> {
  /** Swatches shown on the Color pane. Defaults to twelve hues spread evenly round the wheel. */
  colors?: readonly string[];
}

/**
 * Color pane (tab value `color`): swatches, the current one pressed, and a
 * custom picker whose label `children` replace.
 */
function AvatarPickerColor({
  className,
  children,
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
}: AvatarPickerColorProps): React.ReactNode {
  const { value, setColor } = useAvatarPicker();
  return (
    <TabsContent data-slot="avatar-picker-color" value="color" className={cn('p-3', className)} {...props}>
      <div className="grid grid-cols-6 gap-2">
        {colors.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setColor(c)}
            aria-label={c}
            aria-pressed={value.color === c}
            style={{ backgroundColor: c }}
            className="ring-ring ring-offset-popover size-9 rounded-full ring-offset-2 transition-transform outline-none hover:scale-110 focus-visible:ring-2 aria-pressed:ring-2"
          />
        ))}
      </div>
      <label className="text-muted-foreground mt-4 flex items-center gap-2 text-sm">
        {children ?? 'Custom'}
        <input
          type="color"
          value={value.color ?? '#000000'}
          onChange={(e) => setColor(e.target.value)}
          aria-label="Custom color"
          className="h-8 w-12 cursor-pointer rounded-md bg-transparent"
        />
      </label>
    </TabsContent>
  );
}

export {
  AvatarPicker,
  AvatarPickerTrigger,
  AvatarPickerContent,
  AvatarPickerRemove,
  AvatarPickerEmoji,
  AvatarPickerUpload,
  AvatarPickerColor,
};
export type { AvatarPickerValue, AvatarPickerTab, AvatarPickerProps, AvatarPickerUploadProps, AvatarPickerColorProps };
