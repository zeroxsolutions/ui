import { useState, type ReactNode } from 'react';
import { Platform } from 'react-native';

import {
  ContextMenu,
  ContextMenuCheckboxItem,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuRadioGroup,
  ContextMenuRadioItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import { Text } from '@/components/ui/text';

function ContextMenuDemo(): ReactNode {
  const [showBookmarks, setShowBookmarks] = useState(true);
  const [showFullUrls, setShowFullUrls] = useState(false);
  const [person, setPerson] = useState('pedro');
  return (
    <ContextMenu>
      <ContextMenuTrigger className="border-border h-36 w-72 items-center justify-center rounded-md border border-dashed">
        <Text className="text-sm">{Platform.OS === 'web' ? 'Right click here' : 'Long press here'}</Text>
      </ContextMenuTrigger>
      <ContextMenuContent className="w-52">
        <ContextMenuItem inset>
          <Text>Back</Text>
          <ContextMenuShortcut>{'\u2318['}</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuItem inset disabled>
          <Text>Forward</Text>
          <ContextMenuShortcut>{'\u2318]'}</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuItem inset>
          <Text>Reload</Text>
          <ContextMenuShortcut>{'\u2318R'}</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuSub>
          <ContextMenuSubTrigger inset>
            <Text>More Tools</Text>
          </ContextMenuSubTrigger>
          <ContextMenuSubContent>
            <ContextMenuItem>
              <Text>Save Page...</Text>
            </ContextMenuItem>
            <ContextMenuItem>
              <Text>Developer Tools</Text>
            </ContextMenuItem>
            <ContextMenuSeparator />
            <ContextMenuItem variant="destructive">
              <Text>Delete</Text>
            </ContextMenuItem>
          </ContextMenuSubContent>
        </ContextMenuSub>
        <ContextMenuSeparator />
        <ContextMenuCheckboxItem checked={showBookmarks} onCheckedChange={setShowBookmarks}>
          <Text>Show Bookmarks</Text>
        </ContextMenuCheckboxItem>
        <ContextMenuCheckboxItem checked={showFullUrls} onCheckedChange={setShowFullUrls}>
          <Text>Show Full URLs</Text>
        </ContextMenuCheckboxItem>
        <ContextMenuSeparator />
        <ContextMenuRadioGroup value={person} onValueChange={setPerson}>
          <ContextMenuLabel inset>People</ContextMenuLabel>
          <ContextMenuRadioItem value="pedro">
            <Text>Pedro Duarte</Text>
          </ContextMenuRadioItem>
          <ContextMenuRadioItem value="colm">
            <Text>Colm Tuite</Text>
          </ContextMenuRadioItem>
        </ContextMenuRadioGroup>
      </ContextMenuContent>
    </ContextMenu>
  );
}

export { ContextMenuDemo };
