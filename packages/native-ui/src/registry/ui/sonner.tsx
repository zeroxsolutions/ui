import { CircleCheck, Info, OctagonX, TriangleAlert, X } from 'lucide-react-native';
import {
  isValidElement,
  type ComponentRef,
  useContext,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from 'react';
import {
  AccessibilityInfo,
  AppState,
  Platform,
  Pressable,
  StyleSheet,
  View,
  useWindowDimensions,
  type GestureResponderEvent,
  type KeyDownEvent,
  type LayoutChangeEvent,
} from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { SafeAreaInsetsContext } from 'react-native-safe-area-context';
import { scheduleOnRN } from 'react-native-worklets';
import { useReducedMotion, useSwipeToDismiss, type SwipeDirection as Swipe } from '../lib/motion';
import { textOf } from '../lib/text-children';
import { cn } from '../lib/utils';
import { Icon } from './icon';
import { Spinner } from './spinner';
import { Text, TextClassContext } from './text';

// A `cn-<slot>` token stands for that slot's classes; the registry build replaces each with
// the classes translated for the target engine.

type ToastTypes = 'normal' | 'action' | 'success' | 'info' | 'warning' | 'error' | 'loading' | 'default';
type Position = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'top-center' | 'bottom-center';
type SwipeDirection = 'top' | 'right' | 'bottom' | 'left';
type TitleT = (() => ReactNode) | ReactNode;

/** A button in a toast: its label, and what a press on it does before the toast closes. */
interface Action {
  label: ReactNode;
  onClick: (event: GestureResponderEvent) => void;
}

/** Classes for each part of a toast, merged after the toast's own. */
interface ToastClassnames {
  toast?: string;
  title?: string;
  description?: string;
  loader?: string;
  closeButton?: string;
  cancelButton?: string;
  actionButton?: string;
  success?: string;
  error?: string;
  info?: string;
  warning?: string;
  loading?: string;
  default?: string;
  content?: string;
  icon?: string;
}

interface ToastIcons {
  success?: ReactNode;
  info?: ReactNode;
  warning?: ReactNode;
  error?: ReactNode;
  loading?: ReactNode;
  close?: ReactNode;
}

/** A toast as the queue holds it. */
interface ToastT {
  id: number | string;
  title?: TitleT;
  type?: ToastTypes;
  icon?: ReactNode;
  /** What `toast.custom` draws in place of the toast's own parts. */
  jsx?: ReactNode;
  richColors?: boolean;
  invert?: boolean;
  closeButton?: boolean;
  /** Whether a swipe or the close button can close it; true by default. */
  dismissible?: boolean;
  description?: TitleT;
  /** How long it stays up, in ms; `Infinity` keeps it up until it is dismissed. */
  duration?: number;
  /** Set once it is dismissed, while it goes out. */
  delete?: boolean;
  action?: Action | ReactNode;
  cancel?: Action | ReactNode;
  onDismiss?: (toast: ToastT) => void;
  onAutoClose?: (toast: ToastT) => void;
  unstyled?: boolean;
  className?: string;
  classNames?: ToastClassnames;
  descriptionClassName?: string;
  position?: Position;
  testId?: string;
}

type ExternalToast = Omit<ToastT, 'id' | 'type' | 'title' | 'jsx' | 'delete'> & { id?: number | string };

type PromiseT<Data> = Promise<Data> | (() => Promise<Data>);
type PromiseResult<Data> = ReactNode | ((data: Data) => ReactNode | Promise<ReactNode>);

type PromiseData<Data> = Omit<ExternalToast, 'description'> & {
  loading?: ReactNode;
  success?: PromiseResult<Data>;
  error?: PromiseResult<unknown>;
  description?: PromiseResult<Data>;
  finally?: () => void | Promise<void>;
};

let toastsCounter = 1;
let queue: readonly ToastT[] = [];
const subscribers = new Set<() => void>();

function publish(next: readonly ToastT[]): void {
  queue = next;
  for (const subscriber of subscribers) subscriber();
}

function subscribe(subscriber: () => void): () => void {
  subscribers.add(subscriber);
  return () => {
    subscribers.delete(subscriber);
  };
}

/** Adds a toast, or updates the one with the same id in place, as sonner's `create` does. */
function create(data: ExternalToast & { message?: TitleT; type?: ToastTypes; jsx?: ReactNode }): number | string {
  const { message, id: given, ...rest } = data;
  const id = typeof given === 'number' || (typeof given === 'string' && given.length > 0) ? given : toastsCounter++;
  const dismissible = data.dismissible ?? true;
  const known = queue.find((entry) => entry.id === id);
  if (known) {
    publish(queue.map((entry) => (entry.id === id ? { ...entry, ...rest, id, dismissible, title: message } : entry)));
  } else {
    publish([...queue, { title: message, ...rest, dismissible, id }]);
  }
  return id;
}

/** Marks the toast with `id`, or every toast, to go out; the Toaster removes each once it has gone. */
function dismiss(id?: number | string): number | string | undefined {
  publish(queue.map((entry) => (id === undefined || entry.id === id ? { ...entry, delete: true } : entry)));
  return id;
}

function remove(id: number | string): void {
  publish(queue.filter((entry) => entry.id !== id));
}

async function resultOf<Data>(result: PromiseResult<Data>, data: Data): Promise<ReactNode> {
  return typeof result === 'function' ? result(data) : result;
}

function promise<Data>(source: PromiseT<Data>, data?: PromiseData<Data>): { unwrap: () => Promise<Data> } | undefined {
  if (!data) return undefined;
  const { loading, success, error, description, finally: onFinally, ...options } = data;
  const id =
    loading === undefined
      ? undefined
      : create({
          ...options,
          type: 'loading',
          message: loading,
          description: typeof description === 'function' ? undefined : description,
        });
  const settled = Promise.resolve(typeof source === 'function' ? source() : source);
  const shown = settled
    .then(async (response) => {
      if (success === undefined) {
        if (id !== undefined) dismiss(id);
        return;
      }
      create({
        ...options,
        id,
        type: 'success',
        message: await resultOf(success, response),
        description: description === undefined ? undefined : await resultOf(description, response),
      });
    })
    .catch(async (reason: unknown) => {
      if (error === undefined) {
        if (id !== undefined) dismiss(id);
        return;
      }
      create({
        ...options,
        id,
        type: 'error',
        message: await resultOf(error, reason),
        description:
          description === undefined ? undefined : await resultOf(description as PromiseResult<unknown>, reason),
      });
    })
    .finally(() => onFinally?.());
  void shown;
  return { unwrap: () => settled };
}

/**
 * Raises a toast in the Toaster and returns its id. Pass an `id` to update a toast already up. The type
 * functions raise a toast with that type's icon; `loading` stays up until it is updated or dismissed.
 */
const toast = Object.assign((message: TitleT, data?: ExternalToast) => create({ ...data, message }), {
  message: (message: TitleT, data?: ExternalToast) => create({ ...data, message }),
  success: (message: TitleT, data?: ExternalToast) => create({ ...data, type: 'success', message }),
  info: (message: TitleT, data?: ExternalToast) => create({ ...data, type: 'info', message }),
  warning: (message: TitleT, data?: ExternalToast) => create({ ...data, type: 'warning', message }),
  error: (message: TitleT, data?: ExternalToast) => create({ ...data, type: 'error', message }),
  loading: (message: TitleT, data?: ExternalToast) => create({ ...data, type: 'loading', message }),
  /** Draws what `jsx` returns for the toast's id, in place of the toast's own parts. */
  custom: (jsx: (id: number | string) => ReactNode, data?: ExternalToast) => {
    const id = data?.id ?? toastsCounter++;
    return create({ ...data, id, jsx: jsx(id) });
  },
  /**
   * Shows `loading` while `source` runs, then `success` or `error`, each a node or a function of the result;
   * returns `unwrap`, which gives back the promise.
   */
  promise,
  /** Closes the toast with `id`, or every toast. */
  dismiss,
  getHistory: () => queue,
  getToasts: () => queue.filter((entry) => !entry.delete),
});

/** The toasts that are up, kept current. */
function useSonner(): { toasts: ToastT[] } {
  const all = useSyncExternalStore(subscribe, () => queue);
  return { toasts: all.filter((entry) => !entry.delete) };
}

type Offset =
  | { top?: number | string; right?: number | string; bottom?: number | string; left?: number | string }
  | number
  | string;

interface ToastOptions {
  className?: string;
  closeButton?: boolean;
  descriptionClassName?: string;
  duration?: number;
  unstyled?: boolean;
  classNames?: ToastClassnames;
  closeButtonAriaLabel?: string;
}

interface ToasterProps {
  /** Joins every toast's colours the other way round: dark on a light screen. */
  invert?: boolean;
  /** Where toasts come up; `bottom-right` by default. */
  position?: Position;
  /** The keys that bring focus to the toasts on the web; Alt+T by default. */
  hotkey?: string[];
  /** Colours success, info, warning and error toasts by their type. */
  richColors?: boolean;
  /** Lists the toasts one above another instead of stacking them. */
  expand?: boolean;
  /** How long a toast stays up, in ms; 4000 by default. */
  duration?: number;
  /** The space between expanded toasts, in px; 14 by default. */
  gap?: number;
  /** How many toasts show at once; 3 by default. */
  visibleToasts?: number;
  /** Draws a close button on every toast. */
  closeButton?: boolean;
  toastOptions?: ToastOptions;
  className?: string;
  /** The toasts' distance from the screen's edges where it is wider than 600px; 24px by default. */
  offset?: Offset;
  /** The same distance on a screen 600px wide or less, where a toast is as wide as it less this; 16px by default. */
  mobileOffset?: Offset;
  /** The ways a swipe closes a toast; toward the edge it came from, and its side's, by default. */
  swipeDirections?: SwipeDirection[];
  icons?: ToastIcons;
  /** The toasts' name on the web, before the hotkey; `Notifications` by default. */
  containerAriaLabel?: string;
}

const VISIBLE_TOASTS_AMOUNT = 3;
const VIEWPORT_OFFSET = 24;
const MOBILE_VIEWPORT_OFFSET = 16;
const TOAST_LIFETIME = 4000;
const TOAST_WIDTH = 356;
const GAP = 14;
const MOBILE_WIDTH = 600;
/** How long a touch keeps a stack open on a device after the finger lifts. */
const TOUCH_EXPAND_MS = 4000;

const MOTION = { duration: 400, easing: Easing.bezier(0.25, 0.1, 0.25, 1) } as const;
const EXIT_MOTION = { duration: 200, easing: Easing.bezier(0.25, 0.1, 0.25, 1) } as const;

const WEB = Platform.OS === 'web';

/** The parts of the web's keydown event the hotkey reads. */
interface WebKeyEvent {
  code: string;
  altKey: boolean;
  ctrlKey: boolean;
  metaKey: boolean;
  shiftKey: boolean;
}

/** The part of the web's document the hotkey listens on. */
interface WebDocument {
  addEventListener(type: 'keydown', listener: (event: WebKeyEvent) => void): void;
  removeEventListener(type: 'keydown', listener: (event: WebKeyEvent) => void): void;
}

/** Sonner's own colours for a rich toast of each type, light and dark. */
const RICH_COLOURS: Readonly<Partial<Record<ToastTypes, string>>> = {
  success: 'bg-[hsl(143,85%,96%)] border-[hsl(145,92%,87%)] dark:bg-[hsl(150,100%,6%)] dark:border-[hsl(147,100%,12%)]',
  info: 'bg-[hsl(208,100%,97%)] border-[hsl(221,91%,93%)] dark:bg-[hsl(215,100%,6%)] dark:border-[hsl(223,43%,17%)]',
  warning: 'bg-[hsl(49,100%,97%)] border-[hsl(49,91%,84%)] dark:bg-[hsl(64,100%,6%)] dark:border-[hsl(60,100%,9%)]',
  error: 'bg-[hsl(359,100%,97%)] border-[hsl(359,100%,94%)] dark:bg-[hsl(358,76%,10%)] dark:border-[hsl(357,89%,16%)]',
};

const RICH_TEXT: Readonly<Partial<Record<ToastTypes, string>>> = {
  success: 'text-[hsl(140,100%,27%)] dark:text-[hsl(150,86%,65%)]',
  info: 'text-[hsl(210,92%,45%)] dark:text-[hsl(216,87%,65%)]',
  warning: 'text-[hsl(31,92%,45%)] dark:text-[hsl(46,87%,65%)]',
  error: 'text-[hsl(360,100%,45%)] dark:text-[hsl(358,100%,81%)]',
};

function edgeOffsets(offset: Offset | undefined, fallback: number) {
  const px = (value: number | string | undefined): number =>
    value === undefined ? fallback : typeof value === 'number' ? value : Number.parseFloat(value);
  if (offset === undefined || typeof offset === 'number' || typeof offset === 'string') {
    const all = px(offset);
    return { top: all, right: all, bottom: all, left: all };
  }
  return { top: px(offset.top), right: px(offset.right), bottom: px(offset.bottom), left: px(offset.left) };
}

/** The text a title or a description draws, which a function draws when it is called. */
function wordsOf(node: TitleT): string {
  return textOf(typeof node === 'function' ? node() : node);
}

function isAction(action: unknown): action is Action {
  return typeof action === 'object' && action !== null && !isValidElement(action) && 'onClick' in action;
}

function defaultSwipeDirections(position: Position): SwipeDirection[] {
  const [y, x] = position.split('-') as ['top' | 'bottom', 'left' | 'right' | 'center'];
  return x === 'center' ? [y] : [y, x];
}

interface ToastViewProps {
  toast: ToastT;
  /** How many toasts are newer than this one and still up. */
  before: number;
  expanded: boolean;
  paused: boolean;
  visible: boolean;
  bottom: boolean;
  frontHeight: number;
  /** The heights of the toasts newer than this one, in order, for its place in an expanded list. */
  heightsBefore: number;
  gap: number;
  count: number;
  props: ToasterProps;
  swipeDirections: SwipeDirection[];
  onHeight: (id: number | string, height: number) => void;
}

function ToastView({
  toast: item,
  before,
  expanded,
  paused,
  visible,
  bottom,
  frontHeight,
  heightsBefore,
  gap,
  count,
  props,
  swipeDirections,
  onHeight,
}: ToastViewProps): ReactNode {
  const reduced = useReducedMotion();
  const options = props.toastOptions ?? {};
  const front = before === 0;
  const lift = bottom ? -1 : 1;
  const [height, setHeight] = useState<number>();
  const mounted = useSharedValue(0);
  const y = useSharedValue(0);
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);
  const removing = useRef(false);

  const type = item.type ?? 'default';
  const duration = item.duration ?? options.duration ?? props.duration ?? TOAST_LIFETIME;
  const dismissible = item.dismissible !== false;
  const unstyled = item.unstyled ?? options.unstyled ?? false;
  const classNames = { ...options.classNames, ...item.classNames };
  const swipe = useSwipeToDismiss({
    directions: swipeDirections.map((direction): Swipe =>
      direction === 'top' ? 'up' : direction === 'bottom' ? 'down' : direction,
    ),
    enabled: dismissible,
    onDismiss: () => dismiss(item.id),
    settle: EXIT_MOTION,
    reduced,
  });
  const { x: swipeX, y: swipeY, swiped } = swipe;

  useEffect(() => {
    mounted.value = reduced ? 1 : withTiming(1, MOTION);
  }, [mounted, reduced]);

  // Where the toast sits in the stack: behind the newer ones, or listed above them while expanded.
  useEffect(() => {
    const target = expanded || front ? lift * (expanded ? heightsBefore + gap * before : 0) : lift * gap * before;
    const targetScale = expanded || front ? 1 : 1 - before * 0.05;
    y.value = reduced ? target : withTiming(target, MOTION);
    scale.value = reduced ? targetScale : withTiming(targetScale, MOTION);
  }, [expanded, front, before, heightsBefore, gap, lift, y, scale, reduced]);

  // The time left runs only while the toasts are not held open, and a loading toast has none.
  const remaining = useRef(duration);
  useEffect(() => {
    remaining.current = duration;
  }, [duration, item.title, type]);
  useEffect(() => {
    if (paused || item.delete || type === 'loading' || duration === Number.POSITIVE_INFINITY) return undefined;
    const started = Date.now();
    const timer = setTimeout(() => {
      item.onAutoClose?.(item);
      removing.current = true;
      dismiss(item.id);
    }, remaining.current);
    return () => {
      clearTimeout(timer);
      remaining.current -= Date.now() - started;
    };
  }, [paused, item, type, duration]);

  // A dismissed toast goes out, then leaves the queue; one dismissed by any means but its timer reports it.
  useEffect(() => {
    if (!item.delete) return;
    if (!removing.current) item.onDismiss?.(item);
    removing.current = true;
    const leave = (): void => remove(item.id);
    if (reduced) {
      leave();
      return;
    }
    const done = (finished?: boolean): void => {
      'worklet';
      if (finished === true) scheduleOnRN(leave);
    };
    const size = height ?? frontHeight;
    if (swiped.current === 'left' || swiped.current === 'right') {
      swipeX.value = withTiming(swipeX.value + (swiped.current === 'left' ? -size * 3 : size * 3), EXIT_MOTION);
    } else if (swiped.current) {
      swipeY.value = withTiming(swipeY.value + (swiped.current === 'up' ? -size : size), EXIT_MOTION);
    } else if (front) {
      y.value = withTiming(-lift * size, EXIT_MOTION);
    }
    opacity.value = withTiming(0, EXIT_MOTION, done);
  }, [item.delete]);

  const motion = useAnimatedStyle(() => ({
    opacity: opacity.value * (visible ? 1 : 0) * mounted.value,
    transform: [
      { translateY: y.value + swipeY.value + (1 - mounted.value) * -lift * (frontHeight || 64) },
      { translateX: swipeX.value },
      { scale: scale.value },
    ],
  }));

  const collapsedBehind = !expanded && !front;
  const icon =
    item.icon ??
    (type === 'loading'
      ? (props.icons?.loading ?? <Spinner className={cn('size-4', classNames.loader)} />)
      : type === 'success'
        ? (props.icons?.success ?? <Icon as={CircleCheck} className="size-4" />)
        : type === 'info'
          ? (props.icons?.info ?? <Icon as={Info} className="size-4" />)
          : type === 'warning'
            ? (props.icons?.warning ?? <Icon as={TriangleAlert} className="size-4" />)
            : type === 'error'
              ? (props.icons?.error ?? <Icon as={OctagonX} className="size-4" />)
              : undefined);
  const rich = (item.richColors ?? props.richColors) === true;
  const inverted = (item.invert ?? props.invert) === true;
  const textColour = cn(inverted ? 'text-background' : 'text-popover-foreground', rich && RICH_TEXT[type]);
  const closable = (item.closeButton ?? options.closeButton ?? props.closeButton) === true && dismissible;
  const title = typeof item.title === 'function' ? item.title() : item.title;
  const description = typeof item.description === 'function' ? item.description() : item.description;

  const button = (action: Action | ReactNode, kind: 'action' | 'cancel') => {
    if (!isAction(action)) return action;
    return (
      <Pressable
        role="button"
        onPress={(event) => {
          action.onClick(event);
          dismiss(item.id);
        }}
        className={cn(
          'h-6 shrink-0 flex-row items-center rounded px-2',
          kind === 'action' && (inverted ? 'bg-background' : 'bg-popover-foreground'),
          kind === 'cancel' && 'bg-black/10 dark:bg-white/30',
          kind === 'action' ? classNames.actionButton : classNames.cancelButton,
        )}
      >
        <Text
          className={cn(
            'font-sans-medium text-xs',
            kind === 'action' && (inverted ? 'text-foreground' : 'text-popover'),
            kind === 'cancel' && textColour,
          )}
        >
          {action.label}
        </Text>
      </Pressable>
    );
  };

  return (
    <Animated.View
      pointerEvents={visible ? 'box-none' : 'none'}
      aria-hidden={!visible}
      style={[styles.toast, bottom ? styles.atBottom : styles.atTop, { zIndex: count - before }, motion]}
    >
      <View
        testID={item.testId}
        role={WEB ? 'status' : undefined}
        aria-atomic={WEB ? true : undefined}
        onLayout={(event: LayoutChangeEvent) => {
          if (collapsedBehind) return;
          const measured = event.nativeEvent.layout.height;
          setHeight(measured);
          onHeight(item.id, measured);
        }}
        style={collapsedBehind && frontHeight > 0 ? { height: frontHeight, overflow: 'hidden' } : undefined}
        className={
          item.jsx !== undefined || unstyled
            ? cn(item.className, options.className, classNames.toast)
            : cn(
                'w-full flex-row items-center gap-1.5 rounded-lg border p-4 shadow-lg cn-toast',
                inverted ? 'border-foreground bg-foreground' : 'border-border bg-popover',
                rich && RICH_COLOURS[type],
                options.className,
                item.className,
                classNames.toast,
                classNames[type === 'normal' || type === 'action' ? 'default' : type],
              )
        }
        {...swipe.handlers}
      >
        <TextClassContext.Provider value={textColour}>
          <View
            className={cn('flex-1 flex-row items-center gap-1.5', collapsedBehind && 'opacity-0')}
            pointerEvents={collapsedBehind ? 'none' : 'box-none'}
          >
            {item.jsx ?? (
              <>
                {icon !== undefined && (
                  <View className={cn('-ml-[3px] mr-1 size-4 shrink-0 justify-center', classNames.icon)}>{icon}</View>
                )}
                <View className={cn('flex-1 gap-0.5', classNames.content)}>
                  {title !== undefined && title !== null && (
                    <Text className={cn('font-sans-medium text-[13px] leading-normal', classNames.title)}>{title}</Text>
                  )}
                  {description !== undefined && description !== null && (
                    <Text
                      className={cn(
                        'text-[13px] leading-snug opacity-80',
                        options.descriptionClassName,
                        item.descriptionClassName,
                        classNames.description,
                      )}
                    >
                      {description}
                    </Text>
                  )}
                </View>
                {item.cancel !== undefined && button(item.cancel, 'cancel')}
                {item.action !== undefined && button(item.action, 'action')}
              </>
            )}
          </View>
        </TextClassContext.Provider>
        {closable && (
          <Pressable
            role="button"
            aria-label={options.closeButtonAriaLabel ?? 'Close toast'}
            onPress={() => dismiss(item.id)}
            className={cn(
              'absolute -left-[7px] -top-[7px] size-5 items-center justify-center rounded-full border border-border bg-popover',
              classNames.closeButton,
            )}
          >
            {props.icons?.close ?? <Icon as={X} className="text-popover-foreground size-3" />}
          </Pressable>
        )}
      </View>
    </Animated.View>
  );
}

