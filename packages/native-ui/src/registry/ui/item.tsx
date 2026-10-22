import { Slot } from '@rn-primitives/slot';
import { cva, type VariantProps } from 'class-variance-authority';
import {
  Children,
  createContext,
  isValidElement,
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useState,
  type ComponentProps,
  type ReactNode,
} from 'react';
import { View } from 'react-native';
import { cn } from '../lib/utils';
import { IconClassContext } from './icon';
import { Separator } from './separator';
import { Text, TextClassContext } from './text';

// A `cn-<slot>` token stands for that slot's view classes, `cn-<slot>/text` for its text classes,
// `cn-<slot>/icon` for the size it gives an icon, and `cn-<slot>@<state>` for the classes behind that
// state, such as `@size=xs` inside an Item of size xs; the registry build replaces each with the classes
// translated for the target engine.

const itemVariants = cva('w-full flex-row flex-wrap items-center cn-item', {
  variants: {
    variant: {
      default: 'cn-item-variant-default',
      outline: 'cn-item-variant-outline',
      muted: 'cn-item-variant-muted',
    },
    size: {
      default: 'cn-item-size-default',
      sm: 'cn-item-size-sm',
      xs: 'cn-item-size-xs',
    },
  },
  defaultVariants: {
    variant: 'default',
    size: 'default',
  },
});

type ItemSize = NonNullable<VariantProps<typeof itemVariants>['size']>;

/**
 * What the parts of an Item read from it: its size, and whether an ItemDescription is inside it, which
 * an ItemMedia aligns to the top for.
 */
const ItemContext = createContext<{
  size: ItemSize;
  holdsDescription: boolean;
  /** Counts a mounted ItemDescription in, `1`, or out, `-1`. */
  countDescription: (change: 1 | -1) => void;
}>({ size: 'default', holdsDescription: false, countDescription: () => undefined });

/** A list of Items, spaced by the size of the Items it holds. */
function ItemGroup({ className, children, ...props }: ComponentProps<typeof View>): ReactNode {
  const sizes = Children.toArray(children).flatMap((child) =>
    isValidElement<ItemProps>(child) && child.type === Item ? [child.props.size ?? 'default'] : [],
  );
  return (
    <View
      role="list"
      className={cn(
        'w-full flex-col cn-item-group',
        sizes.includes('sm') && 'cn-item-group@size=sm',
        sizes.includes('xs') && 'cn-item-group@size=xs',
        className,
      )}
      {...props}
    >
      {children}
    </View>
  );
}

/** A horizontal rule between two Items of an ItemGroup. */
function ItemSeparator({ className, ...props }: ComponentProps<typeof Separator>): ReactNode {
  return <Separator orientation="horizontal" className={cn('cn-item-separator', className)} {...props} />;
}

type ItemProps = ComponentProps<typeof View> &
  VariantProps<typeof itemVariants> & {
    /** Renders the single child in place of a View, such as a Pressable, with the item's props and classes merged onto it. */
    asChild?: boolean;
  };

/**
 * A row of content: an ItemMedia, an ItemContent with an ItemTitle and an ItemDescription, and
 * ItemActions, with an optional ItemHeader and ItemFooter on lines of their own. `variant` draws it
 * with no border, outlined or on a muted background, and `size` sets its spacing. With `asChild`, it
 * renders its single child instead, such as a Pressable that makes the whole row take a press.
 */
function Item({ className, variant, size, asChild = false, ...props }: ItemProps): ReactNode {
  const [descriptions, setDescriptions] = useState(0);
  const countDescription = useCallback((change: 1 | -1) => setDescriptions((count) => count + change), []);
  const context = useMemo(
    () => ({ size: size ?? 'default', holdsDescription: descriptions > 0, countDescription }),
    [size, descriptions, countDescription],
  );
  const Component = asChild ? Slot : View;

  return (
    <ItemContext.Provider value={context}>
      <TextClassContext.Provider value="cn-item/text">
        <Component className={cn(itemVariants({ variant, size }), className)} {...props} />
      </TextClassContext.Provider>
    </ItemContext.Provider>
  );
}

const itemMediaVariants = cva('shrink-0 flex-row items-center justify-center cn-item-media', {
  variants: {
    variant: {
      default: 'cn-item-media-variant-default',
      icon: 'cn-item-media-variant-icon',
      image: 'cn-item-media-variant-image',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
});

type ItemMediaProps = ComponentProps<typeof View> & VariantProps<typeof itemMediaVariants>;

/**
 * The picture at the start of an Item, centred, or aligned to the top while the Item holds a
 * description. `icon` draws an Icon child at 16px; `image` clips an image child, sized `size-full`, to a
 * rounded square that follows the Item's size.
 */
function ItemMedia({ className, variant = 'default', ...props }: ItemMediaProps): ReactNode {
  const { size, holdsDescription } = useContext(ItemContext);
  return (
    <IconClassContext.Provider value={variant === 'icon' ? 'cn-item-media-variant-icon/icon' : undefined}>
      <View
        className={cn(
          itemMediaVariants({ variant }),
          holdsDescription && 'cn-item-media@slot=item-description',
          variant === 'image' && size === 'sm' && 'cn-item-media-variant-image@size=sm',
          variant === 'image' && size === 'xs' && 'cn-item-media-variant-image@size=xs',
          className,
        )}
        {...props}
      />
    </IconClassContext.Provider>
  );
}

/** The text of an Item, taking the width its media and actions leave. */
function ItemContent({ className, ...props }: ComponentProps<typeof View>): ReactNode {
  const { size } = useContext(ItemContext);
  return (
    <View
      className={cn('flex-1 flex-col cn-item-content', size === 'xs' && 'cn-item-content@size=xs', className)}
      {...props}
    />
  );
}

/** The name of an Item, on one line. */
function ItemTitle({ className, ...props }: ComponentProps<typeof Text>): ReactNode {
  return <Text numberOfLines={1} className={cn('cn-item-title/text', className)} {...props} />;
}

/** The muted line under an ItemTitle, on at most two lines. */
function ItemDescription({ className, ...props }: ComponentProps<typeof Text>): ReactNode {
  const { size, countDescription } = useContext(ItemContext);

  // Before paint, so an ItemMedia beside a description is never drawn centred first.
  useLayoutEffect(() => {
    countDescription(1);
    return () => countDescription(-1);
  }, [countDescription]);

  return (
    <Text
      numberOfLines={2}
      className={cn(
        'text-muted-foreground cn-item-description/text',
        size === 'xs' && 'cn-item-description/text@size=xs',
        className,
      )}
      {...props}
    />
  );
}

/** The controls at the end of an Item, in a row. */
function ItemActions({ className, ...props }: ComponentProps<typeof View>): ReactNode {
  return <View className={cn('flex-row items-center cn-item-actions', className)} {...props} />;
}

/** A line of its own at the top of an Item, its children spread to both ends. */
function ItemHeader({ className, ...props }: ComponentProps<typeof View>): ReactNode {
  return (
    <View className={cn('basis-full flex-row items-center justify-between cn-item-header', className)} {...props} />
  );
}

/** A line of its own at the bottom of an Item, its children spread to both ends. */
function ItemFooter({ className, ...props }: ComponentProps<typeof View>): ReactNode {
  return (
    <View className={cn('basis-full flex-row items-center justify-between cn-item-footer', className)} {...props} />
  );
}

export {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemFooter,
  ItemGroup,
  ItemHeader,
  ItemMedia,
  ItemSeparator,
  ItemTitle,
};
export type { ItemMediaProps, ItemProps };
