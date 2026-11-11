import { Palette, SearchX, Smile, Upload } from 'lucide-react-native';
import { useState, type ReactNode } from 'react';
import { View } from 'react-native';

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
  AvatarPickerUploadPreview,
  AvatarPickerUploadTrigger,
  useAvatarPickerUpload,
  type AvatarPickerValue,
} from '@/components/data-entry/avatar-picker';
import {
  EmojiPickerContent,
  EmojiPickerEmpty,
  EmojiPickerNav,
  EmojiPickerSearch,
} from '@/components/data-entry/emoji-picker';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty';
import { Icon } from '@/components/ui/icon';
import { Spinner } from '@/components/ui/spinner';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Text } from '@/components/ui/text';
import { FluentEmoji } from '@/lib/fluent-emoji';

/** The upload pane's copy, which swaps its icon and its words while an upload runs and once the avatar is an image. */
function UploadPaneCopy({ hasImage }: { hasImage: boolean }): ReactNode {
  const { uploading } = useAvatarPickerUpload();
  return (
    <>
      <EmptyHeader>
        <AvatarPickerUploadPreview alt="Current avatar" />
        {hasImage ? null : <EmptyMedia variant="icon">{uploading ? <Spinner /> : <Icon as={Upload} />}</EmptyMedia>}
        <EmptyTitle>{uploading ? 'Uploading...' : 'Upload an image'}</EmptyTitle>
        <EmptyDescription>Choose a PNG, JPG or GIF from your photos</EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <AvatarPickerUploadTrigger>
          <Text>{hasImage ? 'Replace image' : 'Choose image'}</Text>
        </AvatarPickerUploadTrigger>
      </EmptyContent>
    </>
  );
}

/** An avatar, tinted by the picked colour, that opens an emoji, upload and colour editor. */
function AvatarPickerDemo(): ReactNode {
  const [avatar, setAvatar] = useState<AvatarPickerValue>({ color: '#6366f1' });
  const [tab, setTab] = useState('emoji');

  return (
    <AvatarPicker value={avatar} onValueChange={setAvatar}>
      <AvatarPickerTrigger>
        <Avatar alt="">
          {avatar.imageUrl ? <AvatarImage source={{ uri: avatar.imageUrl }} /> : null}
          <AvatarFallback style={{ backgroundColor: avatar.emoji ? undefined : (avatar.color ?? undefined) }}>
            {/* Drawn in the same Fluent artwork as the picker's cells; the trigger already names the button. */}
            {avatar.emoji ? <FluentEmoji glyph={avatar.emoji} aria-hidden className="size-5" /> : null}
          </AvatarFallback>
        </Avatar>
      </AvatarPickerTrigger>
      <AvatarPickerContent>
        <Tabs value={tab} onValueChange={setTab}>
          <View className="flex-row items-center gap-1">
            <TabsList variant="line">
              <TabsTrigger value="emoji" aria-label="Emoji">
                <Icon as={Smile} />
              </TabsTrigger>
              <TabsTrigger value="upload" aria-label="Upload">
                <Icon as={Upload} />
              </TabsTrigger>
              <TabsTrigger value="color" aria-label="Color">
                <Icon as={Palette} />
              </TabsTrigger>
            </TabsList>
            <AvatarPickerRemoveButton className="ml-auto" />
          </View>
          <AvatarPickerEmojiContent>
            <EmojiPickerSearch />
            <EmojiPickerContent>
              <EmojiPickerEmpty>
                <Empty>
                  <EmptyHeader>
                    <EmptyMedia variant="icon">
                      <Icon as={SearchX} />
                    </EmptyMedia>
                    <EmptyTitle>No emoji found</EmptyTitle>
                  </EmptyHeader>
                </Empty>
              </EmojiPickerEmpty>
            </EmojiPickerContent>
            <EmojiPickerNav aria-label="Emoji categories" />
          </AvatarPickerEmojiContent>
          <AvatarPickerUploadContent>
            <UploadPaneCopy hasImage={Boolean(avatar.imageUrl)} />
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
