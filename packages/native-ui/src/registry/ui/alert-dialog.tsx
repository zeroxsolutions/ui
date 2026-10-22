import * as AlertDialogPrimitive from '@rn-primitives/alert-dialog';
import {
  Children,
  cloneElement,
  createContext,
  isValidElement,
  useContext,
  useId,
  type ComponentProps,
  type ReactElement,
  type ReactNode,
} from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle } from 'react-native-reanimated';
import { usePresence } from '../lib/motion';
import { useModalOverlay, usePortalHostCheck } from '../lib/overlay';
import { cn } from '../lib/utils';
import { Button } from './button';
import { IconClassContext } from './icon';
import { Text, TextClassContext } from './text';

// A `cn-<slot>` token stands for that slot's view classes, `cn-<slot>/text` and `cn-<slot>/icon` for its
// text and icon classes, and `cn-<slot>@<state>` for the classes the style puts behind that state; the
// registry build replaces each with the classes translated for the target engine.

/** Upstream's 100ms fade and zoom from 95%, on tw-animate's default `ease`. */
const ALERT_DIALOG_MOTION = { duration: 100, easing: Easing.bezier(0.25, 0.1, 0.25, 1) } as const;

/**
 * The props that name the content by its title on a device. The web's primitive names it itself, and a key
 * given here, even undefined, would replace the id it passes down.
 */
function alertDialogLabelledBy(titleId: string | undefined): { 'aria-labelledby'?: string } {
  return Platform.OS === 'web' ? {} : { 'aria-labelledby': titleId };
}

/** The title's `nativeID` on a device; on the web the primitive gives the title its own id. */
function alertDialogTitleId(titleId: string | undefined): { nativeID?: string } {
  return Platform.OS === 'web' ? {} : { nativeID: titleId };
}

type AlertDialogSize = 'default' | 'sm';

/** The open AlertDialog's title `nativeID`, which names its content on Android, and its content's size. */
const AlertDialogContentContext = createContext<{ titleId: string | undefined; size: AlertDialogSize }>({
  titleId: undefined,
  size: 'default',
});

type AlertDialogProps = AlertDialogPrimitive.RootProps;

/**
 * A dialog that interrupts the person to confirm or acknowledge something, which a press outside it does
 * not dismiss. It holds its own open state from `defaultOpen`, or follows `open` and reports each change
 * through `onOpenChange`. Holds an AlertDialogTrigger and an AlertDialogContent.
 */
function AlertDialog({ children, ...props }: AlertDialogProps): ReactNode {
  const titleId = useId();
  return (
    <AlertDialogContentContext.Provider value={{ titleId, size: 'default' }}>
      <AlertDialogPrimitive.Root {...props}>{children}</AlertDialogPrimitive.Root>
    </AlertDialogContentContext.Provider>
  );
}

type AlertDialogTriggerProps = AlertDialogPrimitive.TriggerProps;

/** Opens the AlertDialog when pressed; pass `asChild` to make a Button the trigger. Focus returns here on close. */
function AlertDialogTrigger(props: AlertDialogTriggerProps): ReactNode {
  return <AlertDialogPrimitive.Trigger {...props} />;
}

type AlertDialogPortalProps = AlertDialogPrimitive.PortalProps;

/** Draws its children in the app's PortalHost, or the one `hostName` names, while the AlertDialog is open. */
function AlertDialogPortal(props: AlertDialogPortalProps): ReactNode {
  return <AlertDialogPrimitive.Portal {...props} />;
}

type AlertDialogOverlayProps = AlertDialogPrimitive.OverlayProps;

/** The dimmed backdrop behind the content, filling the screen; a press on it does nothing. */
function AlertDialogOverlay({ className, ...props }: AlertDialogOverlayProps): ReactNode {
  return (
    <AlertDialogPrimitive.Overlay className={cn('absolute inset-0 cn-alert-dialog-overlay', className)} {...props} />
  );
}

type AlertDialogContentProps = AlertDialogPrimitive.ContentProps & {
  /** `sm` sets the footer's two actions side by side; both sizes are as wide as the style's narrow dialog. */
  size?: AlertDialogSize;
  /** The `name` of the PortalHost to draw in, when it is not the app's own. */
  portalHost?: string;
};

/**
 * The dialog itself, centred over an AlertDialogOverlay and 1rem in from the screen's sides, announced as a
 * modal `alertdialog` named by its AlertDialogTitle. Accessibility focus moves into it as it opens. The
 * Android back button, the iOS escape gesture and Escape on the web close it, as does an
 * AlertDialogCancel; a press on the overlay does not. It fades and zooms in from 95% over 100ms and out
 * the same way, or appears and goes at once when the system asks for reduced motion.
 */
