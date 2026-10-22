import { Portal } from '@rn-primitives/portal';
import { CircleCheck, Info, OctagonX, TriangleAlert, X } from 'lucide-react-native';
import {
  createContext,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type ComponentProps,
  type ComponentRef,
  type ReactNode,
} from 'react';
import { AccessibilityInfo, AppState, Platform, StyleSheet, View, useWindowDimensions } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { SafeAreaInsetsContext } from 'react-native-safe-area-context';
import { scheduleOnRN } from 'react-native-worklets';
import { useReducedMotion, useSwipeToDismiss, type SwipeDirection } from '../lib/motion';
import { usePortalHostCheck } from '../lib/overlay';
import { cn } from '../lib/utils';
import { Button, type ButtonProps } from './button';
import { Icon } from './icon';
import { Spinner } from './spinner';
import { Text, TextClassContext } from './text';

/** How a screen reader announces a toast: `low` waits its turn, `high` interrupts. */
type ToastPriority = 'low' | 'high';

/** The props of a toast's action button: its label as `children`, and what a press on it does as `onPress`. */
type ToastActionOptions = Omit<ButtonProps, 'children'> & { children?: ReactNode };

/** A toast as its manager holds it. */
interface ToastObject<Data extends object = object> {
  id: string;
  title?: ReactNode;
  /** Its kind, such as `success`, `info`, `warning`, `error` or `loading`, which picks its icon. */
  type?: string;
  description?: ReactNode;
  /** How long it stays up, in ms; the provider's `timeout` when left out, and `0` keeps it up until closed. */
  timeout?: number;
  priority?: ToastPriority;
  /** `ending` once it is closed, while it goes out. */
  transitionStatus?: 'starting' | 'ending';
  /** Counts the times it was updated, or added again with its id. */
  updateKey?: number;
  /** Whether it is hidden behind the provider's `limit` of toasts shown at once. */
  limited?: boolean;
  /** Called when it is closed, by any means. */
  onClose?: () => void;
  /** Called once it has gone out and left the list. */
  onRemove?: () => void;
  /** Draws an action button in it; see {@link ToastActionOptions}. */
  actionProps?: ToastActionOptions;
  /** The app's own data for the toast, which it draws nothing from. */
  data?: Data;
}

type ToastManagerAddOptions<Data extends object = object> = Omit<
  ToastObject<Data>,
  'id' | 'transitionStatus' | 'updateKey' | 'limited'
> & {
  /** The toast's id; adding with the id of a toast that is up updates it in place and restarts its time. */
  id?: string;
};

type ToastManagerUpdateOptions<Data extends object = object> = Omit<ToastManagerAddOptions<Data>, 'id'>;

interface ToastManagerPromiseOptions<Value, Data extends object = object> {
  /** The toast shown while the promise runs, a title or its options; it stays up until the promise settles. */
  loading: string | ToastManagerUpdateOptions<Data>;
  /** What the toast turns into once the promise resolves, or a function of the result giving it. */
  success: string | ToastManagerUpdateOptions<Data> | ((result: Value) => string | ToastManagerUpdateOptions<Data>);
  /** What the toast turns into once the promise rejects, or a function of the reason giving it. */
  error: string | ToastManagerUpdateOptions<Data> | ((error: any) => string | ToastManagerUpdateOptions<Data>); // eslint-disable-line @typescript-eslint/no-explicit-any -- a rejection's reason is untyped, and upstream's type takes `any` here
}

/** Raises, updates and closes toasts, from anywhere; a ToastProvider given it draws them. */
interface ToastManager<Data extends object = object> {
  /** Raises a toast, or updates the one with the same `id` in place, and returns its id. */
  add: <T extends Data = Data>(options: ToastManagerAddOptions<T>) => string;
  /** Closes the toast with `id`, or every toast. */
  close: (id?: string) => void;
  /** Changes the toast with `id`, with options or a function of the toast giving them. */
  update: <T extends Data = Data>(
    id: string,
    updates: ToastManagerUpdateOptions<T> | ((previous: ToastObject<T>) => ToastManagerUpdateOptions<T>),
  ) => void;
  /** Shows `loading` while the promise runs, then `success` or `error`; returns the promise. */
  promise: <Value, T extends Data = Data>(
    promiseValue: Promise<Value>,
    options: ToastManagerPromiseOptions<Value, T>,
  ) => Promise<Value>;
}

