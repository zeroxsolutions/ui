import { ChevronRight } from 'lucide-react-native';
import {
  Children,
  createContext,
  isValidElement,
  useContext,
  useEffect,
  useState,
  type ComponentProps,
  type ReactNode,
} from 'react';
import { View, type LayoutChangeEvent } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { useFocusVisible } from '../lib/focus-visible';
import { usePulse, useReducedMotion } from '../lib/motion';
import { cn } from '../lib/utils';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './collapsible';
import { Icon, IconClassContext } from './icon';
import { Text, TextClassContext } from './text';

// A `cn-<slot>` token stands for that slot's view classes, `cn-<slot>/text` and `cn-<slot>/icon` for its text and
// icon classes, and `cn-<slot>@<state>` for the classes the style puts behind that state, such as
// `@after=trace-title` on an icon that follows a title; the registry build replaces each with the classes
// translated for the target engine.

type TraceStatus = 'running' | 'error' | 'pending';

/** Upstream's `transition-[height] duration-200`, on Tailwind's default transition easing. */
const PANEL_MOTION = { duration: 200, easing: Easing.bezier(0.4, 0, 0.2, 1) } as const;

/** Upstream's `transition-transform`, Tailwind's default 150ms on its default easing. */
const CHEVRON_MOTION = { duration: 150, easing: Easing.bezier(0.4, 0, 0.2, 1) } as const;

/** Whether the TraceCollapsible around a part is open. */
const TraceOpenContext = createContext(false);

/**
 * What a TraceLine inside a TraceCollapsibleTrigger tells it: whether the line failed, which turns the
 * trigger's chevron destructive. Undefined outside a trigger.
 */
const TraceTriggerContext = createContext<((failed: boolean) => void) | undefined>(undefined);

/** The status of the TraceLine around a TraceTitle, which pulses while it is `running`. */
const TraceLineStatusContext = createContext<TraceStatus | undefined>(undefined);

/** Whether a TraceIcon comes after the TraceTitle of its line, which pulls it back towards the title. */
const TraceAfterTitleContext = createContext(false);

/** `node` with each string or number in it drawn as a Text, which a View cannot hold bare. */
function asText(node: ReactNode): ReactNode {
  return typeof node === 'string' || typeof node === 'number' ? <Text>{node}</Text> : node;
}

/**
 * The steps an agent took, one under another: a TraceLine for each, or a TraceCollapsible for a step whose
 * detail opens under it. Put a link around a TraceLine to make a step take a press, and give it `self-start`
 * so it is only as wide as the line.
 */
function Trace({ className, ...props }: ComponentProps<typeof View>): ReactNode {
  return <View className={cn('w-full min-w-0 flex-col cn-trace', className)} {...props} />;
}

type TraceLineProps = ComponentProps<typeof View> & {
  /** `running` pulses the title, `error` turns the line destructive, and `pending` dims it. */
  status?: TraceStatus;
};

/**
 * One step: a TraceIcon, a TraceTitle and a TraceDescription in a row, small and muted, only as wide as they
 * need. Inside a TraceCollapsibleTrigger it names the trigger, and a failed one turns the trigger's chevron
 * destructive.
 */
function TraceLine({ className, status, children, ...props }: TraceLineProps): ReactNode {
  const reportFailed = useContext(TraceTriggerContext);
  const failed = status === 'error';

  useEffect(() => {
    if (!reportFailed) return undefined;
    reportFailed(failed);
    return () => reportFailed(false);
  }, [reportFailed, failed]);

  let afterTitle = false;
  const laidOut = Children.map(children, (child) => {
    const drawn = asText(child);
    const placed = afterTitle ? (
      <TraceAfterTitleContext.Provider value>{drawn}</TraceAfterTitleContext.Provider>
    ) : (
      drawn
    );
    if (isValidElement(child) && child.type === TraceTitle) afterTitle = true;
    return placed;
  });

  return (
    <TraceLineStatusContext.Provider value={status}>
      <TextClassContext.Provider value={cn('text-muted-foreground cn-trace-line/text', failed && 'text-destructive')}>
        <View
          className={cn(
            'max-w-full min-w-0 flex-row items-center cn-trace-line',
            reportFailed ? 'shrink' : 'self-start',
            status === 'pending' && 'opacity-60',
            className,
          )}
          {...props}
        >
          {laidOut}
        </View>
      </TextClassContext.Provider>
    </TraceLineStatusContext.Provider>
  );
}

