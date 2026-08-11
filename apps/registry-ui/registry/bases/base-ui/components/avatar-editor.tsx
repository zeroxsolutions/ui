import {
  Loader2,
  Palette,
  Smile,
  Trash2,
  Upload,
  type LucideIcon,
} from 'lucide-react';
import * as React from 'react';

import { Button } from '@/registry/bases/base-ui/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/registry/bases/base-ui/ui/popover';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/registry/bases/base-ui/ui/tabs';
import { cn } from '@/registry/bases/base-ui/lib/utils';
import { EmojiPicker } from './emoji-picker';

interface AvatarValue {
  /** Emoji glyph avatar, or null. */
  emoji?: string | null;
  /** Uploaded image avatar (data URL / asset URL), or null. */
  imageUrl?: string | null;
  /** Tile background color (any CSS color), or null. */
  color?: string | null;
}

type AvatarTab = 'emoji' | 'upload' | 'color';

interface AvatarEditorContextValue {
  value: AvatarValue;
  /** Set the emoji (clears any image). */
  setEmoji: (emoji: string) => void;
  /** Set the tile color. */
  setColor: (color: string) => void;
  /** Set the image URL (clears any emoji). */
  setImage: (url: string) => void;
  /** Clear emoji + image. */
  remove: () => void;
}

const AvatarEditorContext =
  React.createContext<AvatarEditorContextValue | null>(null);

/** Read the value/Setters shared by the surrounding <AvatarEditor>. */
function useAvatarEditor(): AvatarEditorContextValue {
  const ctx = React.useContext(AvatarEditorContext);
  if (!ctx) {
    throw new Error('AvatarEditor parts must be used within <AvatarEditor>');
  }
  return ctx;
}

interface AvatarEditorProps {
  value: AvatarValue;
  /** Fires with the new avatar value when a part edits it. */
  onValueChange: (value: AvatarValue) => void;
  /** Open state - uncontrolled by default; pass `open` to control it. */
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Compose `AvatarEditorTrigger` + `AvatarEditorContent`. */
  children?: React.ReactNode;
}

/**
 * Avatar editor - composes the emoji / upload / color tabs behind a Popover.
 * Compound + context: the Root owns the value + setters and the parts read it.
 */
function AvatarEditor({
  value,
  onValueChange,
  open,
  defaultOpen,
  onOpenChange,
  children,
}: AvatarEditorProps) {
  const ctx: AvatarEditorContextValue = {
    value,
    setEmoji: (emoji) => onValueChange({ ...value, emoji, imageUrl: null }),
    setColor: (color) => onValueChange({ ...value, color }),
    setImage: (imageUrl) => onValueChange({ ...value, imageUrl, emoji: null }),
    remove: () => onValueChange({ ...value, emoji: null, imageUrl: null }),
  };
  return (
    <AvatarEditorContext.Provider value={ctx}>
      <Popover
        open={open}
        defaultOpen={defaultOpen}
        onOpenChange={onOpenChange}
        data-slot="avatar-editor"
      >
        {children}
      </Popover>
    </AvatarEditorContext.Provider>
  );
}

interface AvatarTabMeta {
  value: AvatarTab;
  Icon: LucideIcon;
}

/** The clickable avatar tile that opens the editor. */
function AvatarEditorTrigger({
  className,
  'aria-label': ariaLabel = 'Edit avatar',
  ...props
}: React.ComponentProps<typeof PopoverTrigger>) {
  return (
    <PopoverTrigger
      data-slot="avatar-editor-trigger"
      aria-label={ariaLabel}
      className={cn(
        'inline-flex rounded-[inherit] outline-none focus-visible:ring-2 focus-visible:ring-ring/50',
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
function AvatarEditorContent({
  className,
  children,
  align = 'start',
  side = 'bottom',
  ...props
}: React.ComponentProps<typeof PopoverContent>) {
  const tabs = React.Children.toArray(children)
    .filter(React.isValidElement)
    .map((child) => TAB_META.get(child.type as React.ElementType))
    .filter((meta): meta is AvatarTabMeta => Boolean(meta));

  return (
    <PopoverContent
      data-slot="avatar-editor-content"
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
                <TabsTrigger
                  key={value}
                  value={value}
                  aria-label={value}
                  className="flex-none px-2"
                >
                  <Icon />
                </TabsTrigger>
              ))}
            </TabsList>
          )}
          <AvatarEditorRemove />
        </div>
        {children}
      </Tabs>
    </PopoverContent>
  );
}

