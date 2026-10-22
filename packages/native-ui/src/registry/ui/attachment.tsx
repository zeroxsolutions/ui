import { Slot } from '@rn-primitives/slot';
import { cva, type VariantProps } from 'class-variance-authority';
import {
  Children,
  createContext,
  isValidElement,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ComponentProps,
  type ReactNode,
} from 'react';
import { Animated, Easing, Platform, Pressable, ScrollView, View, type LayoutChangeEvent } from 'react-native';
import { useMessage } from '../lib/message-context';
import { useReducedMotion } from '../lib/motion';
import { cn } from '../lib/utils';
import { Button } from './button';
import { IconClassContext } from './icon';
import { SpinnerClassContext } from './spinner';
import { Text, TextClassContext } from './text';

// A `cn-<slot>` token stands for that slot's view classes, `cn-<slot>/text` for its text classes,
// `cn-<slot>/icon` for the size it gives an icon, and `cn-<slot>@<state>` for the classes behind that
// state, such as `@slot=attachment-content` on an Attachment that holds an AttachmentContent; the registry
// build replaces each with the classes translated for the target engine.

type AttachmentState = 'idle' | 'uploading' | 'processing' | 'error' | 'done';

const attachmentVariants = cva(
  'relative min-w-0 max-w-full shrink-0 flex-wrap border border-border bg-card cn-attachment',
  {
    variants: {
      size: {
        default: 'cn-attachment-size-default',
        sm: 'cn-attachment-size-sm',
        xs: 'cn-attachment-size-xs',
      },
      orientation: {
        horizontal: 'flex-row items-center cn-attachment-orientation-horizontal',
        vertical: 'flex-col cn-attachment-orientation-vertical',
      },
    },
    defaultVariants: {
      size: 'default',
      orientation: 'horizontal',
    },
  },
);

type AttachmentSize = NonNullable<VariantProps<typeof attachmentVariants>['size']>;
type AttachmentOrientation = NonNullable<VariantProps<typeof attachmentVariants>['orientation']>;

/** The padding each size gives an Attachment holding media, which the content padding refines after it. */
const MEDIA_PADDING: Readonly<Record<AttachmentSize, string>> = {
  default: 'cn-attachment-size-default@slot=attachment-media',
  sm: 'cn-attachment-size-sm@slot=attachment-media',
  xs: 'cn-attachment-size-xs@slot=attachment-media',
};

/** The padding each size gives an Attachment holding content. */
const CONTENT_PADDING: Readonly<Record<AttachmentSize, string>> = {
  default: 'cn-attachment-size-default@slot=attachment-content',
  sm: 'cn-attachment-size-sm@slot=attachment-content',
  xs: 'cn-attachment-size-xs@slot=attachment-content',
};

/** The text classes each size gives an Attachment's text. */
const SIZE_TEXT: Readonly<Record<AttachmentSize, string>> = {
  default: 'cn-attachment-size-default/text',
  sm: 'cn-attachment-size-sm/text',
  xs: 'cn-attachment-size-xs/text',
};

/** What the parts of an Attachment read from it: its state, size and orientation, and which parts it holds. */
const AttachmentContext = createContext<{
  state: AttachmentState;
  size: AttachmentSize;
  orientation: AttachmentOrientation;
  /** Counts a mounted AttachmentMedia, `media`, or AttachmentContent, `content`, in, `1`, or out, `-1`. */
  countPart: (part: 'media' | 'content', change: 1 | -1) => void;
}>({ state: 'done', size: 'default', orientation: 'horizontal', countPart: () => undefined });

/** Counts the part in while it is mounted, before paint, so the Attachment is never drawn with the wrong padding. */
function useCountedPart(part: 'media' | 'content'): void {
  const { countPart } = useContext(AttachmentContext);
  useLayoutEffect(() => {
    countPart(part, 1);
    return () => countPart(part, -1);
  }, [countPart, part]);
}

type AttachmentProps = ComponentProps<typeof View> &
  VariantProps<typeof attachmentVariants> & {
    /** Where the upload is: `idle` dashes the border, `uploading` and `processing` pulse the title, `error` turns it destructive. */
    state?: AttachmentState;
  };

/**
 * A file or an image in a card: an AttachmentMedia, an AttachmentContent with a title and a description, and
 * AttachmentActions, with an optional AttachmentTrigger that takes a press on the whole card. As wide as its
 * content, or `w-full`; `vertical` stacks the media above the content. Inside a Message aligned to the end it
 * sits at the end.
 */
