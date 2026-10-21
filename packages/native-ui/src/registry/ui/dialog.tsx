import * as DialogPrimitive from '@rn-primitives/dialog';
import { X } from 'lucide-react-native';
import { createContext, useContext, useId, type ComponentProps, type ReactNode } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle } from 'react-native-reanimated';
import { usePresence } from '../lib/motion';
import { useModalOverlay, usePortalHostCheck } from '../lib/overlay';
import { cn } from '../lib/utils';
import { Button } from './button';
import { Icon } from './icon';
import { Text, TextClassContext } from './text';

// A `cn-<slot>` token stands for that slot's view classes, `cn-<slot>/text` for its text classes; the
// registry build replaces each with the classes translated for the target engine.

/** Upstream's 100ms fade and zoom from 95%, on tw-animate's default `ease`. */
const DIALOG_MOTION = { duration: 100, easing: Easing.bezier(0.25, 0.1, 0.25, 1) } as const;

/**
 * The props that name the content by its title on a device. The web's primitive names it itself, and a key
 * given here, even undefined, would replace the id it passes down.
 */
function dialogLabelledBy(titleId: string | undefined): { 'aria-labelledby'?: string } {
  return Platform.OS === 'web' ? {} : { 'aria-labelledby': titleId };
}

/** The `nativeID` of the open Dialog's DialogTitle, which names its content on Android. */
const DialogTitleIdContext = createContext<string | undefined>(undefined);

type DialogProps = DialogPrimitive.RootProps;

/**
 * A window over the screen that the person deals with before going back to it. It holds its own open state
 * from `defaultOpen`, or follows `open` and reports each change through `onOpenChange`. Holds a
 * DialogTrigger and a DialogContent.
 */
function Dialog({ children, ...props }: DialogProps): ReactNode {
  const titleId = useId();
  return (
    <DialogTitleIdContext.Provider value={titleId}>
      <DialogPrimitive.Root {...props}>{children}</DialogPrimitive.Root>
    </DialogTitleIdContext.Provider>
  );
}

type DialogTriggerProps = DialogPrimitive.TriggerProps;

/** Opens the Dialog when pressed; pass `asChild` to make a Button the trigger. Focus returns here on close. */
function DialogTrigger(props: DialogTriggerProps): ReactNode {
  return <DialogPrimitive.Trigger {...props} />;
}

type DialogPortalProps = DialogPrimitive.PortalProps;

/** Draws its children in the app's PortalHost, or the one `hostName` names, while the Dialog is open. */
function DialogPortal(props: DialogPortalProps): ReactNode {
  return <DialogPrimitive.Portal {...props} />;
}

type DialogCloseProps = DialogPrimitive.CloseProps;

/** Closes the Dialog when pressed; pass `asChild` to make a Button do it. */
function DialogClose(props: DialogCloseProps): ReactNode {
  return <DialogPrimitive.Close {...props} />;
}

type DialogOverlayProps = DialogPrimitive.OverlayProps;

/** The dimmed backdrop behind the content, filling the screen; a press on it closes the Dialog. */
function DialogOverlay({ className, ...props }: DialogOverlayProps): ReactNode {
  return <DialogPrimitive.Overlay className={cn('absolute inset-0 cn-dialog-overlay', className)} {...props} />;
}

type DialogContentProps = DialogPrimitive.ContentProps & {
  /** Draws a ghost close button in the top right corner, named Close. */
  showCloseButton?: boolean;
  /** The `name` of the PortalHost to draw in, when it is not the app's own. */
  portalHost?: string;
};

/**
 * The window itself, centred over a DialogOverlay and 1rem in from the screen's sides, announced as a modal
 * `dialog` named by its DialogTitle. Accessibility focus moves into it as it opens, and the Android back
 * button, the iOS escape gesture and Escape on the web close it, as does a press on the overlay. It fades
 * and zooms in from 95% over 100ms and out the same way, or appears and goes at once when the system asks
 * for reduced motion.
 */
