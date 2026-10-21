import * as SheetPrimitive from '@rn-primitives/dialog';
import { X } from 'lucide-react-native';
import { createContext, useContext, useId, type ComponentProps, type ReactNode } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle } from 'react-native-reanimated';
import { usePresence } from '../lib/motion';
import { usePortalHostCheck } from '../lib/overlay';
import { cn } from '../lib/utils';
import { Button } from './button';
import { Icon } from './icon';
import { Text, TextClassContext } from './text';

// A `cn-<slot>` token stands for that slot's view classes, `cn-<slot>/text` for its text classes, and
// `cn-<slot>@<state>` for the classes the style puts behind that state; the registry build replaces each
// with the classes translated for the target engine.

/** Upstream's 200ms `ease-in-out` transition of the content's opacity and its 2.5rem slide. */
const SHEET_MOTION = { duration: 200, easing: Easing.bezier(0.4, 0, 0.2, 1) } as const;

/** Upstream's 2.5rem the content slides in by from its side, in px at the theme's 16px rem. */
const SHEET_SLIDE = 40;

type SheetSide = 'top' | 'right' | 'bottom' | 'left';

/** The `nativeID` of the open Sheet's SheetTitle, which names its content on Android. */
const SheetTitleIdContext = createContext<string | undefined>(undefined);

/**
 * The props that name the content by its title on a device. The web's primitive names it itself, and a key
 * given here, even undefined, would replace the id it passes down.
 */
function sheetLabelledBy(titleId: string | undefined): { 'aria-labelledby'?: string } {
  return Platform.OS === 'web' ? {} : { 'aria-labelledby': titleId };
}

type SheetProps = SheetPrimitive.RootProps;

/**
 * A panel that slides over the screen from one of its edges, for content that supplements the screen. It
 * holds its own open state from `defaultOpen`, or follows `open` and reports each change through
 * `onOpenChange`. Holds a SheetTrigger and a SheetContent.
 */
function Sheet({ children, ...props }: SheetProps): ReactNode {
  const titleId = useId();
  return (
    <SheetTitleIdContext.Provider value={titleId}>
      <SheetPrimitive.Root {...props}>{children}</SheetPrimitive.Root>
    </SheetTitleIdContext.Provider>
  );
}

type SheetTriggerProps = SheetPrimitive.TriggerProps;

/** Opens the Sheet when pressed; pass `asChild` to make a Button the trigger. Focus returns here on close. */
function SheetTrigger(props: SheetTriggerProps): ReactNode {
  return <SheetPrimitive.Trigger {...props} />;
}

type SheetCloseProps = SheetPrimitive.CloseProps;

/** Closes the Sheet when pressed; pass `asChild` to make a Button do it. */
function SheetClose(props: SheetCloseProps): ReactNode {
  return <SheetPrimitive.Close {...props} />;
}

type SheetContentProps = SheetPrimitive.ContentProps & {
  /** The edge of the screen the panel is attached to and slides in from. */
  side?: SheetSide;
  /** Draws a ghost close button in the top right corner, named Close. */
  showCloseButton?: boolean;
  /** The `name` of the PortalHost to draw in, when it is not the app's own. */
  portalHost?: string;
};

/**
 * The panel itself, over a dimmed overlay: across the top or bottom of the screen at its content's
 * height, or down the left or right side at three quarters of its width. It is announced as a modal
 * `dialog` named by its SheetTitle, and accessibility focus moves into it as it opens. A press on the
 * overlay, the Android back button, the iOS escape gesture and Escape on the web close it. It fades in
 * while sliding 2.5rem in from its side over 200ms and out the same way, or appears and goes at once
 * when the system asks for reduced motion.
 */