/** The list a manager holds, which the parts read and subscribe to; kept beside the manager, off its type. */
interface ToastStore {
  get: () => readonly ToastObject[];
  subscribe: (listener: () => void) => () => void;
  /** Takes a toast that has gone out off the list, and reports it. */
  remove: (id: string) => void;
}

const STORES = new WeakMap<object, ToastStore>();

let toastCounter = 0;

function storeOf(manager: ToastManager): ToastStore {
  const store = STORES.get(manager);
  if (store === undefined) throw new Error('This toast manager was not made by createToastManager.');
  return store;
}

function optionsOf<Data extends object>(
  given: string | ToastManagerUpdateOptions<Data>,
): ToastManagerUpdateOptions<Data> {
  return typeof given === 'string' ? { title: given } : given;
}

/** Makes a manager whose toasts a ToastProvider given it draws; `toast` is the app's own. */
function createToastManager<Data extends object = object>(): ToastManager<Data> {
  let toasts: readonly ToastObject[] = [];
  const listeners = new Set<() => void>();
  const publish = (next: readonly ToastObject[]): void => {
    toasts = next;
    for (const listener of listeners) listener();
  };

  const update: ToastManager<Data>['update'] = (id, updates) => {
    const known = toasts.find((entry) => entry.id === id);
    if (known === undefined) return;
    const changes = typeof updates === 'function' ? updates(known as ToastObject<never>) : updates;
    publish(
      toasts.map((entry) =>
        entry.id === id ? { ...entry, ...changes, updateKey: (entry.updateKey ?? 0) + 1 } : entry,
      ),
    );
  };

  const add: ToastManager<Data>['add'] = (options) => {
    const id = options.id ?? `toast-${++toastCounter}`;
    if (toasts.some((entry) => entry.id === id)) {
      publish(
        toasts.map((entry) =>
          entry.id === id
            ? { ...entry, ...options, id, transitionStatus: undefined, updateKey: (entry.updateKey ?? 0) + 1 }
            : entry,
        ),
      );
    } else {
      publish([{ ...options, id, updateKey: 0 }, ...toasts]);
    }
    return id;
  };

  const close: ToastManager<Data>['close'] = (id) => {
    const closing = toasts.filter(
      (entry) => (id === undefined || entry.id === id) && entry.transitionStatus !== 'ending',
    );
    if (closing.length === 0) return;
    publish(toasts.map((entry) => (closing.includes(entry) ? { ...entry, transitionStatus: 'ending' } : entry)));
    for (const entry of closing) entry.onClose?.();
  };

  const promise: ToastManager<Data>['promise'] = (promiseValue, { loading, success, error }) => {
    const id = add({ timeout: 0, ...optionsOf(loading), type: 'loading' });
    // The result's toast takes the provider's timeout again, unless its options give one.
    promiseValue.then(
      (result) =>
        update(id, {
          timeout: undefined,
          type: 'success',
          ...optionsOf(typeof success === 'function' ? success(result) : success),
        }),
      (reason: unknown) =>
        update(id, {
          timeout: undefined,
          type: 'error',
          ...optionsOf(typeof error === 'function' ? error(reason) : error),
        }),
    );
    return promiseValue;
  };

  const manager: ToastManager<Data> = { add, close, update, promise };
  STORES.set(manager, {
    get: () => toasts,
    subscribe: (listener) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    remove: (id) => {
      const gone = toasts.find((entry) => entry.id === id);
      // A toast added again by its id while it went out stays.
      if (gone === undefined || gone.transitionStatus !== 'ending') return;
      publish(toasts.filter((entry) => entry.id !== id));
      gone.onRemove?.();
    },
  });
  return manager;
}