/** Clears both emoji and image. Auto-placed in the content header. */
function AvatarEditorRemove({
  className,
  'aria-label': ariaLabel = 'Remove avatar',
  ...props
}: React.ComponentProps<typeof Button>) {
  const { remove } = useAvatarEditor();
  return (
    <Button
      data-slot="avatar-editor-remove"
      type="button"
      variant="ghost"
      size="icon-sm"
      aria-label={ariaLabel}
      onClick={remove}
      className={cn(
        'ml-auto text-muted-foreground hover:text-destructive',
        className,
      )}
      {...props}
    >
      <Trash2 />
    </Button>
  );
}

/** Emoji tab - picks an emoji (clears any image). */
function AvatarEditorEmoji({
  className,
  ...props
}: Omit<React.ComponentProps<typeof TabsContent>, 'value'>) {
  const { setEmoji } = useAvatarEditor();
  return (
    <TabsContent
      data-slot="avatar-editor-emoji"
      value="emoji"
      className={cn('p-0', className)}
      {...props}
    >
      <EmojiPicker onSelect={setEmoji} />
    </TabsContent>
  );
}

interface AvatarEditorUploadProps
  extends Omit<React.ComponentProps<typeof TabsContent>, 'value'> {
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
function AvatarEditorUpload({
  className,
  children,
  onUpload,
  ...props
}: AvatarEditorUploadProps) {
  const { setImage } = useAvatarEditor();
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
    <TabsContent
      data-slot="avatar-editor-upload"
      value="upload"
      className={cn('p-3', className)}
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
          expresses, and forcing one would mean overriding its fixed height +
          row layout. It still rides tokens (`bg-muted`, `text-muted-foreground`,
          `ring-ring`) - no hardcoded colour - and `children` overrides the
          default icon-led copy. */}
      <button
        type="button"
        disabled={uploading}
        onClick={() => fileRef.current?.click()}
        className="flex w-full flex-col items-center justify-center gap-2 rounded-lg bg-muted/50 py-10 text-sm text-muted-foreground outline-none transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring/50 disabled:opacity-60"
      >
        {children ?? (
          <>
            {uploading ? (
              <Loader2 className="size-6 animate-spin" />
            ) : (
              <Upload className="size-6" />
            )}
            <span>
              {uploading ? 'Uploading...' : 'Click to upload an image'}
            </span>
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

interface AvatarEditorColorProps
  extends Omit<React.ComponentProps<typeof TabsContent>, 'value'> {
  /** Swatches shown on the Color tab. */
  colors?: string[];
}

/** Color tab - swatches + a custom picker; `children` override the custom label. */
function AvatarEditorColor({
  className,
  children,
  colors = DEFAULT_COLORS,
  ...props
}: AvatarEditorColorProps) {
  const { value, setColor } = useAvatarEditor();
  return (
    <TabsContent
      data-slot="avatar-editor-color"
      value="color"
      className={cn('p-3', className)}
      {...props}
    >
      <div className="grid grid-cols-6 gap-2">
        {colors.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setColor(c)}
            aria-label={c}
            style={{ backgroundColor: c }}
            className={cn(
              'size-9 rounded-full outline-none ring-ring ring-offset-2 ring-offset-popover transition-transform hover:scale-110 focus-visible:ring-2',
              value.color === c && 'ring-2',
            )}
          />
        ))}
      </div>
      <label className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
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

const TAB_META = new Map<React.ElementType, AvatarTabMeta>([
  [AvatarEditorEmoji, { value: 'emoji', Icon: Smile }],
  [AvatarEditorUpload, { value: 'upload', Icon: Upload }],
  [AvatarEditorColor, { value: 'color', Icon: Palette }],
]);

export {
  AvatarEditor,
  AvatarEditorTrigger,
  AvatarEditorContent,
  AvatarEditorRemove,
  AvatarEditorEmoji,
  AvatarEditorUpload,
  AvatarEditorColor,
};
export type {
  AvatarValue,
  AvatarTab,
  AvatarEditorProps,
  AvatarEditorUploadProps,
  AvatarEditorColorProps,
};
