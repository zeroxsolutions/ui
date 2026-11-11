import { SearchX } from 'lucide-react-native';
import { useState, type ReactNode } from 'react';
import { View } from 'react-native';

import {
  EmojiPicker,
  EmojiPickerContent,
  EmojiPickerEmpty,
  EmojiPickerNav,
  EmojiPickerSearch,
} from '@/components/data-entry/emoji-picker';
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';

/** The picker composed from its parts over a small frequent row, with an empty state for a search that matches nothing. */
function EmojiPickerDemo(): ReactNode {
  const [picked, setPicked] = useState('\u{1F600}');

  return (
    <View className="w-full max-w-72 gap-2">
      <Text className="text-sm">Picked: {picked}</Text>
      <EmojiPicker onSelect={setPicked} frequent={{ name: 'Frequently used', emojis: ['\u{1F355}', '\u{1F389}'] }}>
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
      </EmojiPicker>
    </View>
  );
}

export { EmojiPickerDemo };
