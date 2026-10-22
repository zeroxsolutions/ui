import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { createContext, useCallback, useContext, useEffect, useId, useRef, useState, type ReactNode } from 'react';
import {
  Platform,
  View,
  type GestureResponderEvent,
  type KeyDownEvent,
  type LayoutChangeEvent,
  type ViewProps,
} from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { useReducedMotion } from '../lib/motion';
import { cn } from '../lib/utils';
import { Button, type ButtonProps } from './button';
import { Icon } from './icon';

// A `cn-<slot>` token stands for that slot's classes; the registry build replaces each with
// the classes translated for the target engine.

/** What the carousel tells its listeners about. */
type CarouselEvent = 'init' | 'reInit' | 'select' | 'settle' | 'pointerDown' | 'pointerUp';

type CarouselListener = (api: CarouselApi, event: CarouselEvent) => void;

/** The carousel's controls and state, in the shape of Embla's api that upstream hands to `setApi`. */
interface CarouselApi {
  /** Scrolls to the previous snap; `jump` skips the animation. */
  scrollPrev: (jump?: boolean) => void;
  /** Scrolls to the next snap; `jump` skips the animation. */
  scrollNext: (jump?: boolean) => void;
  /** Scrolls to the snap at `index`; `jump` skips the animation. */
  scrollTo: (index: number, jump?: boolean) => void;
  canScrollPrev: () => boolean;
  canScrollNext: () => boolean;
  /** The index of the snap the carousel is at, or moving to. */
  selectedScrollSnap: () => number;
  /** The index of the snap it was at before. */
  previousScrollSnap: () => number;
  /** Each snap as a fraction of the scroll, from 0 to 1. */
  scrollSnapList: () => number[];
  /** Calls `listener` on each `event`; returns the api, so calls chain. */
  on: (event: CarouselEvent, listener: CarouselListener) => CarouselApi;
  off: (event: CarouselEvent, listener: CarouselListener) => CarouselApi;
}

/** The options upstream passes to Embla, as far as this carousel takes them. */
interface CarouselOptions {
  /** Where a slide sits in the view at its snap, `center` by default. */
  align?: 'start' | 'center' | 'end';
  /** Joins the last slide to the first, so either end scrolls on to the other. */
  loop?: boolean;
  /** The snap the carousel starts at, 0 by default. */
  startIndex?: number;
  /** Whether a swipe scrolls the carousel; true by default. */
  watchDrag?: boolean;
  /**
   * `trimSnaps` (the default) drops the snaps past the end of the slides, so the last view is full; `keepSnaps`
   * or `false` keeps a snap for every slide.
   */
  containScroll?: 'trimSnaps' | 'keepSnaps' | false;
}

type CarouselProps = ViewProps & {
  opts?: CarouselOptions;
  orientation?: 'horizontal' | 'vertical';
  /** Called with the carousel's api once it is mounted. */
  setApi?: (api: CarouselApi | undefined) => void;
};

/** Where a slide sits along the row, and how long it is. */
interface SlidePlace {
  offset: number;
  size: number;
}

interface CarouselContextValue {
  api: CarouselApi;
  opts: CarouselOptions | undefined;
  orientation: 'horizontal' | 'vertical';
  scrollPrev: () => void;
  scrollNext: () => void;
  canScrollPrev: boolean;
  canScrollNext: boolean;
}

interface CarouselTrackValue {
  /** How far the row has scrolled, in px; it grows past the slides' length in a loop. */
  scroll: SharedValue<number>;
  /** The slides' total length while they loop, 0 while they do not. */
  loopLength: number;
  setRowSize: (size: number) => void;
  placeSlide: (id: string, place: SlidePlace | undefined) => void;
  responder: ViewProps;
}

const CarouselContext = createContext<CarouselContextValue | null>(null);
const CarouselTrackContext = createContext<CarouselTrackValue | null>(null);

/**
 * The carousel around the calling part: its api, its orientation, and scrolling to the previous and next
 * snap with whether each can.
 * @throws {Error} outside a Carousel
 */
function useCarousel(): CarouselContextValue {
  const context = useContext(CarouselContext);
  if (!context) throw new Error('useCarousel must be used within a <Carousel />');
  return context;
}