function Attachment({ className, state = 'done', size, orientation, ...props }: AttachmentProps): ReactNode {
  const message = useMessage();
  const drawnSize = size ?? 'default';
  const drawnOrientation = orientation ?? 'horizontal';
  const [counts, setCounts] = useState({ media: 0, content: 0 });
  const countPart = useCallback(
    (part: 'media' | 'content', change: 1 | -1) =>
      setCounts((current) => ({ ...current, [part]: current[part] + change })),
    [],
  );
  const context = useMemo(
    () => ({ state, size: drawnSize, orientation: drawnOrientation, countPart }),
    [state, drawnSize, drawnOrientation, countPart],
  );

  return (
    <AttachmentContext.Provider value={context}>
      <TextClassContext.Provider value={cn('text-card-foreground', SIZE_TEXT[drawnSize])}>
        <View
          className={cn(
            attachmentVariants({ size, orientation }),
            message.align === 'end' ? 'self-end' : 'self-start',
            counts.media > 0 && MEDIA_PADDING[drawnSize],
            counts.content > 0 && CONTENT_PADDING[drawnSize],
            counts.content > 0 &&
              drawnOrientation === 'vertical' &&
              'cn-attachment-orientation-vertical@slot=attachment-content',
            state === 'idle' && 'border-dashed',
            state === 'error' && 'border-destructive/30',
            className,
          )}
          {...props}
        />
      </TextClassContext.Provider>
    </AttachmentContext.Provider>
  );
}

const attachmentMediaVariants = cva(
  'relative aspect-square shrink-0 items-center justify-center overflow-hidden cn-attachment-media',
  {
    variants: {
      variant: {
        icon: '',
        image: 'cn-attachment-media-variant-image',
      },
    },
    defaultVariants: {
      variant: 'icon',
    },
  },
);

type AttachmentMediaProps = ComponentProps<typeof View> & VariantProps<typeof attachmentMediaVariants>;

/**
 * The square at the start of an Attachment, or across its top when vertical, holding an Icon, a Spinner or
 * an image. `image` dims the image until the upload is done; size the image `size-full`.
 */
function AttachmentMedia({ className, variant = 'icon', ...props }: AttachmentMediaProps): ReactNode {
  const { state, size, orientation } = useContext(AttachmentContext);
  const vertical = orientation === 'vertical';
  useCountedPart('media');

  return (
    <TextClassContext.Provider value={state === 'error' ? 'text-destructive' : 'cn-attachment-media/text'}>
      <IconClassContext.Provider
        value={cn(
          'cn-attachment-media/icon',
          size === 'xs' && 'cn-attachment-media/icon@size=xs',
          vertical && 'cn-attachment-media/icon@orientation=vertical',
        )}
      >
        <SpinnerClassContext.Provider
          value={vertical ? 'cn-attachment-media@orientation=vertical+part=spinner' : undefined}
        >
          <View
            className={cn(
              attachmentMediaVariants({ variant }),
              size === 'sm' && 'cn-attachment-media@size=sm',
              size === 'xs' && 'cn-attachment-media@size=xs',
              vertical && 'cn-attachment-media@orientation=vertical',
              state === 'error' && 'bg-destructive/10',
              variant === 'image' && state === 'idle' && 'cn-attachment-media-variant-image@state=idle',
              variant === 'image' && state === 'done' && 'cn-attachment-media-variant-image@state=done',
              className,
            )}
            {...props}
          />
        </SpinnerClassContext.Provider>
      </IconClassContext.Provider>
    </TextClassContext.Provider>
  );
}

/** The title and description of an Attachment, in the width its media and actions leave. */
function AttachmentContent({ className, ...props }: ComponentProps<typeof View>): ReactNode {
  const { orientation } = useContext(AttachmentContext);
  const textClass = useContext(TextClassContext);
  useCountedPart('content');

  return (
    <TextClassContext.Provider value={cn(textClass, 'cn-attachment-content/text')}>
      <View
        className={cn(
          'min-w-0 max-w-full cn-attachment-content',
          orientation === 'vertical' ? 'cn-attachment-content@orientation=vertical' : 'shrink grow',
          className,
        )}
        {...props}
      />
    </TextClassContext.Provider>
  );
}

const SHIMMER_HALF_CYCLE_MS = 1000;
const SHIMMER_LOW_OPACITY = 0.5;

/**
 * The file's name, on one line. While the attachment is `uploading` or `processing` it fades to half
 * opacity and back on a loop, and stands still when the person has asked the system to reduce motion.
 */
