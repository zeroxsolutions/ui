import { useState, type ReactNode } from 'react';

import { EmojiPicker } from '@/registry/bases/base-ui/components/data-entry/emoji-picker';

/** The default picker over a small frequent row. */
function EmojiPickerDemo(): ReactNode {
  const [picked, setPicked] = useState('😀');

  return (
    <div className="flex w-72 flex-col gap-2">
      <p className="text-sm">Picked: {picked}</p>
      <EmojiPicker onSelect={setPicked} frequent={['🍕', '🎉']} />
    </div>
  );
}

export { EmojiPickerDemo };