function useCarouselTrack(): CarouselTrackValue {
  const context = useContext(CarouselTrackContext);
  if (!context) throw new Error('CarouselContent and CarouselItem must be used within a <Carousel />');
  return context;
}

const WEB = Platform.OS === 'web';

/** How long a scroll to a snap takes. */
const SCROLL_MOTION = { duration: 300, easing: Easing.out(Easing.cubic) } as const;

/** How far a swipe moves before the carousel takes it from a slide's own controls, in px. */
const DRAG_THRESHOLD = 8;

/** The share of the view a swipe has to cover to move on a snap when it ends slowly. */
const SWIPE_SHARE = 0.25;

/** How far ahead of a released swipe the carousel looks for its snap, in ms of the swipe's speed. */
const SWIPE_PROJECTION_MS = 250;

/** `value` wrapped into `[0, length)`. */
function wrap(value: number, length: number): number {
  'worklet';
  return ((value % length) + length) % length;
}

/** The snaps of `slides` in a row `rowSize` long, as Embla aligns and trims them. */
function snapsOf(slides: readonly SlidePlace[], rowSize: number, options: CarouselOptions, loopLength: number) {
  const { align = 'center', containScroll = 'trimSnaps' } = options;
  const aligned = slides.map(({ offset, size }) => {
    if (align === 'start') return offset;
    if (align === 'end') return offset - (rowSize - size);
    return offset - (rowSize - size) / 2;
  });
  if (loopLength > 0) return aligned.map((snap) => wrap(snap, loopLength));
  if (containScroll !== 'trimSnaps') return aligned;
  const last = slides[slides.length - 1];
  const maxScroll = Math.max(0, last.offset + last.size - slides[0].offset - rowSize);
  const trimmed = aligned.map((snap) => Math.min(maxScroll, Math.max(0, snap)));
  return trimmed.filter((snap, index) => index === 0 || snap !== trimmed[index - 1]);
}

/**
 * A row of slides that a swipe or its previous and next buttons scroll through one snap at a time. Holds a
 * CarouselContent of CarouselItems, and a CarouselPrevious and a CarouselNext. On the web it is a region
 * described as a carousel, and the left and right arrow keys move it.
 */
