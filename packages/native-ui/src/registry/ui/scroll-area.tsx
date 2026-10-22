import { Children, isValidElement, type ComponentProps, type ReactNode } from 'react';
import { ScrollView } from 'react-native';
import { cn } from '../lib/utils';

type ScrollBarProps = {
  /** The axis the ScrollArea holding it scrolls along. */
  orientation?: 'vertical' | 'horizontal';
};

/**
 * Marks the axis of the ScrollArea it sits in; `horizontal` makes the area scroll sideways. It draws
 * nothing itself, since the platform draws the scroll indicator.
 */
function ScrollBar(_props: ScrollBarProps): ReactNode {
  return null;
}

/**
 * A box of fixed size whose children scroll inside it, a ScrollView with the platform's own scroll
 * indicator. It scrolls vertically, or sideways when it holds a `<ScrollBar orientation="horizontal" />`
 * or is given `horizontal`. Inside a scrolling screen it keeps scrolling on Android.
 */
function ScrollArea({ className, children, horizontal, ...props }: ComponentProps<typeof ScrollView>): ReactNode {
  const holdsHorizontalBar = Children.toArray(children).some(
    (child) =>
      isValidElement<ScrollBarProps>(child) && child.type === ScrollBar && child.props.orientation === 'horizontal',
  );
  return (
    <ScrollView
      nestedScrollEnabled
      horizontal={horizontal ?? holdsHorizontalBar}
      className={cn('relative', className)}
      {...props}
    >
      {children}
    </ScrollView>
  );
}

export { ScrollArea, ScrollBar };
export type { ScrollBarProps };
