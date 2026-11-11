import { launchImageLibraryAsync, type ImagePickerAsset } from 'expo-image-picker';
import { Check, Trash2 } from 'lucide-react-native';
import {
  createContext,
  useContext,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ComponentProps,
  type ReactNode,
} from 'react';
import { Pressable, View } from 'react-native';
import { avatarPickerCheckColor } from '../../lib/avatar-picker-check-color';
import { textOf } from '../../lib/text-children';
import { cn } from '../../lib/utils';
import { Avatar, AvatarImage, type AvatarProps } from '../../ui/avatar';
import { Button } from '../../ui/button';
import { Empty } from '../../ui/empty';
import { Field, FieldLabel } from '../../ui/field';
import { Icon } from '../../ui/icon';
import { Input } from '../../ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
  type PopoverContentProps,
  type PopoverProps,
  type PopoverTriggerProps,
} from '../../ui/popover';
import { TabsContent, type TabsContentProps } from '../../ui/tabs';
import { EmojiPicker } from './emoji-picker';

interface AvatarPickerValue {
  /** Emoji glyph avatar, or null. */
  emoji?: string | null;
  /** Image avatar (a picked photo's uri or an uploaded URL), or null. */
  imageUrl?: string | null;
  /** Tile background colour (any colour string React Native reads), or null. */
  color?: string | null;
}

/** The `value` of each pane, and so of the `TabsTrigger` the consumer declares for it. */
type AvatarPickerTab = 'emoji' | 'upload' | 'color';

interface AvatarPickerSetters {
  /** Set the emoji (clears any image). */
  setEmoji: (emoji: string) => void;
  /** Set the tile colour. */
  setColor: (color: string) => void;
  /** Set the image URL (clears any emoji). */
  setImage: (url: string) => void;
  /** Clear emoji and image. */
  remove: () => void;
}

interface AvatarPickerContextValue extends AvatarPickerSetters {
  value: AvatarPickerValue;
}

const AvatarPickerContext = createContext<AvatarPickerContextValue | null>(null);

function useAvatarPicker(): AvatarPickerContextValue {
  const context = useContext(AvatarPickerContext);
  if (!context) throw new Error('AvatarPicker parts must be used within <AvatarPicker>');
  return context;
}

type AvatarPickerProps = PopoverProps & {
  value: AvatarPickerValue;
  /** Fires with the new avatar value when a part edits it. */
  onValueChange: (value: AvatarPickerValue) => void;
};

/**
 * Avatar picker: a Popover whose parts edit one avatar value. The consumer composes the panes inside `Tabs`,
 * declaring a `TabsTrigger` per pane it includes (or none, for a single pane), and places
 * `AvatarPickerRemoveButton`:
 *
 *   <AvatarPicker value={avatar} onValueChange={setAvatar}>
 *     <AvatarPickerTrigger><Avatar alt="">...</Avatar></AvatarPickerTrigger>
 *     <AvatarPickerContent>
 *       <Tabs value={tab} onValueChange={setTab}>
 *         <View className="flex-row items-center gap-1">
 *           <TabsList variant="line">
 *             <TabsTrigger value="emoji" aria-label="Emoji"><Icon as={Smile} /></TabsTrigger>
 *             <TabsTrigger value="color" aria-label="Color"><Icon as={Palette} /></TabsTrigger>
 *           </TabsList>
 *           <AvatarPickerRemoveButton className="ml-auto" />
 *         </View>
 *         <AvatarPickerEmojiContent>
 *           <EmojiPickerSearch />
 *           <EmojiPickerContent />
 *           <EmojiPickerNav aria-label="Emoji categories" />
 *         </AvatarPickerEmojiContent>
 *         <AvatarPickerColorContent>
 *           <AvatarPickerColorGroup aria-label="Colors" />
 *           <AvatarPickerColorField>Custom</AvatarPickerColorField>
 *         </AvatarPickerColorContent>
 *       </Tabs>
 *     </AvatarPickerContent>
 *   </AvatarPicker>
 */