/** The app's toast manager, which Toaster draws: `toast.add({ title })` raises a toast from anywhere. */
const toast = createToastManager();

/** What the parts read from the ToastProvider around them. */
interface ToastProviderState {
  manager: ToastManager;
  store: ToastStore;
  limit: number;
  timeout: number;
}

const ToastProviderContext = createContext<ToastProviderState | undefined>(undefined);

function useToastProvider(part: string): ToastProviderState {
  const provider = useContext(ToastProviderContext);
  if (provider === undefined) throw new Error(`${part} must be used within a ToastProvider, such as Toaster.`);
  return provider;
}

interface ToastProviderProps {
  /** The manager whose toasts it draws; one of its own when left out, which only useToastManager reaches. */
  toastManager?: ToastManager;
  /** How many toasts show at once; older ones are marked `limited` and hidden. 3 by default. */
  limit?: number;
  /** How long a toast stays up, in ms, unless it gives its own; `0` keeps toasts up until closed. 5000 by default. */
  timeout?: number;
  children?: ReactNode;
}

/** Gives the parts inside it a manager's toasts, with the limit and timeout they are shown with. */
function ToastProvider({ toastManager, limit = 3, timeout = 5000, children }: ToastProviderProps): ReactNode {
  const [own] = useState(() => createToastManager());
  const manager = toastManager ?? own;
  const value = useMemo(() => ({ manager, store: storeOf(manager), limit, timeout }), [manager, limit, timeout]);
  return <ToastProviderContext.Provider value={value}>{children}</ToastProviderContext.Provider>;
}

/** What {@link useToastManager} gives back. */
interface UseToastManagerReturnValue extends ToastManager {
  /** The toasts, newest first, those closing included, each past the limit marked `limited`. */
  toasts: ToastObject[];
}

/** The nearest ToastProvider's toasts, kept current, and its manager's methods. */
function useToastManager(): UseToastManagerReturnValue {
  const { manager, store, limit } = useToastProvider('useToastManager');
  const all = useSyncExternalStore(store.subscribe, store.get);
  const toasts = useMemo(() => {
    let shown = 0;
    return all.map((entry) => {
      if (entry.transitionStatus === 'ending') return entry;
      const limited = shown++ >= limit;
      return limited === (entry.limited === true) ? entry : { ...entry, limited };
    });
  }, [all, limit]);
  return { toasts, ...manager };
}

type ToastPortalProps = {
  children?: ReactNode;
  /** The `name` of the PortalHost to draw in, when it is not the app's own. */
  hostName?: string;
};

/** Draws its children, the toasts' viewport, in the app's PortalHost, above the screen. */
function ToastPortal({ children, hostName }: ToastPortalProps): ReactNode {
  const provider = useContext(ToastProviderContext);
  const name = `toast-portal-${useId()}`;
  const store = provider?.store;
  const count = useSyncExternalStore(store?.subscribe ?? NO_SUBSCRIPTION, () => store?.get().length ?? 0);
  const hostCheck = usePortalHostCheck(count > 0, 'Toast', hostName);
  return (
    <Portal name={name} hostName={hostName}>
      {/* A portal draws its children in the host's tree, outside the provider, so the provider goes with them. */}
      <ToastProviderContext.Provider value={provider}>
        {hostCheck}
        {children}
      </ToastProviderContext.Provider>
    </Portal>
  );
}

function NO_SUBSCRIPTION(): () => void {
  return () => undefined;
}

/** The spread of a toast stack: expanded, and the measured heights the toasts sit by. */
interface ToastViewportState {
  expanded: boolean;
  /** Whether the toasts' time stops: while expanded, and while the app is in the background. */
  paused: boolean;
  /** The toasts shown, newest first: neither closing nor limited. */
  shown: readonly ToastObject[];
  heights: ReadonlyMap<string, number>;
  onHeight: (id: string, height: number) => void;
}

const ToastViewportContext = createContext<ToastViewportState>({
  expanded: false,
  paused: false,
  shown: [],
  heights: new Map(),
  onHeight: () => undefined,
});