function DialogContent({
  className,
  children,
  showCloseButton = true,
  portalHost,
  ...props
}: DialogContentProps): ReactNode {
  const { open } = DialogPrimitive.useRootContext();
  const titleId = useContext(DialogTitleIdContext);
  const { present, progress, reduced } = usePresence(open, DIALOG_MOTION);
  const fade = useAnimatedStyle(() => ({ opacity: progress.value }));
  const zoom = useAnimatedStyle(() => ({ transform: [{ scale: 0.95 + 0.05 * progress.value }] }));

  const hostCheck = usePortalHostCheck(present, 'Dialog', portalHost);
  // Drawn beside the app's screens, the outermost layer is the one that keeps VoiceOver inside the overlay.
  const modalLayer = useModalOverlay(present);

  if (!present) return null;

  return (
    <DialogPortal hostName={portalHost} forceMount>
      {hostCheck}
      {/* The portal draws outside this tree, so the title's id is handed in again. */}
      <DialogTitleIdContext.Provider value={titleId}>
        {/* Closing, it lets presses through to the screen while it fades. */}
        <Animated.View
          {...modalLayer}
          style={[StyleSheet.absoluteFill, { pointerEvents: open ? 'box-none' : 'none' }, !reduced && fade]}
        >
          <DialogOverlay forceMount />
          <View className="flex-1 items-center justify-center p-4" style={{ pointerEvents: 'box-none' }}>
            <Animated.View style={[{ width: '100%' }, !reduced && zoom]}>
              <TextClassContext.Provider value="cn-dialog-content/text">
                <DialogPrimitive.Content
                  forceMount
                  {...dialogLabelledBy(titleId)}
                  className={cn('cn-dialog-content', className)}
                  {...props}
                >
                  {children}
                  {showCloseButton && (
                    <DialogPrimitive.Close asChild>
                      <Button variant="ghost" size="icon-sm" className="cn-dialog-close" aria-label="Close">
                        <Icon as={X} />
                      </Button>
                    </DialogPrimitive.Close>
                  )}
                </DialogPrimitive.Content>
              </TextClassContext.Provider>
            </Animated.View>
          </View>
        </Animated.View>
      </DialogTitleIdContext.Provider>
    </DialogPortal>
  );
}

type DialogHeaderProps = ComponentProps<typeof View>;

/** The top of a DialogContent, holding its DialogTitle and DialogDescription. */
function DialogHeader({ className, ...props }: DialogHeaderProps): ReactNode {
  return <View className={cn('flex-col cn-dialog-header', className)} {...props} />;
}

type DialogFooterProps = ComponentProps<typeof View> & {
  /** Adds an outline Close button after the children. */
  showCloseButton?: boolean;
};

/** The bottom of a DialogContent, stacking its actions with the first child at the bottom. */
function DialogFooter({ className, showCloseButton = false, children, ...props }: DialogFooterProps): ReactNode {
  return (
    <View className={cn('flex-col-reverse cn-dialog-footer', className)} {...props}>
      {children}
      {showCloseButton && (
        <DialogPrimitive.Close asChild>
          <Button variant="outline">
            <Text>Close</Text>
          </Button>
        </DialogPrimitive.Close>
      )}
    </View>
  );
}

type DialogTitleProps = ComponentProps<typeof Text>;

/** The Dialog's heading, which names its content. */
function DialogTitle({ className, ...props }: DialogTitleProps): ReactNode {
  const titleId = useContext(DialogTitleIdContext);
  const classes = cn('cn-dialog-title/text', className);
  if (Platform.OS === 'web') {
    return (
      <DialogPrimitive.Title asChild>
        <Text role="heading" className={classes} {...props} />
      </DialogPrimitive.Title>
    );
  }
  return <Text role="heading" nativeID={titleId} className={classes} {...props} />;
}

type DialogDescriptionProps = ComponentProps<typeof Text>;

/** The muted text under a DialogTitle saying what the Dialog is for; on the web it describes the content. */
function DialogDescription({ className, ...props }: DialogDescriptionProps): ReactNode {
  const text = <Text className={cn('cn-dialog-description/text', className)} {...props} />;
  return Platform.OS === 'web' ? <DialogPrimitive.Description asChild>{text}</DialogPrimitive.Description> : text;
}

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
};
export type {
  DialogCloseProps,
  DialogContentProps,
  DialogDescriptionProps,
  DialogFooterProps,
  DialogHeaderProps,
  DialogOverlayProps,
  DialogPortalProps,
  DialogProps,
  DialogTitleProps,
  DialogTriggerProps,
};
