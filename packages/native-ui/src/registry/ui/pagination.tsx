import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react-native';
import type { ComponentProps, ReactNode } from 'react';
import { Platform, View } from 'react-native';
import { cn } from '../lib/utils';
import { Button, type ButtonProps } from './button';
import { Icon, IconClassContext } from './icon';

// A `cn-<slot>` token stands for that slot's view classes and `cn-<slot>/icon` for the size it gives an
// icon; the registry build replaces each with the classes translated for the target engine.

/**
 * react-native-web writes `aria-current` to the DOM for a screen reader on the web; React Native's own
 * props do not list it, and iOS and Android have no current-page state to give it, so on a device the
 * current page is announced as selected instead, which ARIA does not allow on a web link.
 */
const CURRENT_PAGE = { 'aria-current': 'page' } as const;

/**
 * The pages of a long list, a navigation landmark named Pagination, centred in its row. Holds a
 * PaginationContent.
 */
function Pagination({
  className,
  'aria-label': label = 'Pagination',
  ...props
}: ComponentProps<typeof View>): ReactNode {
  return (
    <View
      role="navigation"
      aria-label={label}
      className={cn('mx-auto w-full flex-row justify-center', className)}
      {...props}
    />
  );
}

/** The list of a Pagination's items, laid out in a row. */
function PaginationContent({ className, ...props }: ComponentProps<typeof View>): ReactNode {
  return <View role="list" className={cn('flex-row items-center cn-pagination-content', className)} {...props} />;
}

/** One entry of the list, holding a PaginationLink, a PaginationPrevious, a PaginationNext or a PaginationEllipsis. */
function PaginationItem(props: ComponentProps<typeof View>): ReactNode {
  return <View role="listitem" {...props} />;
}

type PaginationLinkProps = Omit<ButtonProps, 'variant'> & {
  /** Whether this is the current page, drawn outlined and marked as the current page. */
  isActive?: boolean;
};

/**
 * A page the user can go to, a Button announced as a link, ghost unless it is the current page, which is
 * outlined and announced as selected on a device, and square at the `icon` size unless given another. Its number goes in as a Text child; `onPress` navigates.
 */
function PaginationLink({ isActive = false, size = 'icon', ...props }: PaginationLinkProps): ReactNode {
  return (
    <Button
      role="link"
      variant={isActive ? 'outline' : 'ghost'}
      size={size}
      aria-selected={Platform.OS === 'web' ? undefined : isActive}
      {...(isActive ? CURRENT_PAGE : {})}
      {...props}
    />
  );
}

type PaginationStepProps = Omit<PaginationLinkProps, 'children'>;

/** The link to the page before, a left chevron named Go to previous page. */
function PaginationPrevious({ className, ...props }: PaginationStepProps): ReactNode {
  return (
    <PaginationLink
      aria-label="Go to previous page"
      size="default"
      className={cn('cn-pagination-previous', className)}
      {...props}
    >
      <Icon as={ChevronLeft} />
    </PaginationLink>
  );
}

/** The link to the page after, a right chevron named Go to next page. */
function PaginationNext({ className, ...props }: PaginationStepProps): ReactNode {
  return (
    <PaginationLink
      aria-label="Go to next page"
      size="default"
      className={cn('cn-pagination-next', className)}
      {...props}
    >
      <Icon as={ChevronRight} />
    </PaginationLink>
  );
}

/** Three dots standing for the pages left out of the list; hidden from screen readers. */
function PaginationEllipsis({ className, ...props }: ComponentProps<typeof View>): ReactNode {
  return (
    <IconClassContext.Provider value="cn-pagination-ellipsis/icon">
      <View aria-hidden className={cn('cn-pagination-ellipsis', className)} {...props}>
        <Icon as={MoreHorizontal} />
      </View>
    </IconClassContext.Provider>
  );
}

export {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
};
export type { PaginationLinkProps };