function Carousel({
  orientation = 'horizontal',
  opts,
  setApi,
  className,
  children,
  onKeyDownCapture,
  ...props
}: CarouselProps): ReactNode {
  const options = opts ?? {};
  const vertical = orientation === 'vertical';
  const reduced = useReducedMotion();
  const scroll = useSharedValue(0);
  const [rowSize, setRowSize] = useState<number>();
  const [places, setPlaces] = useState<ReadonlyMap<string, SlidePlace>>(new Map());
  const [selected, setSelected] = useState(options.startIndex ?? 0);
  const previous = useRef(selected);
  const listeners = useRef(new Map<CarouselEvent, Set<CarouselListener>>());
  /** The scroll the row is at, or is animating to. */
  const heading = useRef(0);

  const slides = [...places.values()].sort((a, b) => a.offset - b.offset);
  const contentLength =
    slides.length === 0 ? 0 : slides[slides.length - 1].offset + slides[slides.length - 1].size - slides[0].offset;
  const longest = Math.max(0, ...slides.map((slide) => slide.size));
  const loopLength =
    options.loop === true && rowSize !== undefined && contentLength - longest >= rowSize ? contentLength : 0;
  const snaps = rowSize === undefined || slides.length === 0 ? [] : snapsOf(slides, rowSize, options, loopLength);
  const lastSnap = snaps.length - 1;
  const index = Math.min(selected, Math.max(0, lastSnap));
  const canScrollPrev = loopLength > 0 ? snaps.length > 1 : index > 0;
  const canScrollNext = loopLength > 0 ? snaps.length > 1 : index < lastSnap;
  const maxScroll = snaps.length === 0 ? 0 : (loopLength > 0 ? loopLength : snaps[lastSnap]) || 1;

  // The api is one object for the carousel's life, which reads the latest state through this ref.
  const latest = useRef({ index, snaps, loopLength, canScrollPrev, canScrollNext, maxScroll, reduced });
  latest.current = { index, snaps, loopLength, canScrollPrev, canScrollNext, maxScroll, reduced };

  const [{ api, emit, scrollToSnap }] = useState(() => {
    const emitEvent = (event: CarouselEvent): void => {
      for (const listener of listeners.current.get(event) ?? []) listener(self, event);
    };

    /** Moves to the snap at `target`; in a loop `direction` says which way round, the shorter way when left out. */
    const toSnap = (target: number, jump = false, direction?: 1 | -1): void => {
      const { snaps: list, loopLength: length, reduced: still, index: from } = latest.current;
      if (list.length === 0) return;
      const to = length > 0 ? wrap(target, list.length) : Math.min(list.length - 1, Math.max(0, target));
      let destination = list[to];
      if (length > 0) {
        // Measured from where the row is headed, so a press during a scroll counts from that scroll's end.
        const forward = wrap(list[to] - heading.current, length);
        const back = forward - length;
        const delta = direction === 1 ? forward : direction === -1 ? back : forward <= -back ? forward : back;
        destination = heading.current + delta;
      }
      heading.current = destination;
      cancelAnimation(scroll);
      if (jump || still) scroll.value = destination;
      else {
        scroll.value = withTiming(destination, SCROLL_MOTION, (finished) => {
          if (finished === true) scheduleOnRN(emitEvent, 'settle');
        });
      }
      if (to !== from) {
        previous.current = from;
        latest.current.index = to;
        setSelected(to);
        emitEvent('select');
      }
    };

    const self: CarouselApi = {
      scrollPrev: (jump) => {
        if (latest.current.canScrollPrev) toSnap(latest.current.index - 1, jump, -1);
      },
      scrollNext: (jump) => {
        if (latest.current.canScrollNext) toSnap(latest.current.index + 1, jump, 1);
      },
      scrollTo: (target, jump) => toSnap(target, jump),
      canScrollPrev: () => latest.current.canScrollPrev,
      canScrollNext: () => latest.current.canScrollNext,
      selectedScrollSnap: () => latest.current.index,
      previousScrollSnap: () => previous.current,
      scrollSnapList: () => latest.current.snaps.map((snap) => snap / latest.current.maxScroll),
      on: (event, listener) => {
        const set = listeners.current.get(event) ?? new Set();
        set.add(listener);
        listeners.current.set(event, set);
        return self;
      },
      off: (event, listener) => {
        listeners.current.get(event)?.delete(listener);
        return self;
      },
    };
    return { api: self, emit: emitEvent, scrollToSnap: toSnap };
  });

  useEffect(() => {
    setApi?.(api);
  }, [api, setApi]);

  // A new layout, such as a turned phone, moves the row to its snap's new place at once.
  const initialised = useRef(false);
  const snapKey = snaps.join(',');
  useEffect(() => {
    const list = latest.current.snaps;
    if (list.length === 0) return;
    cancelAnimation(scroll);
    heading.current = list[Math.min(latest.current.index, list.length - 1)];
    scroll.value = heading.current;
    emit(initialised.current ? 'reInit' : 'init');
    initialised.current = true;
  }, [snapKey, scroll, emit]);

  // The swipe in progress: where it started, the scroll it started from, and its last two samples for its speed.
  const touchStart = useRef<{ along: number; across: number } | undefined>(undefined);
  const drag = useRef<{ page: number; scroll: number; samples: Array<{ page: number; time: number }> }>(undefined);
  const along = (event: GestureResponderEvent): number =>
    vertical ? event.nativeEvent.pageY : event.nativeEvent.pageX;
  const across = (event: GestureResponderEvent): number =>
    vertical ? event.nativeEvent.pageX : event.nativeEvent.pageY;

  const settleDrag = (event: GestureResponderEvent | undefined): void => {
    const held = drag.current;
    if (held === undefined) return;
    drag.current = undefined;
    const { snaps: list, loopLength: length, index: from } = latest.current;
    const [before, last] = event === undefined ? [] : held.samples.slice(-2);
    const speed =
      before && last && last.time > before.time ? -(last.page - before.page) / (last.time - before.time) : 0;
    const moved = scroll.value - held.scroll;
    const projected = scroll.value + speed * SWIPE_PROJECTION_MS;
    const distance = (snap: number): number => {
      const raw = projected - snap;
      return length > 0 ? Math.abs(wrap(raw + length / 2, length) - length / 2) : Math.abs(raw);
    };
    let target = list.reduce((best, snap, i) => (distance(snap) < distance(list[best]) ? i : best), 0);
    if (target === from && Math.abs(moved) > (rowSize ?? 0) * SWIPE_SHARE) target = from + Math.sign(moved);
    scrollToSnap(target, false, length > 0 ? (moved >= 0 ? 1 : -1) : undefined);
    emit('pointerUp');
  };

  const responder: ViewProps = {
    onStartShouldSetResponderCapture: (event) => {
      touchStart.current = { along: along(event), across: across(event) };
      return false;
    },
    onMoveShouldSetResponderCapture: (event) => {
      const start = touchStart.current;
      if (options.watchDrag === false || start === undefined || latest.current.snaps.length < 2) return false;
      const moved = Math.abs(along(event) - start.along);
      return moved > DRAG_THRESHOLD && moved > Math.abs(across(event) - start.across);
    },
    onResponderTerminationRequest: () => false,
    onResponderGrant: (event) => {
      cancelAnimation(scroll);
      heading.current = scroll.value;
      drag.current = { page: along(event), scroll: scroll.value, samples: [] };
      emit('pointerDown');
    },
    onResponderMove: (event) => {
      const held = drag.current;
      if (held === undefined) return;
      held.samples = [...held.samples.slice(-1), { page: along(event), time: event.nativeEvent.timestamp }];
      let next = held.scroll - (along(event) - held.page);
      const { snaps: list, loopLength: length } = latest.current;
      if (length === 0 && list.length > 0) {
        // Past either end the row follows the finger at a third of its pace.
        const end = list[list.length - 1];
        if (next < 0) next /= 3;
        else if (next > end) next = end + (next - end) / 3;
      }
      heading.current = next;
      scroll.value = next;
    },
    onResponderRelease: (event) => {
      drag.current?.samples.push({ page: along(event), time: event.nativeEvent.timestamp });
      settleDrag(event);
    },
    onResponderTerminate: () => settleDrag(undefined),
  };

  const placeSlide = useCallback((id: string, place: SlidePlace | undefined) => {
    setPlaces((current) => {
      const known = current.get(id);
      if (place === undefined ? known === undefined : known?.offset === place.offset && known.size === place.size) {
        return current;
      }
      const next = new Map(current);
      if (place === undefined) next.delete(id);
      else next.set(id, place);
      return next;
    });
  }, []);

  const scrollPrev = useCallback(() => api.scrollPrev(), [api]);
  const scrollNext = useCallback(() => api.scrollNext(), [api]);

  const onKeyDown = (event: KeyDownEvent): void => {
    onKeyDownCapture?.(event);
    if (event.nativeEvent.key === 'ArrowLeft') {
      event.preventDefault();
      scrollPrev();
    } else if (event.nativeEvent.key === 'ArrowRight') {
      event.preventDefault();
      scrollNext();
    }
  };

  return (
    <CarouselContext.Provider value={{ api, opts, orientation, scrollPrev, scrollNext, canScrollPrev, canScrollNext }}>
      <CarouselTrackContext.Provider value={{ scroll, loopLength, setRowSize, placeSlide, responder }}>
        <View
          role="region"
          {...(WEB ? { 'aria-roledescription': 'carousel' } : {})}
          className={cn('relative', className)}
          onKeyDownCapture={onKeyDown}
          {...props}
        >
          {children}
        </View>
      </CarouselTrackContext.Provider>
    </CarouselContext.Provider>
  );
}

