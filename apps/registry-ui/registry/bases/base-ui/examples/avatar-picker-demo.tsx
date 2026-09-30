'use client';

import { useRef, useState, type ReactNode } from 'react';

import {
  AvatarPicker,
  AvatarPickerColor,
  AvatarPickerContent,
  AvatarPickerEmoji,
  AvatarPickerRemove,
  AvatarPickerTrigger,
  type AvatarPickerValue,
} from '@/registry/bases/base-ui/components/layout/avatar-picker';
import { Avatar, AvatarFallback } from '@/registry/bases/base-ui/ui/avatar';
import { PaletteIcon, type PaletteIconHandle } from '@/registry/bases/base-ui/ui/palette';
import { SmileIcon, type SmileIconHandle } from '@/registry/bases/base-ui/ui/smile';
import { Tabs, TabsList, TabsTrigger } from '@/registry/bases/base-ui/ui/tabs';

/** An avatar, tinted by the picked colour, that opens an emoji and colour editor. */
function AvatarPickerDemo(): ReactNode {
  const [avatar, setAvatar] = useState<AvatarPickerValue>({ color: '#6366f1' });
  const smileRef = useRef<SmileIconHandle>(null);
  const paletteRef = useRef<PaletteIconHandle>(null);

  return (
    <AvatarPicker value={avatar} onValueChange={setAvatar}>
      <AvatarPickerTrigger>
        <Avatar>
          <AvatarFallback style={{ backgroundColor: avatar.emoji ? undefined : (avatar.color ?? undefined) }}>
            {avatar.emoji}
          </AvatarFallback>
        </Avatar>
      </AvatarPickerTrigger>
      <AvatarPickerContent>
        <Tabs defaultValue="emoji">
          <div className="flex items-center gap-1">
            <TabsList variant="line">
              <TabsTrigger
                value="emoji"
                aria-label="Emoji"
                className="flex-none"
                onMouseEnter={() => smileRef.current?.startAnimation()}
                onMouseLeave={() => smileRef.current?.stopAnimation()}
                onFocus={() => smileRef.current?.startAnimation()}
                onBlur={() => smileRef.current?.stopAnimation()}
              >
                <SmileIcon ref={smileRef} aria-hidden />
              </TabsTrigger>
              <TabsTrigger
                value="color"
                aria-label="Color"
                className="flex-none"
                onMouseEnter={() => paletteRef.current?.startAnimation()}
                onMouseLeave={() => paletteRef.current?.stopAnimation()}
                onFocus={() => paletteRef.current?.startAnimation()}
                onBlur={() => paletteRef.current?.stopAnimation()}
              >
                <PaletteIcon ref={paletteRef} aria-hidden />
              </TabsTrigger>
            </TabsList>
            <AvatarPickerRemove className="ml-auto" />
          </div>
          <AvatarPickerEmoji />
          <AvatarPickerColor />
        </Tabs>
      </AvatarPickerContent>
    </AvatarPicker>
  );
}

export { AvatarPickerDemo };