/**
 * Where toasts come up: put one at the app's root, after its PortalHost, and raise toasts with `toast()` from
 * anywhere. Newer toasts stack in front of older ones, which a pointer over them on the web, or a touch on a
 * device, spreads into a list until Escape, or until one toast or none is left; each closes after its
 * duration, by a swipe toward its edge, or from its buttons. A new toast is read by screen readers: announced
 * on iOS, and from a polite live region on Android and the web.
 */
function Toaster(props: ToasterProps): ReactNode {
  const {
    position = 'bottom-right',
    expand = false,
    visibleToasts = VISIBLE_TOASTS_AMOUNT,
    gap = GAP,
    offset,
    mobileOffset,
    swipeDirections,
    hotkey = ['altKey', 'KeyT'],
    containerAriaLabel = 'Notifications',
    className,
  } = props;
  const all = useSyncExternalStore(subscribe, () => queue);
  const { width } = useWindowDimensions();
  const insets = useContext(SafeAreaInsetsContext);
  const [hovered, setHovered] = useState(false);
  const [touched, setTouched] = useState(false);
  const [active, setActive] = useState(AppState.currentState !== 'background');
  const [heights, setHeights] = useState<ReadonlyMap<number | string, number>>(new Map());
  const container = useRef<ComponentRef<typeof View>>(null);
  const touchTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => setActive(state === 'active'));
    return () => subscription.remove();
  }, []);

  useEffect(() => () => clearTimeout(touchTimer.current), []);

  // iOS reads no live region, so each new or changed toast is announced; Android and the web read the region.
  const announced = useRef(new Map<number | string, string>());
  useEffect(() => {
    for (const entry of all) {
      if (entry.delete) continue;
      const words = [wordsOf(entry.title), wordsOf(entry.description)].filter(Boolean).join(', ');
      if (words.length === 0 || announced.current.get(entry.id) === words) continue;
      announced.current.set(entry.id, words);
      if (Platform.OS === 'ios') AccessibilityInfo.announceForAccessibility(words);
    }
    for (const id of announced.current.keys()) {
      if (!all.some((entry) => entry.id === id)) announced.current.delete(id);
    }
    setHeights((current) => {
      const gone = [...current.keys()].filter((id) => !all.some((entry) => entry.id === id));
      if (gone.length === 0) return current;
      const kept = new Map(current);
      for (const id of gone) kept.delete(id);
      return kept;
    });
  }, [all]);

  // Keyed by the keys, so a hotkey passed as a new array each render keeps one listener.
  const hotkeyKeys = hotkey.join(' ');
  useEffect(() => {
    const page = (globalThis as { document?: WebDocument }).document;
    if (!WEB || page === undefined) return undefined;
    const keys = hotkeyKeys.split(' ');
    const onKeyDown = (event: WebKeyEvent): void => {
      if (!keys.every((key) => event[key as keyof WebKeyEvent] === true || event.code === key)) return;
      setHovered(true);
      container.current?.focus();
    };
    page.addEventListener('keydown', onKeyDown);
    return () => page.removeEventListener('keydown', onKeyDown);
  }, [hotkeyKeys]);

  const collapse = (): void => {
    clearTimeout(touchTimer.current);
    setHovered(false);
    setTouched(false);
  };

  // As upstream's, a stack of one toast or none collapses, so the next stack starts closed.
  const up = all.filter((entry) => !entry.delete);
  useEffect(() => {
    if (up.length <= 1) collapse();
  }, [up.length]);

  const expanded = expand || hovered || touched;
  const paused = hovered || touched || !active;
  const mobile = width <= MOBILE_WIDTH;
  const edges = mobile ? edgeOffsets(mobileOffset, MOBILE_VIEWPORT_OFFSET) : edgeOffsets(offset, VIEWPORT_OFFSET);
  const positions = [...new Set([position, ...all.flatMap((entry) => (entry.position ? [entry.position] : []))])];

  const onHeight = (id: number | string, height: number): void =>
    setHeights((current) => (current.get(id) === height ? current : new Map(current).set(id, height)));

  return (
    <View
      ref={container}
      pointerEvents="box-none"
      style={StyleSheet.absoluteFill}
      aria-live="polite"
      // A key reaches the container only while focus is in it, where upstream's Escape collapses the stack.
      onKeyDown={(event: KeyDownEvent) => {
        if (event.nativeEvent.key === 'Escape') collapse();
      }}
      {...(WEB
        ? {
            role: 'region' as const,
            'aria-label': `${containerAriaLabel} ${hotkey.join('+').replace(/Key/g, '').replace(/Digit/g, '')}`,
            tabIndex: -1 as const,
          }
        : {})}
    >
      {positions.map((at) => {
        const [yEdge, xEdge] = at.split('-') as ['top' | 'bottom', 'left' | 'right' | 'center'];
        const bottom = yEdge === 'bottom';
        // Newest first: the front toast is the last one raised.
        const stack = all.filter((entry) => (entry.position ?? position) === at).reverse();
        if (stack.length === 0) return null;
        const live = stack.filter((entry) => !entry.delete);
        const frontHeight = heights.get(live[0]?.id ?? stack[0].id) ?? 0;
        const toastWidth = mobile ? width - edges.left - edges.right : TOAST_WIDTH;
        const horizontal =
          mobile || xEdge === 'center'
            ? { left: mobile ? edges.left : (width - TOAST_WIDTH) / 2 }
            : xEdge === 'left'
              ? { left: edges.left }
              : { right: edges.right };
        const vertical = bottom
          ? { bottom: edges.bottom + (insets?.bottom ?? 0) }
          : { top: edges.top + (insets?.top ?? 0) };
        return (
          <View
            key={at}
            pointerEvents="box-none"
            className={className}
            style={[styles.stack, horizontal, vertical, { width: toastWidth, height: frontHeight }]}
            onPointerEnter={WEB ? () => setHovered(true) : undefined}
            onPointerMove={WEB ? () => setHovered(true) : undefined}
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
          >
            {stack.map((entry) => {
              const before = live.indexOf(entry);
              const place = before === -1 ? 0 : before;
              const heightsBefore = live.slice(0, place).reduce((sum, newer) => sum + (heights.get(newer.id) ?? 0), 0);
              return (
                <ToastView
                  key={entry.id}
                  toast={entry}
                  before={place}
                  expanded={expanded}
                  paused={paused}
                  visible={entry.delete === true || place < visibleToasts}
                  bottom={bottom}
                  frontHeight={frontHeight}
                  heightsBefore={heightsBefore}
                  gap={gap}
                  count={stack.length}
                  props={props}
                  swipeDirections={swipeDirections ?? defaultSwipeDirections(at)}
                  onHeight={onHeight}
                />
              );
            })}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  stack: { position: 'absolute' },
  toast: { position: 'absolute', left: 0, right: 0 },
  atBottom: { bottom: 0 },
  atTop: { top: 0 },
});

export { Toaster, toast, useSonner };
export type { Action, ExternalToast, Position, ToastClassnames, ToastT, ToasterProps };
