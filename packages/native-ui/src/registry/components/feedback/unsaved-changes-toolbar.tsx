import {
  createContext,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  type ComponentProps,
  type ReactNode,
} from 'react';
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

interface UnsavedChangesToolbarContextValue {
  state: UnsavedChangesToolbarState;
  /** The `nativeID` of the message, which names the group. */
  messageId: string;
}

const UnsavedChangesToolbarContext = createContext<UnsavedChangesToolbarContextValue | null>(null);

function useUnsavedChangesToolbar(): UnsavedChangesToolbarContextValue {
  const context = useContext(UnsavedChangesToolbarContext);
  if (context === null) throw new Error('UnsavedChangesToolbar parts must be used within <UnsavedChangesToolbar>');
  return context;
}

type UnsavedChangesToolbarProps = ComponentProps<typeof View> & {
  /** The screen edge it floats at, 16px in; `bottom` when omitted. */
  side?: UnsavedChangesToolbarSide;
  /** Where saving stands; `default` when omitted. */
  state?: UnsavedChangesToolbarState;
};

/**
 * A toolbar floating at the top or bottom of its parent while a form differs from its saved values, on
 * a popover's surface, centred and at most `max-w-lg` wide. It is absolutely positioned, so render it
 * inside a full-screen parent. A screen reader reads it as a group named by its message, unless you pass
 * `aria-labelledby`, `aria-label` or `accessibilityLabel`. The caller renders it only while there are changes, and writes
 * every word. A `testID` goes to the group, and `<testID>-wrapper` to the box that places it:
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
  testID,
  ...props
}: UnsavedChangesToolbarProps): ReactNode {
  const messageId = useId();
  const named = props.accessibilityLabel !== undefined || props['aria-label'] !== undefined;
  const context = useMemo(() => ({ state, messageId }), [state, messageId]);
  return (
    <UnsavedChangesToolbarContext.Provider value={context}>
      <View
        pointerEvents="box-none"
        className={cn('absolute inset-x-4 z-50 items-center', side === 'top' ? 'top-4' : 'bottom-4')}
        testID={testID === undefined ? undefined : `${testID}-wrapper`}
      >
        <View
          role="group"
          aria-labelledby={named ? undefined : messageId}
          testID={testID}
          className={cn(
            'bg-popover border-foreground/10 w-full max-w-lg flex-row items-center gap-3 rounded-2xl border py-2 pr-2 pl-4 shadow-lg',
            state === 'attention' && 'border-destructive',
            className,
          )}
          {...props}
        />
      </View>
    </UnsavedChangesToolbarContext.Provider>
  );
}

type UnsavedChangesToolbarMessageProps = Omit<ComponentProps<typeof Text>, 'children'> & {
  /** What the toolbar says. A string, because a screen reader reads it and the app translates it. */
  children: string;
};

/**
 * What the toolbar says, and the name of its group. It is announced through
 * AccessibilityInfo.announceForAccessibility when it first renders and, on iOS, each time it changes.
 * Android reads a change from the message's polite live region instead, which iOS does not read, so each
 * platform speaks a change once.
 * @throws {Error} when rendered outside an UnsavedChangesToolbar
 */
function UnsavedChangesToolbarMessage({ className, children, ...props }: UnsavedChangesToolbarMessageProps): ReactNode {
  const { state, messageId } = useUnsavedChangesToolbar();
  const mounted = useRef(false);

  useEffect(() => {
    const first = !mounted.current;
    mounted.current = true;
    if (first || Platform.OS === 'ios') AccessibilityInfo.announceForAccessibility(children);
  }, [children]);

  return (
    <Text
      nativeID={messageId}
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
  const { state } = useUnsavedChangesToolbar();
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
  const { state } = useUnsavedChangesToolbar();
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