function AlertDialogContent({ className, size = 'default', portalHost, ...props }: AlertDialogContentProps): ReactNode {
  const { open } = AlertDialogPrimitive.useRootContext();
  const { titleId } = useContext(AlertDialogContentContext);
  const { present, progress, reduced } = usePresence(open, ALERT_DIALOG_MOTION);
  const fade = useAnimatedStyle(() => ({ opacity: progress.value }));
  const zoom = useAnimatedStyle(() => ({ transform: [{ scale: 0.95 + 0.05 * progress.value }] }));

  const hostCheck = usePortalHostCheck(present, 'AlertDialog', portalHost);
  // Drawn beside the app's screens, the outermost layer is the one that keeps VoiceOver inside the overlay.
  const modalLayer = useModalOverlay(present);

  if (!present) return null;

  return (
    <AlertDialogPortal hostName={portalHost} forceMount>
      {hostCheck}
      {/* The portal draws outside this tree, so the title's id and the size are handed in again. */}
      <AlertDialogContentContext.Provider value={{ titleId, size }}>
        {/* Closing, it lets presses through to the screen while it fades. */}
        <Animated.View
          {...modalLayer}
          style={[StyleSheet.absoluteFill, { pointerEvents: open ? 'box-none' : 'none' }, !reduced && fade]}
        >
          <AlertDialogOverlay forceMount />
          <View className="flex-1 items-center justify-center p-4" style={{ pointerEvents: 'box-none' }}>
            <Animated.View style={[{ width: '100%', alignItems: 'center' }, !reduced && zoom]}>
              <TextClassContext.Provider value="cn-alert-dialog-content/text">
                <AlertDialogPrimitive.Content
                  forceMount
                  {...alertDialogLabelledBy(titleId)}
                  className={cn(
                    'w-full cn-alert-dialog-content',
                    size === 'sm' ? 'cn-alert-dialog-content@size=sm' : 'cn-alert-dialog-content@size=default',
                    className,
                  )}
                  {...props}
                />
              </TextClassContext.Provider>
            </Animated.View>
          </View>
        </Animated.View>
      </AlertDialogContentContext.Provider>
    </AlertDialogPortal>
  );
}

type AlertDialogHeaderProps = ComponentProps<typeof View>;

/** The top of an AlertDialogContent, centring its AlertDialogMedia, AlertDialogTitle and AlertDialogDescription. */
function AlertDialogHeader({ className, ...props }: AlertDialogHeaderProps): ReactNode {
  const textClass = useContext(TextClassContext);
  return (
    <TextClassContext.Provider value={cn(textClass, 'cn-alert-dialog-header/text')}>
      <View className={cn('flex-col cn-alert-dialog-header', className)} {...props} />
    </TextClassContext.Provider>
  );
}

type AlertDialogFooterProps = ComponentProps<typeof View>;

/**
 * The bottom of an AlertDialogContent, holding its AlertDialogCancel and AlertDialogAction. It stacks them
 * with the first child at the bottom, or in a `sm` AlertDialogContent sets them side by side at equal widths.
 */
function AlertDialogFooter({ className, children, ...props }: AlertDialogFooterProps): ReactNode {
  const { size } = useContext(AlertDialogContentContext);
  const row = size === 'sm';
  return (
    <View
      className={cn(row ? 'flex-row gap-2' : 'flex-col-reverse gap-2', 'cn-alert-dialog-footer', className)}
      {...props}
    >
      {row
        ? Children.map(children, (child) =>
            isValidElement<{ className?: string }>(child)
              ? cloneElement(child as ReactElement<{ className?: string }>, {
                  className: cn('flex-1', child.props.className),
                })
              : child,
          )
        : children}
    </View>
  );
}

type AlertDialogMediaProps = ComponentProps<typeof View>;

/** A square tile above the title holding an icon, such as the action's subject. */
function AlertDialogMedia({ className, ...props }: AlertDialogMediaProps): ReactNode {
  return (
    <IconClassContext.Provider value="cn-alert-dialog-media/icon">
      <View className={cn('cn-alert-dialog-media', className)} {...props} />
    </IconClassContext.Provider>
  );
}

type AlertDialogTitleProps = ComponentProps<typeof Text>;

/** The AlertDialog's heading, which names its content. */
function AlertDialogTitle({ className, ...props }: AlertDialogTitleProps): ReactNode {
  const { titleId } = useContext(AlertDialogContentContext);
  return (
    <AlertDialogPrimitive.Title asChild>
      <Text
        role="heading"
        {...alertDialogTitleId(titleId)}
        className={cn('cn-alert-dialog-title/text', className)}
        {...props}
      />
    </AlertDialogPrimitive.Title>
  );
}

type AlertDialogDescriptionProps = ComponentProps<typeof Text>;

/** The muted text under an AlertDialogTitle saying what is at stake; on the web it describes the content. */
function AlertDialogDescription({ className, ...props }: AlertDialogDescriptionProps): ReactNode {
  return (
    <AlertDialogPrimitive.Description asChild>
      <Text className={cn('cn-alert-dialog-description/text', className)} {...props} />
    </AlertDialogPrimitive.Description>
  );
}

type AlertDialogActionProps = ComponentProps<typeof Button>;

/**
 * The Button that does what the AlertDialog asks to confirm. Like upstream's, it does not close the
 * AlertDialog: close it from `onPress` through `open` and `onOpenChange`, once the action has run.
 */
function AlertDialogAction(props: AlertDialogActionProps): ReactNode {
  return <Button {...props} />;
}

type AlertDialogCancelProps = AlertDialogPrimitive.CancelProps &
  Pick<ComponentProps<typeof Button>, 'variant' | 'size'>;

/** An outline Button that closes the AlertDialog without doing anything. */
function AlertDialogCancel({ variant = 'outline', size = 'default', ...props }: AlertDialogCancelProps): ReactNode {
  return (
    <AlertDialogPrimitive.Cancel asChild>
      <Button variant={variant} size={size} {...props} />
    </AlertDialogPrimitive.Cancel>
  );
}

export {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogOverlay,
  AlertDialogPortal,
  AlertDialogTitle,
  AlertDialogTrigger,
};
export type {
  AlertDialogActionProps,
  AlertDialogCancelProps,
  AlertDialogContentProps,
  AlertDialogDescriptionProps,
  AlertDialogFooterProps,
  AlertDialogHeaderProps,
  AlertDialogMediaProps,
  AlertDialogOverlayProps,
  AlertDialogPortalProps,
  AlertDialogProps,
  AlertDialogTitleProps,
  AlertDialogTriggerProps,
};
