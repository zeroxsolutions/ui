import { CircleAlert, CircleCheck, CircleDashed } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { View } from 'react-native';

import { Icon } from '@/components/ui/icon';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from '@/components/ui/navigation-menu';
import { Text } from '@/components/ui/text';

const COMPONENTS = [
  {
    title: 'Alert Dialog',
    description: 'A modal dialog that interrupts the user with important content and expects a response.',
  },
  {
    title: 'Hover Card',
    description: 'For sighted users to preview content available behind a link.',
  },
  {
    title: 'Progress',
    description:
      'Displays an indicator showing the completion progress of a task, typically displayed as a progress bar.',
  },
  {
    title: 'Scroll-area',
    description: 'Visually or semantically separates content.',
  },
  {
    title: 'Tabs',
    description: 'A set of layered sections of content, known as tab panels, that are displayed one at a time.',
  },
  {
    title: 'Tooltip',
    description:
      'A popup that displays information related to an element when the element receives keyboard focus or the mouse hovers over it.',
  },
] as const;

function ListItem({ title, children, className }: { title: string; children: string; className?: string }): ReactNode {
  return (
    <View className={className}>
      <NavigationMenuLink>
        <View className="flex-1 gap-1">
          <Text className="leading-none font-medium">{title}</Text>
          <Text numberOfLines={2} className="text-muted-foreground">
            {children}
          </Text>
        </View>
      </NavigationMenuLink>
    </View>
  );
}

function NavigationMenuDemo(): ReactNode {
  return (
    <NavigationMenu>
      <NavigationMenuList>
        <NavigationMenuItem>
          <NavigationMenuTrigger>Getting started</NavigationMenuTrigger>
          <NavigationMenuContent>
            <View className="w-96 max-w-full">
              <ListItem title="Introduction">Re-usable components built with Tailwind CSS.</ListItem>
              <ListItem title="Installation">How to install dependencies and structure your app.</ListItem>
              <ListItem title="Typography">Styles for headings, paragraphs, lists...etc</ListItem>
            </View>
          </NavigationMenuContent>
        </NavigationMenuItem>
        <NavigationMenuItem className="hidden md:flex">
          <NavigationMenuTrigger>Components</NavigationMenuTrigger>
          <NavigationMenuContent>
            <View className="w-[400px] max-w-full gap-2 md:w-[500px] md:flex-row md:flex-wrap md:gap-0 lg:w-[600px]">
              {COMPONENTS.map((component) => (
                <ListItem key={component.title} title={component.title} className="md:w-1/2">
                  {component.description}
                </ListItem>
              ))}
            </View>
          </NavigationMenuContent>
        </NavigationMenuItem>
        <NavigationMenuItem>
          <NavigationMenuTrigger>With Icon</NavigationMenuTrigger>
          <NavigationMenuContent>
            <View className="w-[200px]">
              <NavigationMenuLink className="flex-row items-center gap-2">
                <Icon as={CircleAlert} />
                <Text>Backlog</Text>
              </NavigationMenuLink>
              <NavigationMenuLink className="flex-row items-center gap-2">
                <Icon as={CircleDashed} />
                <Text>To Do</Text>
              </NavigationMenuLink>
              <NavigationMenuLink className="flex-row items-center gap-2">
                <Icon as={CircleCheck} />
                <Text>Done</Text>
              </NavigationMenuLink>
            </View>
          </NavigationMenuContent>
        </NavigationMenuItem>
        <NavigationMenuItem>
          <NavigationMenuLink className={navigationMenuTriggerStyle()}>
            <Text className="font-medium">Docs</Text>
          </NavigationMenuLink>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  );
}

export { NavigationMenuDemo };
