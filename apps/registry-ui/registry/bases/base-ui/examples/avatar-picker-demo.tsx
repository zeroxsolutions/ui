'use client';

import { useRef, useState, type ReactNode } from 'react';

import {
  AvatarPicker,
  AvatarPickerColorContent,
  AvatarPickerColorField,
  AvatarPickerColorGroup,
  AvatarPickerContent,
  AvatarPickerEmojiContent,
  AvatarPickerRemoveButton,
  AvatarPickerTrigger,
  AvatarPickerUploadContent,
  AvatarPickerUploadTrigger,
  type AvatarPickerValue,
} from '@/registry/bases/base-ui/components/data-entry/avatar-picker';
import {
  EmojiPickerContent,
  EmojiPickerNav,
  EmojiPickerSearch,
} from '@/registry/bases/base-ui/components/data-entry/emoji-picker';
import { Avatar, AvatarFallback, AvatarImage } from '@/registry/bases/base-ui/ui/avatar';
import { EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/registry/bases/base-ui/ui/empty';
import { PaletteIcon, type PaletteIconHandle } from '@/registry/bases/base-ui/ui/palette';
import { SmileIcon, type SmileIconHandle } from '@/registry/bases/base-ui/ui/smile';
import { Spinner } from '@/registry/bases/base-ui/ui/spinner';
import { Tabs, TabsList, TabsTrigger } from '@/registry/bases/base-ui/ui/tabs';
import { UploadIcon, type UploadIconHandle } from '@/registry/bases/base-ui/ui/upload';

/** An avatar, tinted by the picked colour, that opens an emoji, upload and colour editor. */
function AvatarPickerDemo(): ReactNode {
  const [avatar, setAvatar] = useState<AvatarPickerValue>({ color: '#6366f1' });
  const smileRef = useRef<SmileIconHandle>(null);
  const uploadTabRef = useRef<UploadIconHandle>(null);
  const uploadRef = useRef<UploadIconHandle>(null);
  const paletteRef = useRef<PaletteIconHandle>(null);

  return (
    <AvatarPicker value={avatar} onValueChange={setAvatar}>
      <AvatarPickerTrigger>
        <Avatar>
          {avatar.imageUrl ? <AvatarImage src={avatar.imageUrl} alt="" /> : null}
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
                onMouseEnter={() => smileRef.current?.startAnimation()}
                onMouseLeave={() => smileRef.current?.stopAnimation()}
                onFocus={() => smileRef.current?.startAnimation()}
                onBlur={() => smileRef.current?.stopAnimation()}
              >
                <SmileIcon ref={smileRef} aria-hidden />
              </TabsTrigger>
              <TabsTrigger
                value="upload"
                aria-label="Upload"
                onMouseEnter={() => uploadTabRef.current?.startAnimation()}
                onMouseLeave={() => uploadTabRef.current?.stopAnimation()}
                onFocus={() => uploadTabRef.current?.startAnimation()}
                onBlur={() => uploadTabRef.current?.stopAnimation()}
              >
                <UploadIcon ref={uploadTabRef} aria-hidden />
              </TabsTrigger>
              <TabsTrigger
                value="color"
                aria-label="Color"
                onMouseEnter={() => paletteRef.current?.startAnimation()}
                onMouseLeave={() => paletteRef.current?.stopAnimation()}
                onFocus={() => paletteRef.current?.startAnimation()}
                onBlur={() => paletteRef.current?.stopAnimation()}
              >
                <PaletteIcon ref={paletteRef} aria-hidden />
              </TabsTrigger>
            </TabsList>
            <AvatarPickerRemoveButton className="ml-auto" />
          </div>
          <AvatarPickerEmojiContent>
            <EmojiPickerSearch />
            <EmojiPickerContent />
            <EmojiPickerNav />
          </AvatarPickerEmojiContent>
          <AvatarPickerUploadContent>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <UploadIcon ref={uploadRef} aria-hidden className="group-data-uploading/avatar-picker-upload:hidden" />
                <Spinner className="hidden group-data-uploading/avatar-picker-upload:block" />
              </EmptyMedia>
              <EmptyTitle>
                <span className="group-data-uploading/avatar-picker-upload:hidden">Upload an image</span>
                <span className="hidden group-data-uploading/avatar-picker-upload:inline">Uploading...</span>
              </EmptyTitle>
              <EmptyDescription>PNG, JPG or GIF</EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <AvatarPickerUploadTrigger
                onMouseEnter={() => uploadRef.current?.startAnimation()}
                onMouseLeave={() => uploadRef.current?.stopAnimation()}
                onFocus={() => uploadRef.current?.startAnimation()}
                onBlur={() => uploadRef.current?.stopAnimation()}
              >
                Choose image
              </AvatarPickerUploadTrigger>
            </EmptyContent>
          </AvatarPickerUploadContent>
          <AvatarPickerColorContent>
            <AvatarPickerColorGroup aria-label="Colors" />
            <AvatarPickerColorField>Custom</AvatarPickerColorField>
          </AvatarPickerColorContent>
        </Tabs>
      </AvatarPickerContent>
    </AvatarPicker>
  );
}

export { AvatarPickerDemo };