/** The row of slides, inside the view they scroll through; its props and classes go to the row. */
function CarouselContent({ className, onLayout, ...props }: ViewProps): ReactNode {
  const { orientation } = useCarousel();
  const { scroll, setRowSize, responder } = useCarouselTrack();
  const vertical = orientation === 'vertical';
  const moved = useAnimatedStyle(() =>
    vertical ? { transform: [{ translateY: -scroll.value }] } : { transform: [{ translateX: -scroll.value }] },
  );

  return (
    <View className="overflow-hidden" {...responder}>
      {/* Not every engine styles an Animated.View by its className, so the row is a View inside it. */}
      <Animated.View style={moved}>
        <View
          className={cn('flex', vertical ? '-mt-4 flex-col' : '-ml-4 flex-row', className)}
          onLayout={(event: LayoutChangeEvent) => {
            const { width, height } = event.nativeEvent.layout;
            setRowSize(vertical ? height : width);
            onLayout?.(event);
          }}
          {...props}
        />
      </Animated.View>
    </View>
  );
}

/**
 * One slide, a whole view wide by default; a basis class, such as `basis-1/3`, sets how much of the view it
 * takes. In a loop its content is drawn on the far side of the row when the scroll comes round to it.
 */
function CarouselItem({ className, children, onLayout, ...props }: ViewProps): ReactNode {
  const { orientation } = useCarousel();
  const { scroll, loopLength, placeSlide } = useCarouselTrack();
  const vertical = orientation === 'vertical';
  const id = useId();
  const [place, setPlace] = useState<SlidePlace>();

  useEffect(() => () => placeSlide(id, undefined), [id, placeSlide]);

  const looped = useAnimatedStyle(() => {
    if (loopLength === 0 || place === undefined) {
      return vertical ? { transform: [{ translateY: 0 }] } : { transform: [{ translateX: 0 }] };
    }
    const drawnAt = place.offset - scroll.value;
    const shift = wrap(drawnAt + place.size, loopLength) - place.size - drawnAt;
    return vertical ? { transform: [{ translateY: shift }] } : { transform: [{ translateX: shift }] };
  });

  return (
    <View
      role="group"
      {...(WEB ? { 'aria-roledescription': 'slide' } : {})}
      className={cn('min-w-0 shrink-0 grow-0 basis-full', vertical ? 'pt-4' : 'pl-4', className)}
      onLayout={(event: LayoutChangeEvent) => {
        const { x, y, width, height } = event.nativeEvent.layout;
        const next = vertical ? { offset: y, size: height } : { offset: x, size: width };
        setPlace(next);
        placeSlide(id, next);
        onLayout?.(event);
      }}
      {...props}
    >
      <Animated.View style={looped}>{children}</Animated.View>
    </View>
  );
}

