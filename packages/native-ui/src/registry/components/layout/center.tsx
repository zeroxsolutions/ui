import { cva, type VariantProps } from 'class-variance-authority';
import { cloneElement, isValidElement, type ComponentProps, type ReactElement, type ReactNode } from 'react';
import { View } from 'react-native';
import { cn } from '../../lib/utils';

/**
 * The web's `flex` lays children out in a row, where a View's default is a column, so both variants
 * name the row. A device has no inline flow, so `inline` keeps the box to its content's width, which is
 * what `inline-flex` changes in a block.
 */
const centerVariants = cva('flex-row items-center justify-center', {
  variants: {
    inline: {
      false: 'flex',
      true: 'flex self-start',
    },
  },
  defaultVariants: {
    inline: false,
  },
});

/** What a function `render` is called with beside the props: the part it stands in for. */
interface CenterState {
  slot: 'center';
}

type CenterRenderProps = ComponentProps<typeof View>;

type CenterProps = ComponentProps<typeof View> &
  VariantProps<typeof centerVariants> & {
    /**
     * The element drawn in place of the View, such as a `<Pressable />`, given Center's props under its
     * own and its classes after Center's; or a function of those props that returns it.
     */
    render?: ReactElement<CenterRenderProps> | ((props: CenterRenderProps, state: CenterState) => ReactElement);
  };

/**
 * Centres its children on both axes. The centring is fixed: a box whose alignment the caller could change
 * would be a flex box, not a centre. `inline` keeps the box to its content's width. Size, spacing and
 * placement (`h-32`, `gap-2`) come from `className`; `render` swaps the element, and its semantics are
 * then the caller's. Its text goes in a Text, as any View's does.
 */
function Center({ className, inline, render, ...props }: CenterProps): ReactNode {
  const merged = { ...props, className: cn(centerVariants({ inline }), className) };

  if (typeof render === 'function') return render(merged, { slot: 'center' });
  if (isValidElement<CenterRenderProps>(render)) {
    return cloneElement(render, {
      ...merged,
      ...render.props,
      className: cn(merged.className, render.props.className),
    });
  }
  return <View {...merged} />;
}

export { Center, centerVariants };
export type { CenterProps, CenterState };
