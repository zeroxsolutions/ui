import { mergeProps } from '@base-ui/react/merge-props';
import { useRender } from '@base-ui/react/use-render';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

/**
 * Center — a layout atom that centers its children on both axes. The centering
 * (`items-center justify-center`) is the component's IDENTITY, not a prop: a box
 * whose alignment you can change is a `Flex`, not a `Center` — which is exactly
 * why Radix Themes ships no Center. The single knob is `inline`, toggling
 * block-flow vs inline-flow, the one canonical Center prop (Mantine, Chakra).
 *
 * Center owns only its internal centering classes; outer spacing, sizing and
 * placement (`h-screen`, `w-full`, a `gap` between grouped children) are the
 * consumer's via `className` (merged last so a consumer utility wins). Spreads
 * `...props` and forwards `ref` (React 19 ref-as-prop) onto its single primary
 * element. Polymorphic through the Base UI `render` prop, e.g.
 * `render={<main />}` — the consumer then owns that node's semantics/a11y.
 */
const centerVariants = cva('items-center justify-center', {
  variants: {
    inline: {
      false: 'flex',
      true: 'inline-flex',
    },
  },
  defaultVariants: {
    inline: false,
  },
});

function Center({
  className,
  inline,
  render,
  ...props
}: useRender.ComponentProps<'div'> & VariantProps<typeof centerVariants>) {
  return useRender({
    defaultTagName: 'div',
    props: mergeProps<'div'>(
      {
        className: cn(centerVariants({ inline }), className),
      },
      props,
    ),
    render,
    state: {
      slot: 'center',
    },
  });
}

export { Center, centerVariants };