/** The room between expanded toasts, and how far each toast behind the front one peeks out, in px. */
const GAP = 12;
const PEEK = 12;
/** The viewport's distance from the screen's edges, and its widest, in px. */
const EDGE = 16;
const MAX_WIDTH = 384;
/** From this width the viewport sits in the screen's corner rather than across its bottom. */
const SM_WIDTH = 640;
/** How long a touch keeps a stack spread on a device after the finger lifts. */
const TOUCH_EXPAND_MS = 4000;

const WEB = Platform.OS === 'web';

/** The parts of the web's keydown event the F6 hotkey reads. */
interface WebKeyEvent {
  key: string;
}

/** The part of a web element the viewport reads to tell whether focus left it. */
interface WebElement {
  contains(other: unknown): boolean;
}

/** The part of the web's blur event the viewport reads: where focus went. */
interface WebBlur {
  relatedTarget?: unknown;
}

/** The part of the web's document the F6 hotkey listens on. */
interface WebDocument {
  addEventListener(type: 'keydown', listener: (event: WebKeyEvent) => void): void;
  removeEventListener(type: 'keydown', listener: (event: WebKeyEvent) => void): void;
}

function textOf(node: ReactNode): string | undefined {
  return typeof node === 'string' || typeof node === 'number' ? String(node) : undefined;
}

type ToastViewportProps = ComponentProps<typeof View>;

/**
 * Where the toasts stack: across the bottom of the screen, 16px in from its edges and at most 384px wide,
 * or in its bottom right corner from 640px wide, above the safe area's bottom inset. A pointer over the
 * stack or focus in it on the web (F6 moves focus there), or a touch on it on a device, spreads it into a
 * list until the pointer or focus leaves; a touch keeps it spread for 4 seconds after the finger lifts. A new toast is read by screen readers: announced on iOS, and from a
 * polite live region on Android and the web.
 */
