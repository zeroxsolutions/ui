import { cva, type VariantProps } from 'class-variance-authority';
import type { ComponentProps, ReactNode } from 'react';
import { Pressable } from 'react-native';
import { cn } from '../lib/utils';
import { IconClassContext } from './icon';
import { TextClassContext } from './text';

// A `cn-<slot>` token stands for that slot's view classes and `cn-<slot>/text` for its text
// classes; the registry build replaces each with the classes translated for the target engine.
const buttonVariants = cva('flex-row items-center justify-center shrink-0 disabled:opacity-50 cn-button', {
  variants: {
    variant: {
      default: 'cn-button-variant-default',
      outline: 'cn-button-variant-outline',
      secondary: 'cn-button-variant-secondary',
      ghost: 'cn-button-variant-ghost',
      destructive: 'cn-button-variant-destructive',
      link: 'cn-button-variant-link',
    },
    size: {
      default: 'cn-button-size-default',
      xs: 'cn-button-size-xs',
      sm: 'cn-button-size-sm',
      lg: 'cn-button-size-lg',
      icon: 'cn-button-size-icon',
      'icon-xs': 'cn-button-size-icon-xs',
      'icon-sm': 'cn-button-size-icon-sm',
      'icon-lg': 'cn-button-size-icon-lg',
    },
  },
  defaultVariants: {
    variant: 'default',
    size: 'default',
  },
});

const buttonTextVariants = cva('cn-button/text', {
  variants: {
    variant: {
      default: 'cn-button-variant-default/text',
      outline: 'cn-button-variant-outline/text',
      secondary: 'cn-button-variant-secondary/text',
      ghost: 'cn-button-variant-ghost/text',
      destructive: 'cn-button-variant-destructive/text',
      link: 'cn-button-variant-link/text',
    },
    size: {
      default: 'cn-button-size-default/text',
      xs: 'cn-button-size-xs/text',
      sm: 'cn-button-size-sm/text',
      lg: 'cn-button-size-lg/text',
      icon: 'cn-button-size-icon/text',
      'icon-xs': 'cn-button-size-icon-xs/text',
      'icon-sm': 'cn-button-size-icon-sm/text',
      'icon-lg': 'cn-button-size-icon-lg/text',
    },
  },
  defaultVariants: {
    variant: 'default',
    size: 'default',
  },
});

const buttonIconVariants = cva('cn-button/icon', {
  variants: {
    size: {
      default: 'cn-button-size-default/icon',
      xs: 'cn-button-size-xs/icon',
      sm: 'cn-button-size-sm/icon',
      lg: 'cn-button-size-lg/icon',
      icon: 'cn-button-size-icon/icon',
      'icon-xs': 'cn-button-size-icon-xs/icon',
      'icon-sm': 'cn-button-size-icon-sm/icon',
      'icon-lg': 'cn-button-size-icon-lg/icon',
    },
  },
  defaultVariants: {
    size: 'default',
  },
});

type ButtonProps = ComponentProps<typeof Pressable> & VariantProps<typeof buttonVariants>;

/**
 * A pressable control announced as a button. Its label goes in as a Text child, which takes the
 * text classes of the button's variant and size, and an Icon child takes the size's icon size;
 * `disabled` both blocks presses and is announced.
 */
function Button({ className, variant, size, disabled, accessibilityState, ...props }: ButtonProps): ReactNode {
  return (
    <TextClassContext.Provider value={buttonTextVariants({ variant, size })}>
      <IconClassContext.Provider value={buttonIconVariants({ size })}>
        <Pressable
          role="button"
          accessibilityState={{ ...accessibilityState, disabled }}
          disabled={disabled}
          className={cn(buttonVariants({ variant, size }), className)}
          {...props}
        />
      </IconClassContext.Provider>
    </TextClassContext.Provider>
  );
}

export { Button, buttonTextVariants, buttonVariants };
export type { ButtonProps };
