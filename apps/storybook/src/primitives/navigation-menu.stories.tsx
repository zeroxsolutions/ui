import type { Meta, StoryObj } from '@storybook/react-vite';

import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from '@zeroxsolutions/ui/components/ui/navigation-menu';

/**
 * `NavigationMenu` is a Base UI menu bar for primary site navigation: triggers
 * open positioned popover panels of links, while standalone items render as
 * direct links. Compose `NavigationMenuList`, `NavigationMenuItem`,
 * `NavigationMenuTrigger`, `NavigationMenuContent`, and `NavigationMenuLink` to
 * build the structure; panel content is portaled and animated on open/close.
 */
const meta: Meta<typeof NavigationMenu> = {
  title: 'Primitives/NavigationMenu',
  component: NavigationMenu,
};
export default meta;

type Story = StoryObj<typeof NavigationMenu>;

/**
 * Horizontal bar mixing trigger-driven dropdown panels (Products, Resources)
 * with a single standalone link (Pricing).
 */
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