function ToastViewport({ className, style, children, ...props }: ToastViewportProps): ReactNode {
  const { toasts } = useToastManager();
  const { width } = useWindowDimensions();
  const insets = useContext(SafeAreaInsetsContext);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [touched, setTouched] = useState(false);
  const [active, setActive] = useState(AppState.currentState !== 'background');
  const [heights, setHeights] = useState<ReadonlyMap<string, number>>(new Map());
  const container = useRef<ComponentRef<typeof View>>(null);
  const touchTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => setActive(state === 'active'));
    return () => subscription.remove();
  }, []);

  useEffect(() => () => clearTimeout(touchTimer.current), []);

  // iOS reads no live region, so each new or changed toast is announced there, a high priority one at once.
  const announced = useRef(new Map<string, string>());
  useEffect(() => {
    for (const entry of toasts) {
      if (entry.transitionStatus === 'ending') continue;
      const words = [textOf(entry.title), textOf(entry.description)].filter(Boolean).join(', ');
      if (words.length === 0 || announced.current.get(entry.id) === words) continue;
      announced.current.set(entry.id, words);
      if (Platform.OS === 'ios') {
        AccessibilityInfo.announceForAccessibilityWithOptions(words, { queue: entry.priority !== 'high' });
      }
    }
    for (const id of announced.current.keys()) {
      if (!toasts.some((entry) => entry.id === id)) announced.current.delete(id);
    }
    setHeights((current) => {
      const gone = [...current.keys()].filter((id) => !toasts.some((entry) => entry.id === id));
      if (gone.length === 0) return current;
      const kept = new Map(current);
      for (const id of gone) kept.delete(id);
      return kept;
    });
  }, [toasts]);

  useEffect(() => {
    const page = (globalThis as { document?: WebDocument }).document;
    if (!WEB || page === undefined) return undefined;
    const onKeyDown = (event: WebKeyEvent): void => {
      if (event.key !== 'F6') return;
      container.current?.focus();
    };
    page.addEventListener('keydown', onKeyDown);
    return () => page.removeEventListener('keydown', onKeyDown);
  }, []);

  const shown = useMemo(
    () => toasts.filter((entry) => entry.transitionStatus !== 'ending' && entry.limited !== true),
    [toasts],
  );
  // A viewport with nothing up collapses again, so the next stack starts closed.
  useEffect(() => {
    if (shown.length === 0) {
      setHovered(false);
      setFocused(false);
    }
  }, [shown.length]);

  const expanded = hovered || focused || touched;
  const onHeight = (id: string, height: number): void =>
    setHeights((current) => (current.get(id) === height ? current : new Map(current).set(id, height)));
  const state: ToastViewportState = { expanded, paused: expanded || !active, shown, heights, onHeight };

  const heightOf = (entry: ToastObject): number => heights.get(entry.id) ?? 0;
  const front = shown[0] === undefined ? 0 : heightOf(shown[0]);
  // As tall as the stack, so a finger on any toast lands inside it, which Android needs to deliver the touch.
  const stackHeight = expanded
    ? shown.reduce((sum, entry) => sum + heightOf(entry), 0) + GAP * Math.max(0, shown.length - 1)
    : front + PEEK * Math.max(0, shown.length - 1);
  const viewportWidth = Math.min(MAX_WIDTH, width - EDGE * 2);
  const place =
    width >= SM_WIDTH
      ? { right: EDGE, width: viewportWidth }
      : { left: (width - viewportWidth) / 2, width: viewportWidth };

  return (
    <View
      ref={container}
      pointerEvents="box-none"
      aria-live="polite"
      className={cn('absolute z-50', className)}
      style={[{ bottom: EDGE + (insets?.bottom ?? 0), height: stackHeight }, place, style]}
      // Focus in the stack, from F6 or a tab to a toast's button, spreads it until focus goes elsewhere.
      onFocus={() => setFocused(true)}
      onBlur={(event) => {
        const next = (event.nativeEvent as WebBlur).relatedTarget;
        const stays =
          next !== null &&
          next !== undefined &&
          (container.current as unknown as WebElement | null)?.contains(next) === true;
        if (!stays) setFocused(false);
      }}
      onPointerEnter={WEB ? () => setHovered(true) : undefined}
      onPointerLeave={WEB ? () => setHovered(false) : undefined}
      onTouchStart={
        WEB
          ? undefined
          : () => {
              clearTimeout(touchTimer.current);
              setTouched(true);
            }
      }
      onTouchEnd={
        WEB
          ? undefined
          : () => {
              clearTimeout(touchTimer.current);
              touchTimer.current = setTimeout(() => setTouched(false), TOUCH_EXPAND_MS);
            }
      }
      {...(WEB ? { role: 'region' as const, 'aria-label': 'Notifications', tabIndex: -1 as const } : {})}
      {...props}
    >
      <ToastViewportContext.Provider value={state}>{children}</ToastViewportContext.Provider>
    </View>
  );
}

/** What the parts of one toast read from its root. */
interface ToastRootState {
  toast: ToastObject;
  /** Whether the toast sits behind the front one of a collapsed stack, where its content is hidden. */
  behind: boolean;
  expanded: boolean;
}

const ToastRootContext = createContext<ToastRootState | undefined>(undefined);

function useToastRoot(part: string): ToastRootState {
  const root = useContext(ToastRootContext);
  if (root === undefined) throw new Error(`${part} must be used within a Toast.`);
  return root;
}

/** Upstream's 500ms motion, on its cubic-bezier(0.22, 1, 0.36, 1). */
const MOTION = { duration: 500, easing: Easing.bezier(0.22, 1, 0.36, 1) } as const;

type ToastProps = Omit<ComponentProps<typeof View>, 'children'> & {
  /** The toast it draws, from useToastManager's `toasts`. */
  toast: ToastObject;
  /** The ways a swipe closes it; down and right by default. */
  swipeDirection?: SwipeDirection | SwipeDirection[];
  children?: ReactNode;
};

