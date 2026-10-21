import { createContext, useContext, useEffect, useRef, type ComponentProps, type ReactNode } from 'react';
import { AccessibilityInfo, Platform, View } from 'react-native';
import { Button } from '../../ui/button';
import { Spinner } from '../../ui/spinner';
import { Text } from '../../ui/text';
import { cn } from '../../lib/utils';

/** Which edge of the screen the toolbar floats at. */
type UnsavedChangesToolbarSide = 'top' | 'bottom';

/**
 * Where saving stands: `default` while there are changes to save, `saving` while a save runs, `error`
 * after one failed, `attention` when the person tries to leave with changes unsaved.
 */
type UnsavedChangesToolbarState = 'default' | 'saving' | 'error' | 'attention';

const UnsavedChangesToolbarContext = createContext<UnsavedChangesToolbarState | null>(null);

function useUnsavedChangesToolbar(): UnsavedChangesToolbarState {
  const state = useContext(UnsavedChangesToolbarContext);
  if (state === null) throw new Error('UnsavedChangesToolbar parts must be used within <UnsavedChangesToolbar>');
  return state;
}

type UnsavedChangesToolbarProps = ComponentProps<typeof View> & {
  /** The screen edge it floats at, 16px in; `bottom` when omitted. */
  side?: UnsavedChangesToolbarSide;
  /** Where saving stands; `default` when omitted. */
  state?: UnsavedChangesToolbarState;
};

/**
 * A toolbar floating at the top or bottom of its parent while a form differs from its saved values, on
 * a popover's surface. It is absolutely positioned, so render it inside a full-screen parent. The
 * caller renders it only while there are changes, and writes every word:
 *
 *   <UnsavedChangesToolbar state={state}>
 *     <UnsavedChangesToolbarMessage>You have unsaved changes.</UnsavedChangesToolbarMessage>
 *     <UnsavedChangesToolbarActions>
 *       <UnsavedChangesToolbarReset onPress={reset}>Reset</UnsavedChangesToolbarReset>
 *       <UnsavedChangesToolbarSave onPress={save}>Save changes</UnsavedChangesToolbarSave>
 *     </UnsavedChangesToolbarActions>
 *   </UnsavedChangesToolbar>
 *
 * `error` and `attention` turn the message destructive, and `attention` the border too.
 */
function UnsavedChangesToolbar({
  side = 'bottom',
  state = 'default',
  className,
  ...props
}: UnsavedChangesToolbarProps): ReactNode {
  return (
    <UnsavedChangesToolbarContext.Provider value={state}>
      <View
        role="group"
        className={cn(
          'bg-popover border-foreground/10 absolute inset-x-4 z-50 flex-row items-center gap-3 rounded-2xl border py-2 pr-2 pl-4 shadow-lg',
          side === 'top' ? 'top-4' : 'bottom-4',
          state === 'attention' && 'border-destructive',
          className,
        )}
        {...props}
      />
    </UnsavedChangesToolbarContext.Provider>
  );
}

type UnsavedChangesToolbarMessageProps = Omit<ComponentProps<typeof Text>, 'children'> & {
  /** What the toolbar says. A string, because a screen reader reads it and the app translates it. */
  children: string;
};

/**
 * What the toolbar says, in a polite live region that Android reads out when it changes. On iOS, where
 * the live region is not read, a change after the first render is passed to
 * AccessibilityInfo.announceForAccessibility instead, so each platform speaks it once. The first
 * message is not announced.
 * @throws {Error} when rendered outside an UnsavedChangesToolbar
 */
function UnsavedChangesToolbarMessage({ className, children, ...props }: UnsavedChangesToolbarMessageProps): ReactNode {
  const state = useUnsavedChangesToolbar();
  const announced = useRef(children);

  useEffect(() => {
    if (announced.current === children) return;
    announced.current = children;
    if (Platform.OS !== 'ios') return;
    AccessibilityInfo.announceForAccessibility(children);
  }, [children]);

  return (
    <Text
      accessibilityLiveRegion="polite"
      className={cn(
        'font-sans-medium min-w-0 flex-1 text-sm',
        (state === 'error' || state === 'attention') && 'text-destructive',
        className,
      )}
      {...props}
    >
      {children}
    </Text>
  );
}

/** The row holding UnsavedChangesToolbarReset and UnsavedChangesToolbarSave. */
function UnsavedChangesToolbarActions({ className, ...props }: ComponentProps<typeof View>): ReactNode {
  return <View className={cn('shrink-0 flex-row items-center gap-2', className)} {...props} />;
}

type UnsavedChangesToolbarActionProps = Omit<ComponentProps<typeof Button>, 'variant' | 'size' | 'children'> & {
  /** The label, drawn in the button's text style. */
  children: string;
};

/**
 * A small ghost Button that puts the saved values back. Disabled while saving. A disabled Pressable
 * stays an accessibility element announced as dimmed, so it is not taken out of the screen reader's order.
 * @throws {Error} when rendered outside an UnsavedChangesToolbar
 */
function UnsavedChangesToolbarReset({ disabled, children, ...props }: UnsavedChangesToolbarActionProps): ReactNode {
  const state = useUnsavedChangesToolbar();
  return (
    <Button variant="ghost" size="sm" disabled={state === 'saving' || disabled} {...props}>
      <Text>{children}</Text>
    </Button>
  );
}

/**
 * A small Button that saves. While saving it is disabled and shows a Spinner before its children, which
 * the caller changes to say so (`Saving...`). It stays an accessibility element, announced as disabled,
 * so a screen reader's focus stays on it; the Spinner is hidden from a screen reader, which hears the
 * message instead.
 * @throws {Error} when rendered outside an UnsavedChangesToolbar
 */
function UnsavedChangesToolbarSave({ disabled, children, ...props }: UnsavedChangesToolbarActionProps): ReactNode {
  const state = useUnsavedChangesToolbar();
  const saving = state === 'saving';
  return (
    <Button size="sm" disabled={saving || disabled} {...props}>
      {saving && (
        <View aria-hidden>
          <Spinner />
        </View>
      )}
      <Text>{children}</Text>
    </Button>
  );
}

export {
  UnsavedChangesToolbar,
  UnsavedChangesToolbarActions,
  UnsavedChangesToolbarMessage,
  UnsavedChangesToolbarReset,
  UnsavedChangesToolbarSave,
};
export type {
  UnsavedChangesToolbarActionProps,
  UnsavedChangesToolbarMessageProps,
  UnsavedChangesToolbarProps,
  UnsavedChangesToolbarSide,
  UnsavedChangesToolbarState,
};
