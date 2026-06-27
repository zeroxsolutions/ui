import type { Meta, StoryObj } from '@storybook/react-vite';

import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from '@zeroxsolutions/ui/navigation-menu';

const meta: Meta<typeof NavigationMenu> = {
  title: 'Primitives/NavigationMenu',
  component: NavigationMenu,
};
export default meta;

type Story = StoryObj<typeof NavigationMenu>;

export const Default: Story = {
  render: () => (
    <NavigationMenu>
      <NavigationMenuList>
        <NavigationMenuItem>
          <NavigationMenuTrigger>Products</NavigationMenuTrigger>
          <NavigationMenuContent>
            <div className="grid w-64 gap-1">
              <NavigationMenuLink href="#editor">Editor</NavigationMenuLink>
              <NavigationMenuLink href="#canvas">Canvas</NavigationMenuLink>
              <NavigationMenuLink href="#tokens">
                Design tokens
              </NavigationMenuLink>
            </div>
          </NavigationMenuContent>
        </NavigationMenuItem>
        <NavigationMenuItem>
          <NavigationMenuTrigger>Resources</NavigationMenuTrigger>
          <NavigationMenuContent>
            <div className="grid w-64 gap-1">
              <NavigationMenuLink href="#docs">
                Documentation
              </NavigationMenuLink>
              <NavigationMenuLink href="#guides">Guides</NavigationMenuLink>
            </div>
          </NavigationMenuContent>
        </NavigationMenuItem>
        <NavigationMenuItem>
          <NavigationMenuLink href="#pricing">Pricing</NavigationMenuLink>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  ),
};