/** A 16px icon in a TraceLine, in the line's colour, hidden from screen readers. */
function TraceIcon({ className, ...props }: ComponentProps<typeof View>): ReactNode {
  const afterTitle = useContext(TraceAfterTitleContext);
  return (
    <IconClassContext.Provider value="cn-trace-icon/icon">
      <View
        aria-hidden
        className={cn(
          'shrink-0 items-center justify-center cn-trace-icon',
          afterTitle && 'cn-trace-icon@after=trace-title',
          className,
        )}
        {...props}
      />
    </IconClassContext.Provider>
  );
}

/**
 * What the step did, on one line, cut short where the row runs out of room. While its line is `running` it
 * fades to half opacity and back on a loop, and stands still when the person has asked the system to reduce
 * motion.
 */
function TraceTitle({ className, ...props }: ComponentProps<typeof Text>): ReactNode {
  const status = useContext(TraceLineStatusContext);
  const pulseStyle = usePulse(status === 'running');
  return (
    <Animated.View style={[{ minWidth: 0, flexShrink: 1 }, pulseStyle]}>
      <Text numberOfLines={1} className={cn('min-w-0', className)} {...props} />
    </Animated.View>
  );
}

/** A detail after the title, such as how long the step took, fainter than the line and never cut short. */
function TraceDescription({ className, ...props }: ComponentProps<typeof Text>): ReactNode {
  return <Text className={cn('shrink-0 text-muted-foreground/70 tabular-nums', className)} {...props} />;
}

type CollapsibleRootProps = ComponentProps<typeof Collapsible>;

type TraceCollapsibleProps = Omit<CollapsibleRootProps, 'open'> &
  (
    | { open?: undefined }
    | {
        /** Whether the step's detail is open; give it with `onOpenChange` to control the step. */
        open: boolean;
        onOpenChange: NonNullable<CollapsibleRootProps['onOpenChange']>;
      }
  );

/**
 * A step whose detail opens under it: a TraceCollapsibleTrigger and a TraceCollapsibleContent. It holds its own
 * open state from `defaultOpen`, or follows `open`, and reports each press through `onOpenChange`.
 */
function TraceCollapsible({
  className,
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  ...props
}: TraceCollapsibleProps): ReactNode {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);
  const open = openProp ?? uncontrolledOpen;

  return (
    <TraceOpenContext.Provider value={open}>
      <Collapsible
        open={open}
        onOpenChange={(next) => {
          setUncontrolledOpen(next);
          onOpenChange?.(next);
        }}
        className={cn('w-full min-w-0 flex-col', className)}
        {...props}
      />
    </TraceOpenContext.Provider>
  );
}

type TraceCollapsibleTriggerProps = Omit<ComponentProps<typeof CollapsibleTrigger>, 'children'> & {
  /** The TraceLine that names the trigger; the chevron is drawn after it. */
  children?: ReactNode;
};

/**
 * The TraceLine that opens and closes its step's detail, announced as a button with its expanded state and
 * named by the line, with a chevron after it that turns to point down while open. The chevron turns at once
 * when the system asks for reduced motion. It is ringed while it holds focus from a keyboard.
 */