function SheetContent({
  className,
  children,
  side = 'right',
  showCloseButton = true,
  portalHost,
  ...props
}: SheetContentProps): ReactNode {
  const { open } = SheetPrimitive.useRootContext();
  const titleId = useContext(SheetTitleIdContext);
  const { present, progress, reduced } = usePresence(open, SHEET_MOTION);
  const fade = useAnimatedStyle(() => ({ opacity: progress.value }));
  const slide = useAnimatedStyle(() => {
    const offset = (1 - progress.value) * SHEET_SLIDE;
    return {
      opacity: progress.value,
      transform:
        side === 'top' || side === 'bottom'
          ? [{ translateY: side === 'top' ? -offset : offset }]
          : [{ translateX: side === 'left' ? -offset : offset }],
    };
  });

  const hostCheck = usePortalHostCheck(present, 'Sheet', portalHost);

  if (!present) return null;

  return (
    <SheetPrimitive.Portal hostName={portalHost} forceMount>
      {hostCheck}
      {/* The portal draws outside this tree, so the title's id is handed in again. */}
      <SheetTitleIdContext.Provider value={titleId}>
        {/* Closing, it lets presses through to the screen while it fades. */}
        <View style={[StyleSheet.absoluteFill, { pointerEvents: open ? 'box-none' : 'none' }]}>
          <Animated.View style={[StyleSheet.absoluteFill, !reduced && fade]}>
            <SheetPrimitive.Overlay forceMount className="cn-sheet-overlay absolute inset-0" />
          </Animated.View>
          <Animated.View style={[StyleSheet.absoluteFill, { pointerEvents: 'box-none' }, !reduced && slide]}>
            <TextClassContext.Provider value="cn-sheet-content/text">
              <SheetPrimitive.Content
                forceMount
                {...sheetLabelledBy(titleId)}
                className={cn(
                  'cn-sheet-content',
                  side === 'top' && 'cn-sheet-content@side=top',
                  side === 'right' && 'cn-sheet-content@side=right',
                  side === 'bottom' && 'cn-sheet-content@side=bottom',
                  side === 'left' && 'cn-sheet-content@side=left',
                  className,
                )}
                {...props}
              >
                {children}
                {showCloseButton && (
                  <SheetPrimitive.Close asChild>
                    <Button variant="ghost" size="icon-sm" className="cn-sheet-close" aria-label="Close">
                      <Icon as={X} />
                    </Button>
                  </SheetPrimitive.Close>
                )}
              </SheetPrimitive.Content>
            </TextClassContext.Provider>
          </Animated.View>
        </View>
      </SheetTitleIdContext.Provider>
    </SheetPrimitive.Portal>
  );
}

type SheetHeaderProps = ComponentProps<typeof View>;

/** The top of a SheetContent, holding its SheetTitle and SheetDescription. */
function SheetHeader({ className, ...props }: SheetHeaderProps): ReactNode {
  return <View className={cn('flex-col cn-sheet-header', className)} {...props} />;
}

type SheetFooterProps = ComponentProps<typeof View>;

/** The bottom of a SheetContent, pushed to the panel's end and stacking its actions. */
function SheetFooter({ className, ...props }: SheetFooterProps): ReactNode {
  return <View className={cn('mt-auto flex-col cn-sheet-footer', className)} {...props} />;
}

type SheetTitleProps = ComponentProps<typeof Text>;

/** The Sheet's heading, which names its content. */
function SheetTitle({ className, ...props }: SheetTitleProps): ReactNode {
  const titleId = useContext(SheetTitleIdContext);
  const classes = cn('cn-sheet-title/text', className);
  if (Platform.OS === 'web') {
    return (
      <SheetPrimitive.Title asChild>
        <Text role="heading" className={classes} {...props} />
      </SheetPrimitive.Title>
    );
  }
  return <Text role="heading" nativeID={titleId} className={classes} {...props} />;
}

type SheetDescriptionProps = ComponentProps<typeof Text>;

/** The muted text under a SheetTitle saying what the Sheet is for; on the web it describes the content. */
function SheetDescription({ className, ...props }: SheetDescriptionProps): ReactNode {
  const text = <Text className={cn('cn-sheet-description/text', className)} {...props} />;
  return Platform.OS === 'web' ? <SheetPrimitive.Description asChild>{text}</SheetPrimitive.Description> : text;
}

export { Sheet, SheetClose, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger };
export type {
  SheetCloseProps,
  SheetContentProps,
  SheetDescriptionProps,
  SheetFooterProps,
  SheetHeaderProps,
  SheetProps,
  SheetTitleProps,
  SheetTriggerProps,
};
