import { cva, type VariantProps } from 'class-variance-authority';
import type { ComponentProps, ReactNode } from 'react';
import { View } from 'react-native';
import { cn } from '../lib/utils';
import { IconClassContext } from './icon';
import { TextClassContext } from './text';

// A `cn-<slot>` token stands for that Vega slot's view classes and `cn-<slot>/text` for its text
// classes; the registry build replaces each with the classes translated for the target engine.
const badgeVariants = cva('flex-row items-center justify-center self-start shrink-0 overflow-hidden cn-badge', {
  variants: {
    variant: {
      default: 'cn-badge-variant-default',
      secondary: 'cn-badge-variant-secondary',
      destructive: 'cn-badge-variant-destructive',
      outline: 'cn-badge-variant-outline',
      ghost: 'cn-badge-variant-ghost',
      link: 'cn-badge-variant-link',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
});

const badgeTextVariants = cva('cn-badge/text', {
  variants: {
    variant: {
      default: 'cn-badge-variant-default/text',
      secondary: 'cn-badge-variant-secondary/text',
      destructive: 'cn-badge-variant-destructive/text',
      outline: 'cn-badge-variant-outline/text',
      ghost: 'cn-badge-variant-ghost/text',
      link: 'cn-badge-variant-link/text',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
});

// Vega sizes an svg inside a badge with a descendant selector, which has no counterpart on a device.
const BADGE_ICON_CLASS = 'size-3';

type BadgeProps = ComponentProps<typeof View> & VariantProps<typeof badgeVariants>;

/**
 * A small pill that labels a status or a count. Its label goes in as a Text child, which takes the
 * text classes of the variant, and an Icon child is drawn at 12px.
 */
function Badge({ className, variant, ...props }: BadgeProps): ReactNode {
  return (
    <TextClassContext.Provider value={badgeTextVariants({ variant })}>
      <IconClassContext.Provider value={BADGE_ICON_CLASS}>
        <View className={cn(badgeVariants({ variant }), className)} {...props} />
      </IconClassContext.Provider>
    </TextClassContext.Provider>
  );
}

export { Badge, badgeTextVariants, badgeVariants };
export type { BadgeProps };
