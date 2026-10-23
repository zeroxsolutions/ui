import { ChevronRight, MoreHorizontal } from 'lucide-react-native';
import type { ComponentProps, ReactNode } from 'react';
import { View } from 'react-native';
import { cn } from '../lib/utils';
import { useMirrored } from './direction';
import { Icon, IconClassContext } from './icon';
import { Text, TextClassContext, type TextProps } from './text';

// A `cn-<slot>` token stands for that slot's view classes and `cn-<slot>/text` for its text classes;
// the registry build replaces each with the classes translated for the target engine.

/**
 * react-native-web writes `aria-current` to the DOM for a screen reader on the web; React Native's own
 * props do not list it, and iOS and Android have no current-page state to give it.
 */
const CURRENT_PAGE = { 'aria-current': 'page' } as const;

/**
 * The trail from the top of the app to the current screen, a navigation landmark named Breadcrumb.
 * Holds a BreadcrumbList.
 */
function Breadcrumb({ 'aria-label': label = 'Breadcrumb', ...props }: ComponentProps<typeof View>): ReactNode {
  return <View role="navigation" aria-label={label} {...props} />;
}

/** The list of a Breadcrumb's items and separators, laid out in a wrapping row of muted small text. */
function BreadcrumbList({ className, ...props }: ComponentProps<typeof View>): ReactNode {
  return (
    <TextClassContext.Provider value="cn-breadcrumb-list/text">
      <View role="list" className={cn('flex-row flex-wrap items-center cn-breadcrumb-list', className)} {...props} />
    </TextClassContext.Provider>
  );
}

/** One step of the trail, holding a BreadcrumbLink, a BreadcrumbPage or a BreadcrumbEllipsis. */
function BreadcrumbItem({ className, ...props }: ComponentProps<typeof View>): ReactNode {
  return <View role="listitem" className={cn('flex-row items-center cn-breadcrumb-item', className)} {...props} />;
}

/**
 * A step the user can go back to, announced as a link; `onPress` navigates. With `asChild`, it renders
 * its single child instead, such as expo-router's `Link asChild`, with the link's classes merged on.
 */
function BreadcrumbLink({ className, ...props }: TextProps): ReactNode {
  return <Text role="link" className={cn('cn-breadcrumb-link/text', className)} {...props} />;
}

/** The current screen, the last step, announced as the current page and drawn in the foreground colour. */
function BreadcrumbPage({ className, ...props }: TextProps): ReactNode {
  return (
    <Text role="link" aria-disabled {...CURRENT_PAGE} className={cn('cn-breadcrumb-page/text', className)} {...props} />
  );
}

/**
 * The mark between two steps, a chevron pointing to the next step unless given children, mirrored when text
 * reads right to left; hidden from screen readers.
 */
function BreadcrumbSeparator({ children, className, ...props }: ComponentProps<typeof View>): ReactNode {
  const mirrored = useMirrored();
  return (
    // Upstream sizes the svg inside a separator with a child selector, which has no counterpart on a device.
    <IconClassContext.Provider value="size-3.5">
      <View role="presentation" aria-hidden className={cn('cn-breadcrumb-separator', className)} {...props}>
        {children ?? <Icon as={ChevronRight} style={mirrored} />}
      </View>
    </IconClassContext.Provider>
  );
}

/** Three dots standing for the steps left out of a long trail; hidden from screen readers. */
function BreadcrumbEllipsis({ className, ...props }: ComponentProps<typeof View>): ReactNode {
  return (
    // Upstream sizes the svg inside an ellipsis with a child selector, which has no counterpart on a device.
    <IconClassContext.Provider value="size-4">
      <View
        role="presentation"
        aria-hidden
        className={cn('items-center justify-center cn-breadcrumb-ellipsis', className)}
        {...props}
      >
        <Icon as={MoreHorizontal} />
      </View>
    </IconClassContext.Provider>
  );
}

export {
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
};