function AttachmentTitle({ className, ...props }: ComponentProps<typeof Text>): ReactNode {
  const { state } = useContext(AttachmentContext);
  const reduced = useReducedMotion();
  const pulsing = (state === 'uploading' || state === 'processing') && !reduced;
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!pulsing) return undefined;
    const fadeTo = (toValue: number): Animated.CompositeAnimation =>
      Animated.timing(opacity, {
        toValue,
        duration: SHIMMER_HALF_CYCLE_MS,
        easing: Easing.bezier(0.4, 0, 0.6, 1),
        useNativeDriver: Platform.OS !== 'web',
      });
    const pulse = Animated.loop(Animated.sequence([fadeTo(SHIMMER_LOW_OPACITY), fadeTo(1)]));
    pulse.start();
    return () => {
      pulse.stop();
      opacity.setValue(1);
    };
  }, [pulsing, opacity]);

  return (
    <Animated.View style={pulsing ? { opacity } : undefined}>
      <Text numberOfLines={1} className={cn('cn-attachment-title/text', className)} {...props} />
    </Animated.View>
  );
}

/** The file's type, size or upload status under its title, muted and on one line; destructive once the upload failed. */
function AttachmentDescription({ className, ...props }: ComponentProps<typeof Text>): ReactNode {
  const { state } = useContext(AttachmentContext);
  return (
    <Text
      numberOfLines={1}
      className={cn(
        'text-muted-foreground cn-attachment-description cn-attachment-description/text',
        state === 'error' && 'text-destructive/80',
        className,
      )}
      {...props}
    />
  );
}

/** The buttons at the end of an Attachment, above its trigger; over the media's top end when vertical. */
function AttachmentActions({ className, ...props }: ComponentProps<typeof View>): ReactNode {
  const { orientation } = useContext(AttachmentContext);
  return (
    <View
      className={cn(
        'shrink-0 flex-row items-center cn-attachment-actions',
        orientation === 'vertical' && 'cn-attachment-actions@orientation=vertical',
        className,
      )}
      {...props}
    />
  );
}

/** A ghost icon Button in AttachmentActions; give it an `aria-label`, since it holds only an icon. */
function AttachmentAction({ variant, size = 'icon-xs', ...props }: ComponentProps<typeof Button>): ReactNode {
  return <Button variant={variant ?? 'ghost'} size={size} {...props} />;
}

type AttachmentTriggerProps = ComponentProps<typeof Pressable> & {
  /** Renders the single child in place of a Pressable, such as a link, with the trigger's props and classes merged onto it. */
  asChild?: boolean;
};

/**
 * A press area over the whole Attachment, under its actions, that opens it, such as in a dialog or a link;
 * a `button` unless `asChild` renders another element. Name it with an `aria-label`, such as "Open report.pdf".
 */
function AttachmentTrigger({ className, asChild = false, ...props }: AttachmentTriggerProps): ReactNode {
  const Component = asChild ? Slot : Pressable;
  return (
    <Component role={asChild ? undefined : 'button'} className={cn('cn-attachment-trigger', className)} {...props} />
  );
}

/** The padding the group scrolls each attachment in from, upstream's `scroll-px-1`, in px. */
const SNAP_INSET = 4;

/**
 * A row of attachments that scrolls sideways, coming to rest with an attachment at its start. Give it
 * `aria-label` when its attachments take no press, so the row can be named.
 */
function AttachmentGroup({
  className,
  contentContainerClassName,
  children,
  ...props
}: ComponentProps<typeof ScrollView>): ReactNode {
  const [starts, setStarts] = useState<Readonly<Record<number, number>>>({});
  const items = Children.toArray(children);
  const offsets = items.flatMap((_, index) => {
    const start = starts[index];
    return start === undefined ? [] : [Math.max(0, start - SNAP_INSET)];
  });
  const web = Platform.OS === 'web';

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      // The web's own scroll snapping holds each attachment's start, as upstream's does; a device snaps to
      // the measured starts.
      pagingEnabled={web}
      snapToOffsets={web ? undefined : offsets}
      decelerationRate={web ? undefined : 'fast'}
      className={cn('min-w-0 grow-0', className)}
      contentContainerClassName={cn('flex-row cn-attachment-group', contentContainerClassName)}
      {...props}
    >
      {items.map((child, index) => (
        <View
          key={isValidElement(child) && child.key !== null ? child.key : index}
          onLayout={(event: LayoutChangeEvent) => {
            const { x } = event.nativeEvent.layout;
            setStarts((current) => (current[index] === x ? current : { ...current, [index]: x }));
          }}
        >
          {child}
        </View>
      ))}
    </ScrollView>
  );
}

export {
  Attachment,
  AttachmentAction,
  AttachmentActions,
  AttachmentContent,
  AttachmentDescription,
  AttachmentGroup,
  AttachmentMedia,
  AttachmentTitle,
  AttachmentTrigger,
};
export type { AttachmentMediaProps, AttachmentProps, AttachmentTriggerProps };
