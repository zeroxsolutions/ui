import { useState, type ReactNode } from 'react';

import {
  Menubar,
  MenubarCheckboxItem,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarRadioGroup,
  MenubarRadioItem,
  MenubarSeparator,
  MenubarShortcut,
  MenubarSub,
  MenubarSubContent,
  MenubarSubTrigger,
  MenubarTrigger,
} from '@/components/ui/menubar';
import { Text } from '@/components/ui/text';

function MenubarDemo(): ReactNode {
  const [bookmarksBar, setBookmarksBar] = useState(false);
  const [fullUrls, setFullUrls] = useState(true);
  const [profile, setProfile] = useState('benoit');
  return (
    <Menubar className="self-start">
      <MenubarMenu>
        <MenubarTrigger>
          <Text>File</Text>
        </MenubarTrigger>
        <MenubarContent>
          <MenubarItem>
            <Text>New Tab</Text>
            <MenubarShortcut>{'\u2318T'}</MenubarShortcut>
          </MenubarItem>
          <MenubarItem>
            <Text>New Window</Text>
            <MenubarShortcut>{'\u2318N'}</MenubarShortcut>
          </MenubarItem>
          <MenubarItem disabled>
            <Text>New Incognito Window</Text>
          </MenubarItem>
          <MenubarSeparator />
          <MenubarSub>
            <MenubarSubTrigger>
              <Text>Share</Text>
            </MenubarSubTrigger>
            <MenubarSubContent>
              <MenubarItem>
                <Text>Email link</Text>
              </MenubarItem>
              <MenubarItem>
                <Text>Messages</Text>
              </MenubarItem>
            </MenubarSubContent>
          </MenubarSub>
          <MenubarSeparator />
          <MenubarItem>
            <Text>Print...</Text>
            <MenubarShortcut>{'\u2318P'}</MenubarShortcut>
          </MenubarItem>
        </MenubarContent>
      </MenubarMenu>
      <MenubarMenu>
        <MenubarTrigger>
          <Text>Edit</Text>
        </MenubarTrigger>
        <MenubarContent>
          <MenubarItem>
            <Text>Undo</Text>
            <MenubarShortcut>{'\u2318Z'}</MenubarShortcut>
          </MenubarItem>
          <MenubarItem>
            <Text>Redo</Text>
            <MenubarShortcut>{'\u21E7\u2318Z'}</MenubarShortcut>
          </MenubarItem>
          <MenubarSeparator />
          <MenubarItem>
            <Text>Cut</Text>
          </MenubarItem>
          <MenubarItem>
            <Text>Copy</Text>
          </MenubarItem>
          <MenubarItem>
            <Text>Paste</Text>
          </MenubarItem>
        </MenubarContent>
      </MenubarMenu>
      <MenubarMenu>
        <MenubarTrigger>
          <Text>View</Text>
        </MenubarTrigger>
        <MenubarContent>
          <MenubarCheckboxItem checked={bookmarksBar} onCheckedChange={setBookmarksBar}>
            <Text>Always Show Bookmarks Bar</Text>
          </MenubarCheckboxItem>
          <MenubarCheckboxItem checked={fullUrls} onCheckedChange={setFullUrls}>
            <Text>Always Show Full URLs</Text>
          </MenubarCheckboxItem>
          <MenubarSeparator />
          <MenubarItem inset>
            <Text>Reload</Text>
            <MenubarShortcut>{'\u2318R'}</MenubarShortcut>
          </MenubarItem>
          <MenubarItem inset disabled>
            <Text>Force Reload</Text>
            <MenubarShortcut>{'\u21E7\u2318R'}</MenubarShortcut>
          </MenubarItem>
        </MenubarContent>
      </MenubarMenu>
      <MenubarMenu>
        <MenubarTrigger>
          <Text>Profiles</Text>
        </MenubarTrigger>
        <MenubarContent>
          <MenubarRadioGroup value={profile} onValueChange={setProfile}>
            <MenubarRadioItem value="andy">
              <Text>Andy</Text>
            </MenubarRadioItem>
            <MenubarRadioItem value="benoit">
              <Text>Benoit</Text>
            </MenubarRadioItem>
            <MenubarRadioItem value="luis">
              <Text>Luis</Text>
            </MenubarRadioItem>
          </MenubarRadioGroup>
          <MenubarSeparator />
          <MenubarItem inset>
            <Text>Add Profile...</Text>
          </MenubarItem>
        </MenubarContent>
      </MenubarMenu>
    </Menubar>
  );
}

export { MenubarDemo };
