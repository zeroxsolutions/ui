import * as React from 'react';
import { Palette, Smile, Trash2, Upload } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { EmojiPicker } from './emoji-picker';

export interface AvatarValue {
  /** Emoji glyph avatar, or null. */
  emoji?: string | null;
  /** Uploaded image avatar (data URL / asset URL), or null. */
  imageUrl?: string | null;
  /** Tile background color (any CSS color), or null. */
  color?: string | null;
}

export interface AvatarEditorProps {
  value: AvatarValue;
  onChange: (value: AvatarValue) => void;
  /** The clickable avatar element rendered as the popover trigger. */
  children: React.ReactNode;
  /** Swatches shown on the Color tab. */
  colors?: string[];
  align?: 'start' | 'center' | 'end';
  side?: 'top' | 'bottom' | 'left' | 'right';
}

/** A distinct, evenly-spread default palette for avatar tiles. */
const DEFAULT_COLORS = [
  '#6366f1', '#8b5cf6', '#a855f7', '#ec4899', '#ef4444', '#f97316',
  '#f59e0b', '#84cc16', '#10b981', '#14b8a6', '#0ea5e9', '#3b82f6',
];

/**
 * Chisel's agent/profile **avatar editor** — a popover opened from the avatar
 * tile with **Emoji · Upload · Color** tabs plus a **Remove** action, modelled
 * 1:1 on LobeHub. Picking an emoji or uploading an image is mutually exclusive
 * (the other is cleared); Remove clears both.
 */
export function AvatarEditor({
  value,
  onChange,
  children,
  colors = DEFAULT_COLORS,
  align = 'start',
  side = 'bottom',
}: AvatarEditorProps) {
  const fileRef = React.useRef<HTMLInputElement>(null);

  const setEmoji = (emoji: string) => onChange({ ...value, emoji, imageUrl: null });
  const setColor = (color: string) => onChange({ ...value, color });
  const onFile = (file: File | undefined) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () =>
      onChange({ ...value, imageUrl: String(reader.result), emoji: null });
    reader.readAsDataURL(file);
  };
  const remove = () => onChange({ ...value, emoji: null, imageUrl: null });

  return (
    <Popover>
      <PopoverTrigger
        aria-label="Edit avatar"
        className="inline-flex rounded-[inherit] outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
      >
        {children}
      </PopoverTrigger>
      <PopoverContent
        align={align}
        side={side}
        className="w-[332px] gap-0 overflow-hidden p-0"
      >
        <Tabs defaultValue="emoji" className="gap-0">
          <div className="flex items-center gap-1 p-2">
            <TabsList variant="line">
              <TabsTrigger value="emoji" aria-label="Emoji" className="flex-none px-2">
                <Smile />
              </TabsTrigger>
              <TabsTrigger value="upload" aria-label="Upload" className="flex-none px-2">
                <Upload />
              </TabsTrigger>
              <TabsTrigger value="color" aria-label="Color" className="flex-none px-2">
                <Palette />
              </TabsTrigger>
            </TabsList>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Remove avatar"
              onClick={remove}
              className="ml-auto size-7 text-muted-foreground hover:text-destructive"
            >
              <Trash2 />
            </Button>
          </div>

          <TabsContent value="emoji" className="p-0">
            <EmojiPicker onSelect={setEmoji} />
          </TabsContent>

          <TabsContent value="upload" className="p-3">
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => onFile(e.target.files?.[0] ?? undefined)}
            />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="flex w-full flex-col items-center justify-center gap-2 rounded-lg bg-muted/50 py-10 text-sm text-muted-foreground transition-colors hover:bg-muted"
            >
              <Upload className="size-6" />
              <span>Click to upload an image</span>
              <span className="text-xs">PNG, JPG or GIF</span>
            </button>
          </TabsContent>

          <TabsContent value="color" className="p-3">
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
              Custom
              <input
                type="color"
                value={value.color ?? '#000000'}
                onChange={(e) => setColor(e.target.value)}
                aria-label="Custom color"
                className="h-8 w-12 cursor-pointer rounded-md bg-transparent"
              />
            </label>
          </TabsContent>
        </Tabs>
      </PopoverContent>
    </Popover>
  );
}
