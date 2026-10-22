import { Slot } from '@rn-primitives/slot';
import { cva, type VariantProps } from 'class-variance-authority';
import {
  Children,
  cloneElement,
  createContext,
  isValidElement,
  useContext,
  useLayoutEffect,
  useState,
  type ComponentProps,
  type ReactElement,
  type ReactNode,
} from 'react';
import { StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import { useFocusVisible } from '../lib/focus-visible';
import { useMessage } from '../lib/message-context';
import { asText } from '../lib/text-children';
import { cn } from '../lib/utils';
import { TextClassContext } from './text';

// A `cn-<slot>` token stands for that slot's view classes, `cn-<slot>/text` for its text classes, and
// `cn-<slot>@<state>` for the classes behind that state, such as `@part=bubble-content`, the classes a
// Bubble's variant gives its content; the registry build replaces each with the classes translated for the
// target engine.

function BubbleGroup({ className, ...props }: ComponentProps<typeof View>): ReactNode {
  return <View className={cn('min-w-0 flex-col cn-bubble-group', className)} {...props} />;
}

const bubbleVariants = cva('relative min-w-0 flex-col self-start cn-bubble', {
  variants: {
    variant: {
      default: 'cn-bubble-variant-default',
      secondary: 'cn-bubble-variant-secondary',
      muted: 'cn-bubble-variant-muted',
      tinted: 'cn-bubble-variant-tinted',
      outline: 'cn-bubble-variant-outline',
      ghost: 'cn-bubble-variant-ghost',
      destructive: 'cn-bubble-variant-destructive',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
});

type BubbleVariant = NonNullable<VariantProps<typeof bubbleVariants>['variant']>;

/** The view classes each variant gives a Bubble's content. */
const CONTENT_VARIANT_CLASSES: Readonly<Record<BubbleVariant, string>> = {
  default: 'cn-bubble-variant-default@part=bubble-content',
  secondary: 'cn-bubble-variant-secondary@part=bubble-content',
  muted: 'cn-bubble-variant-muted@part=bubble-content',
  tinted: 'cn-bubble-variant-tinted@part=bubble-content',
  outline: 'cn-bubble-variant-outline@part=bubble-content',
  ghost: 'cn-bubble-variant-ghost@part=bubble-content',
  destructive: 'cn-bubble-variant-destructive@part=bubble-content',
};

/** The text classes each variant gives a Bubble's content; the others keep the page's text colour. */
const CONTENT_VARIANT_TEXT_CLASSES: Readonly<Record<BubbleVariant, string>> = {
  default: 'cn-bubble-variant-default/text@part=bubble-content',
  secondary: 'cn-bubble-variant-secondary/text@part=bubble-content',
  muted: '',
  tinted: 'cn-bubble-variant-tinted/text@part=bubble-content',
  outline: '',
  ghost: '',
  destructive: 'cn-bubble-variant-destructive/text@part=bubble-content',
};

type BubbleAlign = 'start' | 'end';

/** The variant and side of the Bubble its content and reactions sit in. */
const BubbleContext = createContext<{ variant: BubbleVariant; align: BubbleAlign }>({
  variant: 'default',
  align: 'start',
});

type BubbleProps = ComponentProps<typeof View> &
  VariantProps<typeof bubbleVariants> & {
    /** The side of the conversation the bubble sits on; inside an end-aligned Message it sits at the end either way. */
    align?: BubbleAlign;
  };

/**
 * A message's framed surface, as wide as its content up to 80% of the row; `ghost` draws no frame and may
 * take the full width. `variant` colours its BubbleContent. Inside a Message, a ghost bubble drops the inset
 * of the message's header and footer.
 */
function Bubble({ variant, align = 'start', className, ...props }: BubbleProps): ReactNode {
  const message = useMessage();
  const drawn = variant ?? 'default';
  const ghost = drawn === 'ghost';
  const { countGhost } = message;

  useLayoutEffect(() => {
    if (!ghost) return undefined;
    countGhost(1);
    return () => countGhost(-1);
  }, [ghost, countGhost]);

  return (
    <BubbleContext.Provider value={{ variant: drawn, align }}>
      <View
        className={cn(
          bubbleVariants({ variant }),
          (align === 'end' || message.align === 'end') && 'cn-bubble@align=end',
          ghost && 'cn-bubble@variant=ghost',
          className,
        )}
        {...props}
      />
    </BubbleContext.Provider>
  );
}

type BubbleContentProps = ComponentProps<typeof View> & {
  /**
   * Renders the single child in place of a View, such as a Pressable or a link, with the content's props and
   * classes merged onto it; text straight inside the child is set in a Text.
   */
  asChild?: boolean;
};

/**
 * The text or rich content of a Bubble, coloured by the Bubble's variant. Text given straight to it is set in
 * a Text. With `asChild` it renders its child instead, such as a Pressable, ringed while it holds keyboard focus.
 */
function BubbleContent({
  className,
  asChild = false,
  children,
  onFocus,
  onBlur,
  ...props
}: BubbleContentProps): ReactNode {
  const { variant, align } = useContext(BubbleContext);
  const focus = useFocusVisible();

  const classes = cn(
    'min-w-0 max-w-full self-start overflow-hidden cn-bubble-content',
    CONTENT_VARIANT_CLASSES[variant],
    align === 'end' && 'cn-bubble-content@align=end',
    asChild && focus.focusVisible && 'cn-bubble-content@focused+pressable',
    className,
  );

  let drawn: ReactNode;
  if (asChild) {
    const child = Children.only(children) as ReactElement<{ children?: ReactNode }>;
    drawn = (
      <Slot
        className={classes}
        onFocus={(event: Parameters<NonNullable<BubbleContentProps['onFocus']>>[0]) => {
          focus.onFocus(event);
          onFocus?.(event);
        }}
        onBlur={(event: Parameters<NonNullable<BubbleContentProps['onBlur']>>[0]) => {
          focus.onBlur();
          onBlur?.(event);
        }}
        {...props}
      >
        {isValidElement(child) ? cloneElement(child, undefined, asText(child.props.children)) : child}
      </Slot>
    );
  } else {
    drawn = (
      <View className={classes} onFocus={onFocus} onBlur={onBlur} {...props}>
        {asText(children)}
      </View>
    );
  }

  return (
    <TextClassContext.Provider value={cn('cn-bubble-content/text', CONTENT_VARIANT_TEXT_CLASSES[variant])}>
      {drawn}
    </TextClassContext.Provider>
  );
}

/** How far reactions overlap the edge of their Bubble, as a share of their own height. */
const REACTIONS_OVERLAP = 0.75;

type BubbleReactionsProps = ComponentProps<typeof View> & {
  /** The edge of the bubble the reactions overlap. */
  side?: 'top' | 'bottom';
  /** The end of that edge the reactions sit at. */
  align?: 'start' | 'end';
};

/**
 * A pill of reactions or quick actions overlapping an edge of its Bubble; leave room between bubbles for it.
 * Give a row of emoji `role="img"` and an `aria-label`, so it is read once rather than glyph by glyph. Text
 * given straight to it is set in a Text.
 */
function BubbleReactions({
  side = 'bottom',
  align = 'end',
  className,
  children,
  style,
  onLayout,
  accessible,
  ...props
}: BubbleReactionsProps): ReactNode {
  const [height, setHeight] = useState<number | undefined>(undefined);
  const offset = height === undefined ? undefined : height * REACTIONS_OVERLAP * (side === 'top' ? -1 : 1);
  // React Native replaces a transform rather than merging it, so the caller's goes after the offset in one list.
  const callerTransform = StyleSheet.flatten(style)?.transform;
  const transform = [{ translateY: offset ?? 0 }, ...(Array.isArray(callerTransform) ? callerTransform : [])];

  return (
    <TextClassContext.Provider value="cn-bubble-reactions/text">
      <View
        className={cn(
          'absolute z-10 flex-row items-center justify-center cn-bubble-reactions',
          side === 'top' ? 'cn-bubble-reactions-side-top' : 'cn-bubble-reactions-side-bottom',
          align === 'start' ? 'cn-bubble-reactions-align-start' : 'cn-bubble-reactions-align-end',
          className,
        )}
        // Hidden until measured, so the reactions never show a frame before they overlap the edge.
        style={[style, offset === undefined ? { opacity: 0 } : { transform }]}
        // A named row is read once, by its name, rather than glyph by glyph.
        accessible={accessible ?? (props['aria-label'] !== undefined || undefined)}
        onLayout={(event: LayoutChangeEvent) => {
          setHeight(event.nativeEvent.layout.height);
          onLayout?.(event);
        }}
        {...props}
      >
        {asText(children)}
      </View>
    </TextClassContext.Provider>
  );
}

export { Bubble, BubbleContent, BubbleGroup, BubbleReactions };
export type { BubbleContentProps, BubbleProps, BubbleReactionsProps };
