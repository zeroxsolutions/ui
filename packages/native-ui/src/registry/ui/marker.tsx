import { Slot } from '@rn-primitives/slot';
import { cva, type VariantProps } from 'class-variance-authority';
import {
  Children,
  cloneElement,
  createContext,
  isValidElement,
  useContext,
  type ComponentProps,
  type ReactElement,
  type ReactNode,
} from 'react';
import { View } from 'react-native';
import { cn } from '../lib/utils';
import { IconClassContext } from './icon';
import { Text, TextClassContext } from './text';

// A `cn-<slot>` token stands for that slot's view classes, `cn-<slot>/text` for its text classes,
// `cn-<slot>/icon` for the size it gives an icon, and `cn-<slot>@<state>` for the classes behind that
// state, such as `@part=before` on the line before a separator's text; the registry build replaces each
// with the classes translated for the target engine.

const markerVariants = cva('relative w-full flex-row items-center cn-marker', {
  variants: {
    variant: {
      default: '',
      separator: 'cn-marker-variant-separator',
      border: 'cn-marker-variant-border',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
});

type MarkerVariant = NonNullable<VariantProps<typeof markerVariants>['variant']>;

/** The variant of the Marker a MarkerContent sits in, which a separator's text keeps to its own width for. */
const MarkerContext = createContext<MarkerVariant>('default');

type MarkerProps = ComponentProps<typeof View> &
  VariantProps<typeof markerVariants> & {
    /**
     * Renders the single child in place of a View, such as a Pressable or a link, with the marker's props and
     * classes merged onto it; a separator's lines go inside the child, around its children.
     */
    asChild?: boolean;
  };

/**
 * A line in a conversation that is not a message: a status, a system note, a row ruled underneath
 * (`border`), or a label between two lines (`separator`). Its text is small and muted. With
 * `role="status"`, the marker is announced politely each time it changes on Android; iOS announces no change.
 */
function Marker({ className, variant, asChild = false, role, children, ...props }: MarkerProps): ReactNode {
  const separator = variant === 'separator';
  const lines = (content: ReactNode): ReactNode =>
    separator ? (
      <>
        <View className="cn-marker-variant-separator@part=before" />
        {content}
        <View className="cn-marker-variant-separator@part=after" />
      </>
    ) : (
      content
    );
  const shared = {
    role,
    'aria-live': role === 'status' ? ('polite' as const) : undefined,
    className: cn(markerVariants({ variant }), className),
    ...props,
  };

  let drawn: ReactNode;
  if (asChild) {
    const child = Children.only(children) as ReactElement<{ children?: ReactNode }>;
    drawn = (
      <Slot {...shared}>
        {isValidElement(child) ? cloneElement(child, undefined, lines(child.props.children)) : child}
      </Slot>
    );
  } else {
    drawn = <View {...shared}>{lines(children)}</View>;
  }

  return (
    <MarkerContext.Provider value={variant ?? 'default'}>
      <TextClassContext.Provider value="cn-marker/text">
        <IconClassContext.Provider value="cn-marker/icon">{drawn}</IconClassContext.Provider>
      </TextClassContext.Provider>
    </MarkerContext.Provider>
  );
}

/** A 16px icon at the start of a Marker, hidden from screen readers. */
function MarkerIcon({ className, ...props }: ComponentProps<typeof View>): ReactNode {
  return (
    <IconClassContext.Provider value="cn-marker-icon/icon">
      <View aria-hidden className={cn('shrink-0 items-center justify-center cn-marker-icon', className)} {...props} />
    </IconClassContext.Provider>
  );
}

/**
 * The text of a Marker, wrapping in the width the icon leaves; inside a separator, centred and only as wide
 * as it needs. Nest a Text in it to set part of the text apart, such as a name in a medium weight.
 */
function MarkerContent({ className, ...props }: ComponentProps<typeof Text>): ReactNode {
  const variant = useContext(MarkerContext);
  return (
    <Text
      className={cn(
        'min-w-0 shrink',
        variant === 'separator' && 'cn-marker-content@variant=separator cn-marker-content/text@variant=separator',
        className,
      )}
      {...props}
    />
  );
}

export { Marker, MarkerContent, MarkerIcon, markerVariants };
export type { MarkerProps };