/**
 * One toast of the stack: the front one in full, each older one behind it 12px higher and 10% smaller, or,
 * while the stack is spread, listed above the newer ones 12px apart. It slides up into place over 500ms and
 * down out of it when closed, or appears and goes at once when the system asks for reduced motion. It
 * closes once its timeout is up, which stops while the stack is spread or the app is in the background, by
 * a swipe one of `swipeDirection`, or from its parts. A toast past the provider's limit is hidden.
 */
function Toast({
  toast: item,
  swipeDirection = ['down', 'right'],
  className,
  children,
  ...props
}: ToastProps): ReactNode {
  const { manager, store, timeout: providerTimeout } = useToastProvider('Toast');
  const { expanded, paused, shown, heights, onHeight } = useContext(ToastViewportContext);
  const reduced = useReducedMotion();
  const ending = item.transitionStatus === 'ending';
  const limited = item.limited === true;
  const [size, setSize] = useState<{ width: number; height: number }>();

  // A toast that is closing keeps the place it last had.
  const place = shown.findIndex((entry) => entry.id === item.id);
  const lastIndex = useRef(0);
  if (place >= 0) lastIndex.current = place;
  const index = place >= 0 ? place : lastIndex.current;
  const behind = index > 0;
  const height = size?.height ?? 0;
  const frontHeight = (shown[0] === undefined ? undefined : heights.get(shown[0].id)) || height;
  const before = shown.slice(0, index).reduce((sum, entry) => sum + (heights.get(entry.id) ?? 0), 0);
  const scale = Math.max(0, 1 - index * 0.1);
  const targetY = expanded ? -(before + index * GAP) : -(index * PEEK) - (1 - scale) * frontHeight;
  const targetScale = expanded ? 1 : scale;

  const entered = useSharedValue(0);
  const y = useSharedValue(targetY);
  const shrink = useSharedValue(targetScale);
  const opacity = useSharedValue(1);
  const swipe = useSwipeToDismiss({
    directions: Array.isArray(swipeDirection) ? swipeDirection : [swipeDirection],
    enabled: !ending,
    onDismiss: () => manager.close(item.id),
    settle: MOTION,
    reduced,
  });

  useEffect(() => {
    entered.value = reduced ? 1 : withTiming(1, MOTION);
  }, [entered, reduced]);

  useEffect(() => {
    y.value = reduced ? targetY : withTiming(targetY, MOTION);
    shrink.value = reduced ? targetScale : withTiming(targetScale, MOTION);
  }, [targetY, targetScale, y, shrink, reduced]);

  useEffect(() => {
    if (ending) return;
    opacity.value = reduced ? (limited ? 0 : 1) : withTiming(limited ? 0 : 1, MOTION);
  }, [limited, ending, opacity, reduced]);

  // The time left runs only while the stack is not spread and the app is in front.
  const timeout = item.timeout ?? providerTimeout;
  const remaining = useRef(timeout);
  useEffect(() => {
    remaining.current = timeout;
  }, [timeout, item.updateKey]);
  useEffect(() => {
    if (paused || ending || timeout === 0) return undefined;
    const started = Date.now();
    const timer = setTimeout(() => manager.close(item.id), remaining.current);
    return () => {
      clearTimeout(timer);
      remaining.current -= Date.now() - started;
    };
  }, [paused, ending, timeout, item.updateKey, item.id, manager]);

  // A closed toast goes out the way it was swiped, or down, or fades if hidden, then leaves the list; one added
  // again by its id while it goes out comes back into place.
  const wentOut = useRef(false);
  useEffect(() => {
    if (!ending) {
      if (!wentOut.current) return;
      wentOut.current = false;
      swipe.swiped.current = undefined;
      swipe.x.value = reduced ? 0 : withTiming(0, MOTION);
      swipe.y.value = reduced ? 0 : withTiming(0, MOTION);
      entered.value = reduced ? 1 : withTiming(1, MOTION);
      opacity.value = reduced ? (limited ? 0 : 1) : withTiming(limited ? 0 : 1, MOTION);
      return;
    }
    wentOut.current = true;
    const leave = (): void => store.remove(item.id);
    if (reduced) {
      leave();
      return;
    }
    const done = (finished?: boolean): void => {
      'worklet';
      if (finished === true) scheduleOnRN(leave);
    };
    const across = (size?.width ?? 0) * 1.5;
    const along = (height || 64) * 1.5;
    const swiped = swipe.swiped.current;
    if (swiped === 'left' || swiped === 'right') {
      swipe.x.value = withTiming(swipe.x.value + (swiped === 'left' ? -across : across), MOTION, done);
    } else if (swiped === 'up' || swiped === 'down') {
      swipe.y.value = withTiming(swipe.y.value + (swiped === 'up' ? -along : along), MOTION, done);
    } else if (limited) {
      opacity.value = withTiming(0, MOTION, done);
    } else {
      entered.value = withTiming(0, MOTION, done);
    }
  }, [ending]);

  const motion = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { translateX: swipe.x.value },
      { translateY: y.value + swipe.y.value + (1 - entered.value) * (height || 64) * 1.5 },
      { scale: shrink.value },
    ],
  }));

  const high = item.priority === 'high';
  const collapsedBehind = behind && !expanded;
  return (
    <Animated.View
      pointerEvents={limited ? 'none' : 'box-none'}
      aria-hidden={limited}
      style={[styles.toast, { zIndex: 1000 - index, transformOrigin: 'bottom' }, !reduced && motion]}
    >
      <View
        role={WEB ? (high ? 'alert' : 'status') : undefined}
        aria-live={high ? 'assertive' : undefined}
        className={cn('border-border bg-popover w-full overflow-hidden rounded-2xl border shadow-lg', className)}
        style={collapsedBehind && frontHeight > 0 ? { height: frontHeight } : undefined}
        {...swipe.handlers}
        {...props}
      >
        <View
          onLayout={(event) => {
            const { width: measuredWidth, height: measured } = event.nativeEvent.layout;
            setSize({ width: measuredWidth, height: measured });
            onHeight(item.id, measured);
          }}
        >
          <TextClassContext.Provider value="text-popover-foreground">
            <ToastRootContext.Provider value={{ toast: item, behind, expanded }}>{children}</ToastRootContext.Provider>
          </TextClassContext.Provider>
        </View>
      </View>
    </Animated.View>
  );
}