function AvatarPicker({ value, onValueChange, ...props }: AvatarPickerProps): ReactNode {
  // An upload resolves after renders the caller may have made meanwhile, such as a colour picked while it ran,
  // so the setters spread the value as it is then rather than as it was when the upload began.
  const latest = useRef({ value, onValueChange });
  useLayoutEffect(() => {
    latest.current = { value, onValueChange };
  });

  const setters = useMemo<AvatarPickerSetters>(() => {
    const change = (patch: AvatarPickerValue): void =>
      latest.current.onValueChange({ ...latest.current.value, ...patch });
    return {
      setEmoji: (emoji) => change({ emoji, imageUrl: null }),
      setColor: (color) => change({ color }),
      setImage: (imageUrl) => change({ imageUrl, emoji: null }),
      remove: () => change({ emoji: null, imageUrl: null }),
    };
  }, []);

  const context = useMemo(() => ({ value, ...setters }), [value, setters]);

  return (
    <AvatarPickerContext.Provider value={context}>
      <Popover {...props} />
    </AvatarPickerContext.Provider>
  );
}

/**
 * The ghost icon button that opens the editor, around the avatar the consumer composes as its children. Named
 * "Edit avatar" unless an `aria-label` is given; `asChild` makes the consumer's own pressable child the trigger
 * in place of the button.
 */
function AvatarPickerTrigger({
  asChild,
  children,
  'aria-label': ariaLabel = 'Edit avatar',
  ...props
}: PopoverTriggerProps): ReactNode {
  return (
    <PopoverTrigger asChild aria-label={ariaLabel} {...props}>
      {asChild ? (
        children
      ) : (
        <Button variant="ghost" size="icon-lg">
          {children}
        </Button>
      )}
    </PopoverTrigger>
  );
}

/** The popover body the consumer fills with `Tabs` and the panes, opening below the trigger's start edge. */
function AvatarPickerContent({
  className,
  align = 'start',
  side = 'bottom',
  children,
  ...props
}: PopoverContentProps): ReactNode {
  const context = useAvatarPicker();
  return (
    <PopoverContent align={align} side={side} className={cn('w-[21rem] max-w-full', className)} {...props}>
      {/* A device draws the content in the app's PortalHost, outside this tree, so the value is handed in again. */}
      <AvatarPickerContext.Provider value={context}>{children}</AvatarPickerContext.Provider>
    </PopoverContent>
  );
}

/**
 * The ghost button that clears both emoji and image and keeps the colour, unless the consumer's own `onPress`
 * calls `preventDefault`. Named "Remove avatar" unless an `aria-label` is given; `children` replace its trash
 * icon.
 */
function AvatarPickerRemoveButton({
  onPress,
  children,
  'aria-label': ariaLabel = 'Remove avatar',
  ...props
}: ComponentProps<typeof Button>): ReactNode {
  const { remove } = useAvatarPicker();
  return (
    <Button
      variant="ghost"
      size="icon-sm"
      aria-label={ariaLabel}
      onPress={(event) => {
        onPress?.(event);
        if (!event.isDefaultPrevented()) remove();
      }}
      {...props}
    >
      {children ?? <Icon as={Trash2} />}
    </Button>
  );
}

/**
 * Emoji pane (tab value `emoji`): an `EmojiPicker` on the popover's colour whose pick sets the emoji and clears
 * any image. `children` are the picker's parts, composed by the consumer (`EmojiPickerSearch`,
 * `EmojiPickerContent`, `EmojiPickerNav`), stacked in a column with a gap.
 */
function AvatarPickerEmojiContent({ className, children, ...props }: Omit<TabsContentProps, 'value'>): ReactNode {
  const { setEmoji } = useAvatarPicker();
  return (
    <TabsContent value="emoji" className={cn('gap-2', className)} {...props}>
      <EmojiPicker onSelect={setEmoji} surface="popover">
        {children}
      </EmojiPicker>
    </TabsContent>
  );
}

interface AvatarPickerUploadState {
  /** Opens the photo library; a photo picked there goes to the pane's `onUpload`, or becomes the image. */
  choose: () => void;
  /** True while `onUpload` is pending. */
  uploading: boolean;
}

const AvatarPickerUploadContext = createContext<AvatarPickerUploadState | null>(null);

/**
 * The upload pane's state, for the children of `AvatarPickerUploadContent` that change with it, such as a
 * spinner or an "Uploading..." title while `uploading`.
 * @throws {Error} outside an `AvatarPickerUploadContent`
 */
