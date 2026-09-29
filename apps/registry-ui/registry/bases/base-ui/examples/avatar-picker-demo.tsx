'use client';

import { Palette, Smile } from 'lucide-react';
import { useState, type ReactNode } from 'react';

import {
  AvatarPicker,
  AvatarPickerColor,
  AvatarPickerContent,
  AvatarPickerEmoji,
  AvatarPickerRemove,
  AvatarPickerTrigger,
  type AvatarPickerValue,
} from '@/registry/bases/base-ui/components/layout/avatar-picker';
import { Tabs, TabsList, TabsTrigger } from '@/registry/bases/base-ui/ui/tabs';

/** A round tile, tinted by the picked colour, that opens an emoji + colour editor. */
function AvatarPickerDemo(): ReactNode {
  const [avatar, setAvatar] = useState<AvatarPickerValue>({ color: '#6366f1' });

  return (
    <AvatarPicker value={avatar} onValueChange={setAvatar}>
      <AvatarPickerTrigger
        className="flex size-10 items-center justify-center rounded-full text-lg"
        style={{ backgroundColor: avatar.emoji ? undefined : (avatar.color ?? undefined) }}
      >
        {avatar.emoji}
      </AvatarPickerTrigger>
      <AvatarPickerContent>
        <Tabs defaultValue="emoji" className="gap-0">
          <div className="flex items-center gap-1 p-2">
            <TabsList variant="line">
              <TabsTrigger value="emoji" aria-label="Emoji" className="flex-none px-2">
                <Smile />
              </TabsTrigger>
              <TabsTrigger value="color" aria-label="Color" className="flex-none px-2">
                <Palette />
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