type ToastContentProps = ComponentProps<typeof View>;

/** The row of a toast's icon, text and buttons; not drawn while the toast sits behind the front one. */
function ToastContent({ className, ...props }: ToastContentProps): ReactNode {
  const { behind, expanded } = useToastRoot('ToastContent');
  const hidden = behind && !expanded;
  return (
    <View
      pointerEvents={hidden ? 'none' : 'box-none'}
      className={cn('flex-row items-center gap-3 p-4', hidden && 'opacity-0', className)}
      {...props}
    />
  );
}

type ToastTitleProps = ComponentProps<typeof Text>;

/** The toast's title, from its `title` unless given children; nothing without either. */
function ToastTitle({ className, children, ...props }: ToastTitleProps): ReactNode {
  const { toast: item } = useToastRoot('ToastTitle');
  const content = children ?? item.title;
  if (content === undefined || content === null) return null;
  return (
    <Text role="heading" className={cn('font-sans-medium text-sm', className)} {...props}>
      {content}
    </Text>
  );
}

type ToastDescriptionProps = ComponentProps<typeof Text>;

/** The toast's description, muted, from its `description` unless given children; nothing without either. */
function ToastDescription({ className, children, ...props }: ToastDescriptionProps): ReactNode {
  const { toast: item } = useToastRoot('ToastDescription');
  const content = children ?? item.description;
  if (content === undefined || content === null) return null;
  return (
    <Text className={cn('text-muted-foreground text-sm', className)} {...props}>
      {content}
    </Text>
  );
}

type ToastActionProps = ButtonProps;

/**
 * The toast's action, an outline Button from its `actionProps`, which its own props override; nothing when
 * the toast has no action and it is given no children. A press runs the action and leaves the toast up.
 */
