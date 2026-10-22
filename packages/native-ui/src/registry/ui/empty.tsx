import { cva, type VariantProps } from 'class-variance-authority';
import type { ComponentProps, ReactNode } from 'react';
import { View } from 'react-native';
import { cn } from '../lib/utils';
import { IconClassContext } from './icon';
import { Text, TextClassContext } from './text';

// A `cn-<slot>` token stands for that slot's view classes, `cn-<slot>/text` for its text classes and
// `cn-<slot>/icon` for the size it gives an icon; the registry build replaces each with the classes
// translated for the target engine.

/**
 * A placeholder for a screen or a section with nothing to show yet, its content centred. Compose it
 * from an EmptyHeader, holding an EmptyMedia, an EmptyTitle and an EmptyDescription, and an
 * EmptyContent for actions. Add `flex-1` to have it fill its parent.
 */
function Empty({ className, ...props }: ComponentProps<typeof View>): ReactNode {
  return (
    <TextClassContext.Provider value="text-center">
      <View className={cn('w-full min-w-0 items-center justify-center cn-empty', className)} {...props} />
    </TextClassContext.Provider>
  );
}

/** The top of an Empty, centring its media, title and description. */
function EmptyHeader({ className, ...props }: ComponentProps<typeof View>): ReactNode {
  return <View className={cn('max-w-sm items-center cn-empty-header', className)} {...props} />;
}

const emptyMediaVariants = cva('shrink-0 items-center justify-center cn-empty-media', {
  variants: {
    variant: {
      default: 'cn-empty-media-default',
      icon: 'cn-empty-media-icon',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
});

type EmptyMediaProps = ComponentProps<typeof View> & VariantProps<typeof emptyMediaVariants>;

/**
 * The picture above an Empty's title. `default` draws its child as it is, such as an image or an
 * Avatar; `icon` draws an Icon child on a muted tile at the style's icon size.
 */
function EmptyMedia({ className, variant = 'default', ...props }: EmptyMediaProps): ReactNode {
  const media = <View className={cn(emptyMediaVariants({ variant }), className)} {...props} />;
  if (variant !== 'icon') return media;
  return (
    <TextClassContext.Provider value="cn-empty-media-icon/text">
      <IconClassContext.Provider value="cn-empty-media-icon/icon">{media}</IconClassContext.Provider>
    </TextClassContext.Provider>
  );
}

/** The heading of an Empty. */
function EmptyTitle({ className, ...props }: ComponentProps<typeof Text>): ReactNode {
  return <Text className={cn('cn-empty-title/text', className)} {...props} />;
}

/** The muted line of text under an EmptyTitle. */
function EmptyDescription({ className, ...props }: ComponentProps<typeof Text>): ReactNode {
  return <Text className={cn('text-muted-foreground cn-empty-description/text', className)} {...props} />;
}

/** The bottom of an Empty, centring its actions, such as a Button. */
function EmptyContent({ className, ...props }: ComponentProps<typeof View>): ReactNode {
  return (
    <TextClassContext.Provider value="text-center cn-empty-content/text">
      <View className={cn('w-full max-w-sm min-w-0 items-center cn-empty-content', className)} {...props} />
    </TextClassContext.Provider>
  );
}

export { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle };
export type { EmptyMediaProps };
