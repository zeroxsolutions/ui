import { Loader2, Palette, Smile, Trash2, Upload, type LucideIcon } from 'lucide-react';
import * as React from 'react';

import { Button } from '@/registry/bases/base-ui/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/registry/bases/base-ui/ui/popover';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/registry/bases/base-ui/ui/tabs';
import { cn } from '@/registry/bases/base-ui/lib/utils';
import { EmojiPicker } from '../data-entry/emoji-picker';

interface AvatarPickerValue {
  /** Emoji glyph avatar, or null. */
  emoji?: string | null;
  /** Uploaded image avatar (data URL / asset URL), or null. */
  imageUrl?: string | null;
  /** Tile background color (any CSS color), or null. */
  color?: string | null;
}

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

interface AvatarPickerProps {
  value: AvatarPickerValue;
  /** Fires with the new avatar value when a part edits it. */
  onValueChange: (value: AvatarPickerValue) => void;
  /** Open state - uncontrolled by default; pass `open` to control it. */
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Compose `AvatarPickerTrigger` + `AvatarPickerContent`. */
  children?: React.ReactNode;
}

/**
 * Avatar picker - composes the emoji / upload / color tabs behind a Popover.
 * Compound + context: the Root owns the value + setters and the parts read it.
 */
function AvatarPicker({ value, onValueChange, open, defaultOpen, onOpenChange, children }: AvatarPickerProps) {
  const ctx: AvatarPickerContextValue = {
    value,
    setEmoji: (emoji) => onValueChange({ ...value, emoji, imageUrl: null }),
    setColor: (color) => onValueChange({ ...value, color }),
    setImage: (imageUrl) => onValueChange({ ...value, imageUrl, emoji: null }),
    remove: () => onValueChange({ ...value, emoji: null, imageUrl: null }),
  };
  return (
    <AvatarPickerContext.Provider value={ctx}>
      <Popover open={open} defaultOpen={defaultOpen} onOpenChange={onOpenChange} data-slot="avatar-picker">
        {children}
      </Popover>
    </AvatarPickerContext.Provider>
  );
}

interface AvatarPickerTabMeta {
  value: AvatarPickerTab;
  Icon: LucideIcon;
}

/** The clickable avatar tile that opens the editor. */
function AvatarPickerTrigger({
  className,
  'aria-label': ariaLabel = 'Edit avatar',
  ...props
}: React.ComponentProps<typeof PopoverTrigger>) {
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

/**
 * Popover body. Scans its children for the tab parts to build the icon strip
 * (hidden when only one tab) and always renders the Remove action.
 */
function AvatarPickerContent({
  className,
  children,
  align = 'start',
  side = 'bottom',
  ...props
}: React.ComponentProps<typeof PopoverContent>) {
  const tabs = React.Children.toArray(children)
    .filter(React.isValidElement)
    .map((child) => TAB_META.get(child.type as React.ElementType))
    .filter((meta): meta is AvatarPickerTabMeta => Boolean(meta));

  return (
    <PopoverContent
      data-slot="avatar-picker-content"
      align={align}
      side={side}
      className={cn('w-84 gap-0 overflow-hidden p-0', className)}
      {...props}
    >
      <Tabs defaultValue={tabs[0]?.value} className="gap-0">
        <div className="flex items-center gap-1 p-2">
          {tabs.length > 1 && (
            <TabsList variant="line">
              {tabs.map(({ value, Icon }) => (
                <TabsTrigger key={value} value={value} aria-label={value} className="flex-none px-2">
                  <Icon />
                </TabsTrigger>
              ))}
            </TabsList>
          )}
          <AvatarPickerRemove />
        </div>
        {children}
      </Tabs>
    </PopoverContent>
  );
}

/** Clears both emoji and image. Auto-placed in the content header. */
function AvatarPickerRemove({
  className,
  'aria-label': ariaLabel = 'Remove avatar',
  ...props
}: React.ComponentProps<typeof Button>) {
  const { remove } = useAvatarPicker();
  return (
    <Button
      data-slot="avatar-picker-remove"
      type="button"
      variant="ghost"
      size="icon-sm"
      aria-label={ariaLabel}
      onClick={remove}
      className={cn('text-muted-foreground hover:text-destructive ml-auto', className)}
      {...props}
    >
      <Trash2 />
    </Button>
  );
}

/** Emoji tab - picks an emoji (clears any image). */
function AvatarPickerEmoji({ className, ...props }: Omit<React.ComponentProps<typeof TabsContent>, 'value'>) {
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
 * Upload tab. `children` override the default dropzone copy; a picked file goes
 * to `onUpload` (or is read inline as a data URL when omitted).
 */
function AvatarPickerUpload({ className, children, onUpload, ...props }: AvatarPickerUploadProps) {
  const { setImage } = useAvatarPicker();
  const fileRef = React.useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = React.useState(false);

  const onFile = (file: File | undefined) => {
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
    <TabsContent data-slot="avatar-picker-upload" value="upload" className={cn('p-3', className)} {...props}>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => onFile(e.target.files?.[0] ?? undefined)}
      />
      {/* A raw element, not the Button primitive: a drop target is a tall
          column (icon over copy, `py-10`) that no Button `size` variant
          expresses, and forcing one would mean overriding its fixed height +
          row layout. It still rides tokens (`bg-muted`, `text-muted-foreground`,
          `ring-ring`) - no hardcoded colour - and `children` overrides the
          default icon-led copy. */}
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

/** A distinct, evenly-spread default palette for avatar tiles. */
const DEFAULT_COLORS = [
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
];

interface AvatarPickerColorProps extends Omit<React.ComponentProps<typeof TabsContent>, 'value'> {
  /** Swatches shown on the Color tab. */
  colors?: string[];
}

/** Color tab - swatches + a custom picker; `children` override the custom label. */
function AvatarPickerColor({ className, children, colors = DEFAULT_COLORS, ...props }: AvatarPickerColorProps) {
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
            style={{ backgroundColor: c }}
            className={cn(
              'ring-ring ring-offset-popover size-9 rounded-full ring-offset-2 transition-transform outline-none hover:scale-110 focus-visible:ring-2',
              value.color === c && 'ring-2',
            )}
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

const TAB_META = new Map<React.ElementType, AvatarPickerTabMeta>([
  [AvatarPickerEmoji, { value: 'emoji', Icon: Smile }],
  [AvatarPickerUpload, { value: 'upload', Icon: Upload }],
  [AvatarPickerColor, { value: 'color', Icon: Palette }],
]);

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
