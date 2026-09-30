import { SearchX } from 'lucide-react';
import { useState, type ReactNode } from 'react';

import {
  EmojiPicker,
  EmojiPickerContent,
  EmojiPickerEmpty,
  EmojiPickerNav,
  EmojiPickerSearch,
} from '@/registry/bases/base-ui/components/data-entry/emoji-picker';
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle } from '@/registry/bases/base-ui/ui/empty';

/** The picker composed from its parts over a small frequent row, with an empty state for a search that matches nothing. */
function EmojiPickerDemo(): ReactNode {
  const [picked, setPicked] = useState('😀');

  return (
    <div className="flex w-72 flex-col gap-2">
      <p className="text-sm">Picked: {picked}</p>
      <EmojiPicker onSelect={setPicked} frequent={{ name: 'Frequently used', emojis: ['🍕', '🎉'] }}>
        <EmojiPickerSearch />
        <EmojiPickerContent>
          <EmojiPickerEmpty>
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <SearchX />
                </EmptyMedia>
                <EmptyTitle>No emoji found</EmptyTitle>
              </EmptyHeader>
            </Empty>
          </EmojiPickerEmpty>
        </EmojiPickerContent>
        <EmojiPickerNav aria-label="Emoji categories" />
      </EmojiPicker>
    </div>
  );
}

export { EmojiPickerDemo };