function ToastAction({ className, children, variant = 'outline', size = 'sm', ...props }: ToastActionProps): ReactNode {
  const { toast: item } = useToastRoot('ToastAction');
  const { children: label, className: actionClassName, ...action } = item.actionProps ?? {};
  const content = children ?? label;
  if (item.actionProps === undefined && children === undefined) return null;
  return (
    <Button variant={variant} size={size} className={cn('shrink-0', actionClassName, className)} {...action} {...props}>
      {typeof content === 'string' ? <Text>{content}</Text> : content}
    </Button>
  );
}

type ToastCloseProps = ButtonProps;

/** A ghost icon Button, named Close toast, that closes the toast; an X unless given children. */
function ToastClose({
  className,
  children,
  variant = 'ghost',
  size = 'icon-sm',
  onPress,
  ...props
}: ToastCloseProps): ReactNode {
  const { toast: item } = useToastRoot('ToastClose');
  const { manager } = useToastProvider('ToastClose');
  return (
    <Button
      aria-label="Close toast"
      variant={variant}
      size={size}
      className={cn('shrink-0', className)}
      onPress={(event) => {
        onPress?.(event);
        manager.close(item.id);
      }}
      {...props}
    >
      {children ?? <Icon as={X} className="text-muted-foreground" />}
    </Button>
  );
}

/** The icon of a toast's type: a check, an i, a triangle, a red octagon or a spinner; nothing for another. */
function ToastIcon({ type }: { type: string | undefined }): ReactNode {
  const icon =
    type === 'success' ? (
      <Icon as={CircleCheck} className="size-4" />
    ) : type === 'info' ? (
      <Icon as={Info} className="size-4" />
    ) : type === 'warning' ? (
      <Icon as={TriangleAlert} className="size-4" />
    ) : type === 'error' ? (
      <Icon as={OctagonX} className="text-destructive size-4" />
    ) : type === 'loading' ? (
      <Spinner className="size-4" />
    ) : undefined;
  if (icon === undefined) return null;
  return <View className="shrink-0">{icon}</View>;
}

function ToastList(): ReactNode {
  const { toasts } = useToastManager();
  return toasts.map((entry) => (
    <Toast key={entry.id} toast={entry}>
      <ToastContent>
        <ToastIcon type={entry.type} />
        <View className="min-w-0 flex-1 gap-1">
          <ToastTitle />
          <ToastDescription />
        </View>
        <ToastAction />
        <ToastClose />
      </ToastContent>
    </Toast>
  ));
}

/**
 * The toasts of `toastManager`, the app's `toast` by default, drawn above the screen: put one at the app's
 * root, around its screens or after them, with a PortalHost after it, and raise toasts with `toast.add()`
 * from anywhere, or with useToastManager's `add` inside it.
 */
function Toaster({ children, toastManager = toast, ...props }: ToastProviderProps): ReactNode {
  return (
    <ToastProvider toastManager={toastManager} {...props}>
      {children}
      <ToastPortal>
        <ToastViewport>
          <ToastList />
        </ToastViewport>
      </ToastPortal>
    </ToastProvider>
  );
}

const styles = StyleSheet.create({
  toast: { position: 'absolute', left: 0, right: 0, bottom: 0 },
});

export {
  Toaster,
  Toast,
  ToastAction,
  ToastClose,
  ToastContent,
  ToastDescription,
  ToastPortal,
  ToastProvider,
  ToastTitle,
  ToastViewport,
  createToastManager,
  toast,
  useToastManager,
};
export type {
  ToastActionOptions,
  ToastActionProps,
  ToastCloseProps,
  ToastContentProps,
  ToastDescriptionProps,
  ToastManager,
  ToastManagerAddOptions,
  ToastManagerPromiseOptions,
  ToastManagerUpdateOptions,
  ToastObject,
  ToastPortalProps,
  ToastPriority,
  ToastProps,
  ToastProviderProps,
  ToastTitleProps,
  ToastViewportProps,
  UseToastManagerReturnValue,
};
