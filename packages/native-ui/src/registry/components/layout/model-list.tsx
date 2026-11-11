import { Trash2 } from 'lucide-react-native';
import type { ComponentProps, ReactNode } from 'react';
import { View } from 'react-native';
import { cn } from '../../lib/utils';
import { Button } from '../../ui/button';
import { Icon } from '../../ui/icon';
import { Item, ItemActions, ItemContent, ItemMedia } from '../../ui/item';
import { ScrollArea } from '../../ui/scroll-area';
import { Skeleton } from '../../ui/skeleton';
import { Text } from '../../ui/text';

/**
 * The frame for a model list section: a `ModelListHeader` over a scrolling `ModelListContent`. It owns no list
 * state; it does not filter, group, sort or paginate. Place it in a parent of bounded height so the content
 * scrolls.
 *
 *   <ModelList>
 *     <ModelListHeader>
 *       <ModelListTitle>Model list</ModelListTitle>
 *       <ModelListAction>{search}</ModelListAction>
 *     </ModelListHeader>
 *     <ModelListContent>
 *       <ItemGroup>
 *         <Item size="sm" className={unavailable ? 'opacity-50' : undefined}>
 *           <ItemContent><ItemTitle>GPT-4o</ItemTitle></ItemContent>
 *           <ItemActions><ModelListRemoveButton onPress={remove} /></ItemActions>
 *         </Item>
 *       </ItemGroup>
 *     </ModelListContent>
 *   </ModelList>
 */
function ModelList({ className, ...props }: ComponentProps<typeof View>): ReactNode {
  return <View className={cn('min-h-0 flex-1 flex-col', className)} {...props} />;
}

/**
 * The row above the list: a title and trailing controls, wrapping onto a second line when they do not fit. A
 * `TabsList` placed in it takes a line of its own when given `basis-full`.
 */
function ModelListHeader({ className, ...props }: ComponentProps<typeof View>): ReactNode {
  return <View className={cn('flex-row flex-wrap items-center gap-2 px-3 pt-3', className)} {...props} />;
}

/** The section's heading, announced as a heading, growing to push the header's controls to its end. */
function ModelListTitle({ className, ...props }: ComponentProps<typeof Text>): ReactNode {
  return <Text role="heading" className={cn('flex-1 text-base font-sans-medium', className)} {...props} />;
}

/** Trailing header controls, such as a search field or a refresh button. */
function ModelListAction({ className, ...props }: ComponentProps<typeof View>): ReactNode {
  return <View className={cn('shrink-0 flex-row items-center gap-2', className)} {...props} />;
}

/**
 * The scrolling region, a ScrollArea filling the rest of the frame: item groups, an empty state or a
 * `ModelListSkeleton`, stacked. An unavailable model's Item takes `opacity-50` itself.
 */
function ModelListContent({ className, children, ...props }: ComponentProps<typeof ScrollArea>): ReactNode {
  return (
    <ScrollArea className={cn('min-h-0 flex-1', className)} {...props}>
      <View className="flex-col gap-4 py-3">{children}</View>
    </ScrollArea>
  );
}

/**
 * The ghost remove button for one model item, named "Remove model" unless an `aria-label` is given; `children`
 * replace its trash icon.
 */
function ModelListRemoveButton({ children, ...props }: ComponentProps<typeof Button>): ReactNode {
  return (
    <Button aria-label="Remove model" variant="ghost" size="icon-sm" {...props}>
      {children ?? <Icon as={Trash2} />}
    </Button>
  );
}

type ModelListSkeletonProps = ComponentProps<typeof View> & {
  /** Number of placeholder items. Defaults to 6. */
  count?: number;
};

/**
 * Placeholder items shown while a model list loads, each a small Item in the shape of a model item: a media
 * placeholder, two text lines and a trailing control.
 */
function ModelListSkeleton({ count = 6, className, ...props }: ModelListSkeletonProps): ReactNode {
  return (
    <View className={cn('flex-col gap-2', className)} {...props}>
      {Array.from({ length: count }, (_, index) => (
        <Item key={index} size="sm">
          <ItemMedia variant="image">
            <Skeleton className="size-full" />
          </ItemMedia>
          <ItemContent>
            <Skeleton className="h-3.5 w-40" />
            <Skeleton className="h-3 w-56" />
          </ItemContent>
          <ItemActions>
            <Skeleton className="h-4 w-8" />
          </ItemActions>
        </Item>
      ))}
    </View>
  );
}

export {
  ModelList,
  ModelListAction,
  ModelListContent,
  ModelListHeader,
  ModelListRemoveButton,
  ModelListSkeleton,
  ModelListTitle,
};
export type { ModelListSkeletonProps };