function TraceCollapsibleTrigger({
  className,
  children,
  onFocus,
  onBlur,
  ...props
}: TraceCollapsibleTriggerProps): ReactNode {
  const open = useContext(TraceOpenContext);
  const [failed, setFailed] = useState(false);
  const { focusVisible, onFocus: focusChanged, onBlur: blurred } = useFocusVisible();
  const reduced = useReducedMotion();
  const turn = useSharedValue(open ? 1 : 0);
  const chevronStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${turn.value * 90}deg` }] }));
  const tone = failed ? 'text-destructive' : 'text-muted-foreground';

  useEffect(() => {
    const target = open ? 1 : 0;
    turn.value = reduced ? target : withTiming(target, CHEVRON_MOTION);
  }, [open, reduced, turn]);

  return (
    <TraceTriggerContext.Provider value={setFailed}>
      <CollapsibleTrigger
        className={cn(
          // The transparent border is where the focus ring is drawn; the negative margin keeps it from moving the line.
          '-m-px max-w-full min-w-0 flex-row items-center self-start border border-transparent cn-trace-collapsible-trigger',
          tone,
          focusVisible && 'cn-trace-collapsible-trigger@focused',
          className,
        )}
        onFocus={(event) => {
          focusChanged(event);
          onFocus?.(event);
        }}
        onBlur={(event) => {
          blurred();
          onBlur?.(event);
        }}
        {...props}
      >
        {children}
        <TextClassContext.Provider value={tone}>
          <Animated.View style={chevronStyle}>
            <TraceIcon>
              <Icon as={ChevronRight} />
            </TraceIcon>
          </Animated.View>
        </TextClassContext.Provider>
      </CollapsibleTrigger>
    </TraceTriggerContext.Provider>
  );
}

/**
 * The step's detail, under a line drawn down from the trigger's icon, in muted text. It grows from no height
 * to its own over 200ms as the step opens and shrinks back as it closes, or appears and goes at once when the
 * system asks for reduced motion. Its `className` goes on the box around its children.
 */
function TraceCollapsibleContent({
  className,
  children,
  ...props
}: ComponentProps<typeof CollapsibleContent>): ReactNode {
  const open = useContext(TraceOpenContext);
  const reduced = useReducedMotion();
  // Drawn while open and while the close runs; removed once it has.
  const [mounted, setMounted] = useState(open);
  const progress = useSharedValue(open ? 1 : 0);
  // The height the detail lays itself out at, which the clip grows to; -1 until it has been laid out.
  const contentHeight = useSharedValue(-1);

  useEffect(() => {
    const target = open ? 1 : 0;
    if (open) setMounted(true);
    if (reduced) {
      progress.value = target;
      if (!open) setMounted(false);
      return;
    }
    progress.value = withTiming(target, PANEL_MOTION, (finished) => {
      if (finished === true && target === 0) scheduleOnRN(setMounted, false);
    });
  }, [open, reduced, progress]);

  const clipStyle = useAnimatedStyle(() => {
    if (contentHeight.value < 0) return progress.value === 1 ? {} : { height: 0 };
    return { height: contentHeight.value * progress.value };
  });

  if (!mounted && !open) return null;

  // Measured around the inner box, whose margins lie outside its own height.
  const detail = (
    <View
      onLayout={(event: LayoutChangeEvent) => {
        contentHeight.value = event.nativeEvent.layout.height;
      }}
    >
      <TextClassContext.Provider value="text-muted-foreground cn-trace-collapsible-content-inner/text">
        <View className={cn('min-w-0 cn-trace-collapsible-content-inner', className)}>
          {Children.map(children, asText)}
        </View>
      </TextClassContext.Provider>
    </View>
  );

  // The ported CollapsibleContent is not drawn once its step closes, so the detail shrinks away outside it.
  return (
    <Animated.View style={[{ overflow: 'hidden', minWidth: 0 }, clipStyle]}>
      {open ? (
        <CollapsibleContent {...props}>{detail}</CollapsibleContent>
      ) : (
        <View aria-hidden {...props}>
          {detail}
        </View>
      )}
    </Animated.View>
  );
}

export {
  Trace,
  TraceCollapsible,
  TraceCollapsibleContent,
  TraceCollapsibleTrigger,
  TraceDescription,
  TraceIcon,
  TraceLine,
  TraceTitle,
};
export type { TraceCollapsibleProps, TraceCollapsibleTriggerProps, TraceLineProps, TraceStatus };