type CarouselButtonProps = Omit<ButtonProps, 'children'>;

/**
 * The button half outside the carousel's start edge, or above it when vertical, that scrolls to the previous
 * snap; it is named "Previous slide", and disabled at the first snap unless the slides loop.
 */
function CarouselPrevious({ className, variant = 'outline', size = 'icon-sm', ...props }: CarouselButtonProps) {
  const { orientation, scrollPrev, canScrollPrev } = useCarousel();
  const vertical = orientation === 'vertical';
  return (
    <View
      pointerEvents="box-none"
      className={cn('absolute', vertical ? '-top-12 inset-x-0 items-center' : 'inset-y-0 -left-12 justify-center')}
    >
      <Button
        variant={variant}
        size={size}
        aria-label="Previous slide"
        className={cn('cn-carousel-previous rounded-full', vertical && 'rotate-90', className)}
        disabled={!canScrollPrev}
        onPress={scrollPrev}
        {...props}
      >
        <Icon as={ChevronLeft} />
      </Button>
    </View>
  );
}

/**
 * The button half outside the carousel's end edge, or below it when vertical, that scrolls to the next snap;
 * it is named "Next slide", and disabled at the last snap unless the slides loop.
 */
function CarouselNext({ className, variant = 'outline', size = 'icon-sm', ...props }: CarouselButtonProps) {
  const { orientation, scrollNext, canScrollNext } = useCarousel();
  const vertical = orientation === 'vertical';
  return (
    <View
      pointerEvents="box-none"
      className={cn('absolute', vertical ? '-bottom-12 inset-x-0 items-center' : 'inset-y-0 -right-12 justify-center')}
    >
      <Button
        variant={variant}
        size={size}
        aria-label="Next slide"
        className={cn('cn-carousel-next rounded-full', vertical && 'rotate-90', className)}
        disabled={!canScrollNext}
        onPress={scrollNext}
        {...props}
      >
        <Icon as={ChevronRight} />
      </Button>
    </View>
  );
}

export { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious, useCarousel };
export type { CarouselApi, CarouselEvent, CarouselOptions, CarouselProps };
