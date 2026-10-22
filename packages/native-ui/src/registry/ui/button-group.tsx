import { Slot } from '@rn-primitives/slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { Children, cloneElement, isValidElement, type ComponentProps, type ReactNode } from 'react';
import { View } from 'react-native';
import { cn } from '../lib/utils';
import { IconClassContext } from './icon';
import { Separator } from './separator';
import { TextClassContext } from './text';

// A `cn-<slot>` token stands for that slot's view classes, `cn-<slot>/text` for its text classes,
// `cn-<slot>/icon` for the size it gives an icon, and `cn-<slot>@<state>` for the classes behind that
// state, such as `@slot=button-group` while the group holds groups; the registry build replaces each with
// the classes translated for the target engine.

const buttonGroupVariants = cva('items-stretch self-start cn-button-group', {
  variants: {
    orientation: {
      horizontal: 'flex-row cn-button-group-orientation-horizontal',
      vertical: 'flex-col cn-button-group-orientation-vertical',
    },
  },
  defaultVariants: {
    orientation: 'horizontal',
  },
});

type ChildPosition = 'first' | 'middle' | 'last';

/**
 * The classes that join a child to its neighbours: upstream squares the edges children share and
 * removes the border the next child would draw twice, with selectors on the group's children that a
 * device has no counterpart of.
 */
const buttonGroupChildVariants = cva('', {
  variants: {
    orientation: { horizontal: '', vertical: '' },
    position: { first: '', middle: '', last: '' },
  },
  compoundVariants: [
    { orientation: 'horizontal', position: 'first', className: 'rounded-r-none' },
    { orientation: 'horizontal', position: 'middle', className: 'rounded-l-none rounded-r-none border-l-0' },
    { orientation: 'horizontal', position: 'last', className: 'rounded-l-none border-l-0' },
    { orientation: 'vertical', position: 'first', className: 'rounded-b-none' },
    { orientation: 'vertical', position: 'middle', className: 'rounded-t-none rounded-b-none border-t-0' },
    { orientation: 'vertical', position: 'last', className: 'rounded-t-none border-t-0' },
  ],
});

function positionOf(index: number, count: number): ChildPosition | undefined {
  if (count < 2) return undefined;
  if (index === 0) return 'first';
  return index === count - 1 ? 'last' : 'middle';
}

type ButtonGroupProps = ComponentProps<typeof View> & VariantProps<typeof buttonGroupVariants>;

/**
 * Buttons, and the inputs, text and separators beside them, joined into one control, announced as a
 * group; name it with `aria-label`. Each direct child takes `className`, which the group adds the
 * classes that join it to its neighbours to. A group of groups spaces them apart.
 */
function ButtonGroup({ className, orientation, children, ...props }: ButtonGroupProps): ReactNode {
  const items = Children.toArray(children).filter(isValidElement<{ className?: string }>);
  const holdsGroup = items.some((child) => child.type === ButtonGroup);

  return (
    <View
      role="group"
      className={cn(buttonGroupVariants({ orientation }), holdsGroup && 'cn-button-group@slot=button-group', className)}
      {...props}
    >
      {items.map((child, index) => {
        const position = positionOf(index, items.length);
        return position === undefined
          ? child
          : cloneElement(child, {
              className: cn(
                child.props.className,
                buttonGroupChildVariants({ orientation: orientation ?? 'horizontal', position }),
              ),
            });
      })}
    </View>
  );
}

type ButtonGroupTextProps = ComponentProps<typeof View> & {
  /** Renders the single child in place of a View, with the cell's props and classes merged onto it. */
  asChild?: boolean;
};

/**
 * A bordered muted cell of text in a ButtonGroup, such as a unit or a prefix. Its Text child takes the
 * cell's text classes, and an Icon child is drawn at 16px.
 */
function ButtonGroupText({ className, asChild = false, ...props }: ButtonGroupTextProps): ReactNode {
  const Component = asChild ? Slot : View;
  return (
    <TextClassContext.Provider value="cn-button-group-text/text">
      <IconClassContext.Provider value="cn-button-group-text/icon">
        <Component className={cn('flex-row items-center cn-button-group-text', className)} {...props} />
      </IconClassContext.Provider>
    </TextClassContext.Provider>
  );
}

/** A rule between two children of a ButtonGroup, in the input colour; vertical unless told otherwise. */
function ButtonGroupSeparator({
  className,
  orientation = 'vertical',
  ...props
}: ComponentProps<typeof Separator>): ReactNode {
  return (
    <Separator
      orientation={orientation}
      className={cn(
        'relative self-stretch cn-button-group-separator',
        orientation === 'vertical' ? 'my-px h-auto' : 'mx-px w-auto',
        className,
      )}
      {...props}
    />
  );
}

export { ButtonGroup, ButtonGroupSeparator, ButtonGroupText, buttonGroupVariants };
export type { ButtonGroupProps, ButtonGroupTextProps };
