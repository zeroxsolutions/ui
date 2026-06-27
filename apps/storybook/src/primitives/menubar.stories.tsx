import type { Meta, StoryObj } from '@storybook/react-vite';

import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarSeparator,
  MenubarShortcut,
  MenubarTrigger,
} from '@zeroxsolutions/ui/menubar';

/**
 * `Menubar` is a horizontal bar of top-level menus (File, Edit, ...) built on Base
 * UI menu primitives. Each `MenubarMenu` pairs a `MenubarTrigger` with a
 * `MenubarContent` dropdown of `MenubarItem`s, optional `MenubarSeparator`s, and
 * right-aligned `MenubarShortcut` hints. Use it for desktop-style application menu
 * bars.
 */
const meta: Meta<typeof Menubar> = {
  title: 'Primitives/Menubar',
  component: Menubar,
};
export default meta;

type Story = StoryObj<typeof Menubar>;

/** Two menus (File and Edit) showing item shortcuts and a separator between item groups. */
export const Default: Story = {
  render: () => (
    <Menubar>
      <MenubarMenu>
        <MenubarTrigger>File</MenubarTrigger>
        <MenubarContent>
          <MenubarItem>
            New File <MenubarShortcut>⌘N</MenubarShortcut>
          </MenubarItem>
          <MenubarItem>
            Open <MenubarShortcut>⌘O</MenubarShortcut>
          </MenubarItem>
          <MenubarSeparator />
          <MenubarItem>
            Save <MenubarShortcut>⌘S</MenubarShortcut>
          </MenubarItem>
        </MenubarContent>
      </MenubarMenu>
      <MenubarMenu>
        <MenubarTrigger>Edit</MenubarTrigger>
        <MenubarContent>
          <MenubarItem>
            Undo <MenubarShortcut>⌘Z</MenubarShortcut>
          </MenubarItem>
          <MenubarItem>
            Redo <MenubarShortcut>⇧⌘Z</MenubarShortcut>
          </MenubarItem>
        </MenubarContent>
      </MenubarMenu>
    </Menubar>
  ),
};