function useAvatarPickerUpload(): AvatarPickerUploadState {
  const context = useContext(AvatarPickerUploadContext);
  if (!context) throw new Error('useAvatarPickerUpload must be used within <AvatarPickerUploadContent>');
  return context;
}

type AvatarPickerUploadContentProps = Omit<TabsContentProps, 'value'> & {
  /**
   * Hand the picked photo to a backend and resolve the persisted URL, which becomes `imageUrl`; resolve `null` to
   * change nothing. A throw or a rejection changes nothing too, and telling the user is the caller's. Omit to
   * make the photo's own `uri` the image.
   */
  onUpload?: (asset: ImagePickerAsset) => string | null | Promise<string | null>;
};

/**
 * Upload pane (tab value `upload`): an `Empty` frame the consumer fills with its copy (`EmptyHeader`,
 * `EmptyMedia`, `EmptyTitle`, `EmptyDescription`), an `AvatarPickerUploadPreview`, and an
 * `AvatarPickerUploadTrigger` inside `EmptyContent`. The trigger opens the photo library; a photo picked there
 * goes to `onUpload`, or its `uri` becomes the image when that is omitted, and closing the library without a
 * pick changes nothing. The pane is announced busy while `onUpload` is pending, and its children read that
 * through `useAvatarPickerUpload`.
 */
function AvatarPickerUploadContent({
  className,
  children,
  onUpload,
  ...props
}: AvatarPickerUploadContentProps): ReactNode {
  const { setImage } = useAvatarPicker();
  const [uploading, setUploading] = useState(false);

  const upload = async (asset: ImagePickerAsset): Promise<void> => {
    if (!onUpload) {
      setImage(asset.uri);
      return;
    }
    setUploading(true);
    try {
      const url = await onUpload(asset);
      if (url) setImage(url);
    } catch {
      // The caller owns telling the user the upload failed; the pane only stops waiting on it.
    } finally {
      setUploading(false);
    }
  };

  const choose = (): void => {
    void launchImageLibraryAsync({ mediaTypes: ['images'] }).then(
      async (result) => {
        const asset = result.canceled ? undefined : result.assets[0];
        if (asset) await upload(asset);
      },
      // A library that fails to open has picked nothing, as one closed without a pick has.
      () => undefined,
    );
  };

  return (
    <AvatarPickerUploadContext.Provider value={{ choose, uploading }}>
      <TabsContent value="upload" aria-busy={uploading} className={className} {...props}>
        <Empty>{children}</Empty>
      </TabsContent>
    </AvatarPickerUploadContext.Provider>
  );
}

type AvatarPickerUploadPreviewProps = Omit<AvatarProps, 'alt'> & {
  /** Names the image; empty marks it decorative. */
  alt?: string;
};

/**
 * The avatar's current image, in an `Avatar` at size `lg` unless a `size` is given; renders nothing while the
 * avatar is not an image. `children` follow the image, so an `AvatarFallback` there shows while it loads or when
 * it fails.
 */
function AvatarPickerUploadPreview({
  alt = '',
  size = 'lg',
  children,
  ...props
}: AvatarPickerUploadPreviewProps): ReactNode {
  const { value } = useAvatarPicker();
  if (!value.imageUrl) return null;
  return (
    <Avatar alt={alt} size={size} {...props}>
      <AvatarImage source={{ uri: value.imageUrl }} />
      {children}
    </Avatar>
  );
}

/**
 * The outline button that opens the photo library, unless the consumer's own `onPress` calls `preventDefault`;
 * disabled while an upload is pending. `children` are its label.
 * @throws {Error} outside an `AvatarPickerUploadContent`
 */
function AvatarPickerUploadTrigger({ onPress, ...props }: ComponentProps<typeof Button>): ReactNode {
  const context = useContext(AvatarPickerUploadContext);
  if (!context) throw new Error('AvatarPickerUploadTrigger must be used within <AvatarPickerUploadContent>');
  return (
    <Button
      variant="outline"
      size="sm"
      disabled={context.uploading}
      onPress={(event) => {
        onPress?.(event);
        if (!event.isDefaultPrevented()) context.choose();
      }}
      {...props}
    />
  );
}

/** Colour pane (tab value `color`): the consumer composes `AvatarPickerColorGroup` and `AvatarPickerColorField` in it. */
function AvatarPickerColorContent({ className, ...props }: Omit<TabsContentProps, 'value'>): ReactNode {
  return <TabsContent value="color" className={cn('gap-4', className)} {...props} />;
}

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
] as const;

const SWATCHES_PER_ROW = 6;

type AvatarPickerColorGroupProps = ComponentProps<typeof View> & {
  /**
   * The swatches, each a button named by its colour and selected while it is the avatar's colour. Defaults to
   * twelve hues spread evenly round the wheel. They are the avatar's own colour, a value the picker hands back,
   * so they stay literal rather than theme tokens. The selected swatch carries a check in white or near-black,
   * whichever stands out more from it.
   */
  colors?: readonly string[];
};

/** A grid of colour swatches, six to a row; a press sets the avatar's colour. Name the group with an `aria-label`. */
function AvatarPickerColorGroup({
  className,
  colors = DEFAULT_COLORS,
  ...props
}: AvatarPickerColorGroupProps): ReactNode {
  const { value, setColor } = useAvatarPicker();
  const rows = Array.from({ length: Math.ceil(colors.length / SWATCHES_PER_ROW) }, (_, row) =>
    colors.slice(row * SWATCHES_PER_ROW, (row + 1) * SWATCHES_PER_ROW),
  );
  return (
    <View role="group" className={cn('gap-2', className)} {...props}>
      {rows.map((row, index) => (
        <View key={index} className="flex-row gap-2">
          {Array.from({ length: SWATCHES_PER_ROW }, (_, column) => {
            const color = row[column];
            return (
              <View key={column} className="flex-1">
                {color !== undefined && (
                  <Pressable
                    role="button"
                    aria-label={color}
                    aria-selected={value.color === color}
                    onPress={() => setColor(color)}
                    style={{ backgroundColor: color }}
                    className="size-8 items-center justify-center rounded-full"
                  >
                    {value.color === color && (
                      <Icon as={Check} color={avatarPickerCheckColor(color)} className="size-4" />
                    )}
                  </Pressable>
                )}
              </View>
            );
          })}
        </View>
      ))}
    </View>
  );
}

/** The colour `text` spells as six hex digits, with or without a leading `#`, as lowercase `#rrggbb`; else null. */
function hexColorOf(text: string): string | null {
  const digits = /^#?([0-9a-f]{6})$/i.exec(text)?.[1];
  return digits === undefined ? null : `#${digits.toLowerCase()}`;
}

/**
 * A horizontal `Field` holding a text field for the avatar's colour as a hex value. `children` are its label,
 * which names the field. It shows the avatar's colour, and sets the colour once it holds six hex digits, with or
 * without a leading `#` and in either case, as lowercase `#rrggbb`; anything else typed waits there without
 * changing the colour.
 */
function AvatarPickerColorField({
  children,
  orientation = 'horizontal',
  ...props
}: ComponentProps<typeof Field>): ReactNode {
  const { value, setColor } = useAvatarPicker();
  const labelId = useId();
  const color = value.color ?? '';
  const [text, setText] = useState(color);
  // A colour set elsewhere, such as by a swatch, replaces what is typed, unless what is typed already spells it.
  const [shown, setShown] = useState(color);
  if (color !== shown) {
    setShown(color);
    if (hexColorOf(text) !== color) setText(color);
  }

  return (
    <Field orientation={orientation} {...props}>
      <FieldLabel nativeID={labelId}>{children}</FieldLabel>
      <Input
        value={text}
        onChangeText={(next) => {
          setText(next);
          const hex = hexColorOf(next);
          if (hex !== null && hex !== value.color) setColor(hex);
        }}
        // Android reads the label through it; iOS reads only the control's own `aria-label`.
        aria-labelledby={labelId}
        aria-label={textOf(children)}
        placeholder="#000000"
        autoCapitalize="none"
        autoCorrect={false}
        maxLength={7}
        className="w-28"
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
  useAvatarPickerUpload,
};
export type {
  AvatarPickerValue,
  AvatarPickerTab,
  AvatarPickerProps,
  AvatarPickerUploadContentProps,
  AvatarPickerUploadPreviewProps,
  AvatarPickerColorGroupProps,
};
