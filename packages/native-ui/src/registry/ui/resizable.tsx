import {
  Children,
  Fragment,
  createContext,
  isValidElement,
  useContext,
  useId,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  useState,
  type ComponentRef,
  type ReactNode,
  type Ref,
} from 'react';
import {
  Dimensions,
  Platform,
  View,
  type AccessibilityActionEvent,
  type GestureResponderEvent,
  type KeyDownEvent,
  type LayoutChangeEvent,
  type ViewProps,
  type ViewStyle,
} from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, type SharedValue } from 'react-native-reanimated';
import { useFocusVisible } from '../lib/focus-visible';
import { cn } from '../lib/utils';
import { useDirectionSides } from './direction';

// A `cn-<slot>` token stands for that slot's classes; the registry build replaces each with
// the classes translated for the target engine.

/** Each panel's size, by its id, as a percentage of the group (0 to 100). */
type ResizableLayout = { [panelId: string]: number };

/** What `onLayoutChanged` passes beside the layout. */
interface ResizableLayoutChangedMeta {
  /** True for a drag released, a key pressed or a screen reader's adjustment; false for a call or a new size. */
  isUserInteraction: boolean;
}

/** A panel's size, as a percentage of the group and in px. */
interface ResizablePanelSize {
  asPercentage: number;
  inPixels: number;
}

/**
 * A size: a number is px; a string is a percentage, with or without `%`, unless it ends in `px`, `rem`,
 * `em`, `vh` or `vw`.
 */
type ResizableSize = number | string;

/** What a group's `groupRef` holds. */
interface ResizableGroupImperativeHandle {
  /** Each panel's size, by its id, as a percentage of the group. */
  getLayout: () => ResizableLayout;
  /** Sets each panel's size, by its id, held to the panels' limits; returns the layout applied. */
  setLayout: (layout: ResizableLayout) => ResizableLayout;
}

/** What a panel's `panelRef` holds. */
interface ResizablePanelImperativeHandle {
  /** Collapses a `collapsible` panel to its `collapsedSize`; does nothing to any other. */
  collapse: () => void;
  /** Opens a collapsed panel to the size it had before it collapsed, or its `minSize`. */
  expand: () => void;
  getSize: () => ResizablePanelSize;
  isCollapsed: () => boolean;
  /** Resizes the panel, held to its limits and its neighbours'; a number is px, as `defaultSize`'s is. */
  resize: (size: ResizableSize) => void;
}

type ResizableGroupResizeBehavior = 'preserve-relative-size' | 'preserve-pixel-size';

/** A panel's limits as percentages of the group, as the layout math reads them. */
interface Limits {
  collapsedSize: number;
  collapsible: boolean;
  defaultSize: number | undefined;
  disabled: boolean;
  minSize: number;
  maxSize: number;
  keepsPixels: boolean;
}

/** A panel as it registers with its group: its place among the group's children and its props. */
interface PanelEntry {
  id: string;
  /** The id the panel was given, which `onResize` passes back; undefined when it took a generated one. */
  givenId: string | number | undefined;
  order: number;
  collapsedSize: ResizableSize | undefined;
  collapsible: boolean;
  defaultSize: ResizableSize | undefined;
  disabled: boolean;
  maxSize: ResizableSize | undefined;
  minSize: ResizableSize | undefined;
  groupResizeBehavior: ResizableGroupResizeBehavior;
  onResize: ResizablePanelProps['onResize'];
  /** The size `onResize` last reported. */
  reported: ResizablePanelSize | undefined;
  /** The size the panel had before it last collapsed, which it opens back to. */
  expandTo: number | undefined;
}

/** A handle as it registers with its group, so F6 can move focus along the handles. */
interface HandleEntry {
  order: number;
  focus: () => void;
  /** Its thickness across the group's direction, in px, which the panels' share leaves out. */
  thickness: number;
}

type ViewInstance = ComponentRef<typeof View>;

/** How the layout math was asked to move a handle, which decides how a collapsible panel snaps. */
type Trigger = 'keyboard' | 'pointer' | 'imperative';

/** How far an arrow key moves a handle, in percent of the group. */
const KEY_STEP = 5;

/** The longest gap between two taps on a handle that makes a double tap, in ms. */
const DOUBLE_TAP_MS = 300;

/** The px a `rem` or an `em` stands for; React Native has no root font size to read it from. */
const ROOT_FONT_SIZE = 16;

/** `value` rounded to the thousandth, as the layout compares sizes. */
function rounded(value: number): number {
  return parseFloat(value.toFixed(3));
}

function near(a: number, b: number, within = 0): boolean {
  return Math.abs(rounded(a) - rounded(b)) <= within;
}

function compare(a: number, b: number): number {
  if (near(a, b)) return 0;
  return a > b ? 1 : -1;
}

function sameEntries<T>(a: readonly T[], b: readonly T[]): boolean {
  return a.length === b.length && a.every((entry, index) => entry === b[index]);
}

/** `size` in px, or undefined for a percentage while the group's size is unknown. */
function pixelsOf(size: ResizableSize, groupSize: number | undefined): number | undefined {
  if (typeof size === 'number') return size;
  const amount = parseFloat(size);
  if (size.endsWith('px')) return amount;
  if (size.endsWith('rem') || size.endsWith('em')) return amount * ROOT_FONT_SIZE;
  if (size.endsWith('vh')) return (amount / 100) * Dimensions.get('window').height;
  if (size.endsWith('vw')) return (amount / 100) * Dimensions.get('window').width;
  return groupSize === undefined ? undefined : (amount / 100) * groupSize;
}

/** `size` as a percentage of a group `groupSize` px long; a percentage needs no size, any other unit does. */
function percentOf(size: ResizableSize | undefined, groupSize: number | undefined): number | undefined {
  if (size === undefined) return undefined;
  if (typeof size === 'string' && !/(px|em|vh|vw)$/.test(size)) return rounded(parseFloat(size));
  const pixels = pixelsOf(size, groupSize);
  if (pixels === undefined || groupSize === undefined || groupSize <= 0) return undefined;
  return rounded((pixels / groupSize) * 100);
}

function limitsOf(entry: PanelEntry, groupSize: number | undefined): Limits {
  return {
    collapsedSize: percentOf(entry.collapsedSize, groupSize) ?? 0,
    collapsible: entry.collapsible,
    defaultSize: percentOf(entry.defaultSize, groupSize),
    disabled: entry.disabled,
    minSize: percentOf(entry.minSize, groupSize) ?? 0,
    maxSize: percentOf(entry.maxSize, groupSize) ?? 100,
    keepsPixels: entry.groupResizeBehavior === 'preserve-pixel-size',
  };
}

/**
 * `size` held to a panel's limits: below its minimum a collapsible panel snaps to collapsed or to the minimum,
 * whichever is nearer, and any other stops at the minimum. A disabled panel keeps `previous` unless `override`.
 */
function heldSize(limits: Limits, previous: number, size: number, override: boolean): number {
  if (limits.disabled && !override) return previous;
  let next = size;
  if (compare(next, limits.minSize) < 0) {
    if (limits.collapsible) {
      next = compare(next, (limits.collapsedSize + limits.minSize) / 2) < 0 ? limits.collapsedSize : limits.minSize;
    } else {
      next = limits.minSize;
    }
  }
  return rounded(Math.min(limits.maxSize, next));
}

interface Adjustment {
  /** How far to move the handle, in percent: growing the panel before it when positive. */
  delta: number;
  /** The layout the move is measured from: where a drag started, or the current one. */
  initial: readonly number[];
  limits: readonly Limits[];
  /** The indices of the panels either side of the handle. */
  pivots: readonly [number, number];
  /** The current layout, given back when the move changes nothing or breaks the limits. */
  previous: readonly number[];
  trigger: Trigger;
}

/**
 * The layout with the handle between `pivots` moved by `delta`, as react-resizable-panels moves it: the
 * panels on the shrinking side give up room in turn, nearest first, each down to its limit, and the panel
 * on the growing side takes it, passing what it cannot hold on to the panels beyond it.
 */
function adjusted({ delta: asked, initial, limits, pivots, previous, trigger }: Adjustment): readonly number[] {
  if (near(asked, 0)) return initial;
  const [first, second] = pivots;
  const override = trigger === 'imperative';
  const next = [...initial];
  let delta = asked;

  if (trigger === 'keyboard') {
    // One key press opens a collapsed panel to its minimum, or collapses one at its minimum.
    const opening = delta < 0 ? second : first;
    if (limits[opening].collapsible && near(initial[opening], limits[opening].collapsedSize)) {
      const gap = limits[opening].minSize - initial[opening];
      if (compare(gap, Math.abs(delta)) > 0) delta = delta < 0 ? -gap : gap;
    }
    const closing = delta < 0 ? first : second;
    if (limits[closing].collapsible && near(initial[closing], limits[closing].minSize)) {
      const gap = initial[closing] - limits[closing].collapsedSize;
      if (compare(gap, Math.abs(delta)) > 0) delta = delta < 0 ? -gap : gap;
    }
  } else {
    // A collapsed panel dragged open stays collapsed until the drag passes half its way to its minimum.
    const growing = delta < 0 ? second : first;
    const { collapsible, collapsedSize, minSize } = limits[growing];
    const size = initial[growing];
    if (collapsible && compare(size, minSize) < 0) {
      const gap = minSize - collapsedSize;
      if (delta > 0) {
        if (compare(size + delta, minSize) < 0) delta = compare(delta, gap / 2) <= 0 ? 0 : gap;
      } else if (compare(size - delta, minSize) < 0) {
        delta = compare(100 + delta, 100 - gap / 2) > 0 ? 0 : -gap;
      }
    }
  }

  {
    const step = delta < 0 ? 1 : -1;
    let room = 0;
    for (let index = delta < 0 ? second : first; index >= 0 && index < limits.length; index += step) {
      room += heldSize(limits[index], initial[index], 100, override) - initial[index];
    }
    const allowed = Math.min(Math.abs(delta), Math.abs(room));
    delta = delta < 0 ? -allowed : allowed;
  }

  let taken = 0;
  for (let index = delta < 0 ? first : second; index >= 0 && index < limits.length; index += delta < 0 ? -1 : 1) {
    const size = initial[index];
    const shrunk = heldSize(limits[index], size, size - (Math.abs(delta) - Math.abs(taken)), override);
    if (!near(size, shrunk)) {
      taken += size - shrunk;
      next[index] = shrunk;
      if (rounded(taken) >= rounded(Math.abs(delta))) break;
    }
  }
  if (sameEntries(previous, next)) return previous;

  const growing = delta < 0 ? second : first;
  const wanted = initial[growing] + taken;
  next[growing] = heldSize(limits[growing], initial[growing], wanted, override);
  let rest = wanted - next[growing];
  for (let index = growing; !near(rest, 0) && index >= 0 && index < limits.length; index += delta > 0 ? -1 : 1) {
    const size = next[index];
    const held = heldSize(limits[index], size, size + rest, override);
    if (!near(size, held)) {
      rest -= held - size;
      next[index] = held;
    }
  }

  const total = next.reduce((sum, size) => sum + size, 0);
  return near(total, 100, 0.1) ? next : previous;
}

/** `layout` scaled to add up to 100 and held to every panel's limits, the room it frees given to the others. */
function validated(layout: readonly number[], limits: readonly Limits[]): readonly number[] {
  const total = layout.reduce((sum, size) => sum + size, 0);
  const next = layout.map((size) => (near(total, 100) || total === 0 ? size : (100 / total) * size));
  let rest = 0;
  next.forEach((size, index) => {
    const held = heldSize(limits[index], layout[index], size, true);
    if (held !== size) {
      rest += size - held;
      next[index] = held;
    }
  });
  for (let index = 0; !near(rest, 0) && index < next.length; index += 1) {
    const size = next[index];
    const held = heldSize(limits[index], size, size + rest, true);
    if (held !== size) {
      rest -= held - size;
      next[index] = held;
    }
  }
  return next;
}

/** Each panel's `defaultSize`, the room the others leave split evenly between the panels with none. */
function defaultLayout(limits: readonly Limits[]): readonly number[] {
  const given = limits.filter((entry) => entry.defaultSize !== undefined);
  const taken = given.reduce((sum, entry) => sum + rounded(entry.defaultSize ?? 0), 0);
  const share = limits.length === given.length ? 0 : rounded((100 - taken) / (limits.length - given.length));
  return limits.map((entry) => (entry.defaultSize === undefined ? share : rounded(entry.defaultSize)));
}

/**
 * `layout` for a group grown or shrunk from `from` px to `to`: a panel that keeps its pixel size is given the
 * percentage that holds it, and the others share what is left in their old proportions.
 */
function rescaled(layout: readonly number[], limits: readonly Limits[], from: number, to: number): readonly number[] {
  if (from <= 0 || to <= 0 || from === to || !limits.some((entry) => entry.keepsPixels)) return layout;
  const kept = layout.map((size, index) => (limits[index].keepsPixels ? rounded(((size / 100) * from * 100) / to) : 0));
  const left = 100 - kept.reduce((sum, size) => sum + size, 0);
  const relative = layout.filter((_, index) => !limits[index].keepsPixels);
  if (relative.length === 0) return layout;
  const relativeTotal = relative.reduce((sum, size) => sum + size, 0);
  return layout.map((size, index) => {
    if (limits[index].keepsPixels) return kept[index];
    return relativeTotal > 0 ? rounded((size / relativeTotal) * left) : rounded(left / relative.length);
  });
}

function keyed(ids: readonly string[], sizes: readonly number[]): ResizableLayout {
  return Object.fromEntries(ids.map((id, index) => [id, sizes[index]]));
}

/** `ref` given `value`, whichever kind of ref it is. */
function assignRef<T>(ref: Ref<T> | undefined, value: T | null): void {
  if (typeof ref === 'function') ref(value);
  else if (ref) ref.current = value;
}

/** `children` with every Fragment opened, so each panel and handle has its place among the group's own. */
function flattened(children: ReactNode): ReactNode[] {
  return Children.toArray(children).flatMap((child) =>
    isValidElement<{ children?: ReactNode }>(child) && child.type === Fragment
      ? flattened(child.props.children)
      : [child],
  );
}

/** What a group shares with its panels and handles. */
interface ResizableGroupContextValue {
  orientation: 'horizontal' | 'vertical';
  disabled: boolean;
  disableCursor: boolean;
  /** Each panel's size, which the panels grow by on the UI thread as a drag moves. */
  sizes: SharedValue<ResizableLayout>;
  /** The px a handle's touch area spans at least, across the group's direction. */
  targetSize: number;
  registerPanel: (entry: PanelEntry) => () => void;
  registerHandle: (entry: HandleEntry) => () => void;
  /** The ids of the panels either side of the handle at `order`, undefined where one is missing. */
  panelsAround: (order: number) => readonly [string, string] | undefined;
  /** The value range of the handle at `order`: how small and large the panel before it can be made. */
  rangeAround: (order: number) => { min: number; max: number; now: number } | undefined;
  startDrag: (order: number) => boolean;
  /** Moves the dragged handle `distance` px from where the drag started, towards the group's end when positive. */
  moveDrag: (distance: number) => void;
  endDrag: () => void;
  resizeBy: (order: number, delta: number) => void;
  toggleCollapse: (order: number) => void;
  /** Resets the panels either side of the handle at `order` to the first's `defaultSize` that has one. */
  resetAround: (order: number) => void;
  focusHandle: (order: number, backwards: boolean) => void;
  panelApi: (id: string) => ResizablePanelImperativeHandle;
}

const ResizableGroupContext = createContext<ResizableGroupContextValue | undefined>(undefined);

/** A part's place among its group's children, which orders the panels and puts each handle between two. */
const ResizableOrderContext = createContext(0);

function useResizableGroup(part: string): ResizableGroupContextValue {
  const group = useContext(ResizableGroupContext);
  if (group === undefined) throw new Error(`${part} must be inside a ResizablePanelGroup.`);
  return group;
}

type ResizablePanelGroupProps = Omit<ViewProps, 'id'> & {
  /** The layout to start from, each panel's size by its id; used only where it names every panel. */
  defaultLayout?: ResizableLayout;
  /** Keeps the handles from showing a resize cursor on the web. */
  disableCursor?: boolean;
  /** Blocks resizing by every handle. */
  disabled?: boolean;
  elementRef?: Ref<ViewInstance>;
  groupRef?: Ref<ResizableGroupImperativeHandle>;
  /** Identifies the group; a generated one when left out. */
  id?: string | number;
  /** Called as the layout changes, on each move of a drag. */
  onLayoutChange?: (layout: ResizableLayout) => void;
  /** Called once a change is finished: a drag released, a key pressed, a call made or a new size. */
  onLayoutChanged?: (layout: ResizableLayout, meta: ResizableLayoutChangedMeta) => void;
  /** Whether the panels sit side by side (`horizontal`, the default) or stacked (`vertical`). */
  orientation?: 'horizontal' | 'vertical';
  /** The px a handle's touch area spans at least, for a finger (`coarse`) and for a mouse (`fine`). */
  resizeTargetMinimumSize?: { coarse: number; fine: number };
};

/** Whether the web page is used with a finger rather than a mouse; a device always is. */
function coarsePointer(): boolean {
  if (Platform.OS !== 'web') return true;
  const { matchMedia } = globalThis as { matchMedia?: (query: string) => { matches: boolean } };
  return matchMedia !== undefined && matchMedia('(pointer: coarse)').matches;
}

/**
 * Panels side by side, or stacked, with a handle between two that drags the room from one to the other.
 * Each panel's size is a percentage of the group, set by its `defaultSize` and held between its `minSize` and
 * `maxSize`. In text read right to left a horizontal group runs from the right.
 */
function ResizablePanelGroup({
  className,
  style,
  children,
  defaultLayout: startLayout,
  disableCursor = false,
  disabled = false,
  elementRef,
  groupRef,
  id,
  onLayoutChange,
  onLayoutChanged,
  orientation = 'horizontal',
  resizeTargetMinimumSize = { coarse: 20, fine: 10 },
  ...props
}: ResizablePanelGroupProps): ReactNode {
  const vertical = orientation === 'vertical';
  const sides = useDirectionSides();
  const sizes = useSharedValue<ResizableLayout>({});
  // The handles announce the layout as last settled, so settling draws the group again.
  const [, setSettled] = useState<ResizableLayout>({});
  const [registry, setRegistry] = useState(0);
  const [boxSize, setBoxSize] = useState<number>();
  const [handlesSize, setHandlesSize] = useState(0);
  const panels = useRef(new Map<string, PanelEntry>());
  const handles = useRef(new Set<HandleEntry>());
  // The layout in panel order, the ids and limits it was made for, the group's size then, and the layout
  // last settled, from which a drag is measured and which `onLayoutChanged` last reported.
  const state = useRef({
    ids: [] as readonly string[],
    limits: [] as readonly Limits[],
    sizes: [] as readonly number[],
    groupSize: undefined as number | undefined,
    settled: [] as readonly number[],
    drag: undefined as { pivots: readonly [number, number]; initial: readonly number[]; groupSize: number } | undefined,
  });
  const callbacks = useRef({ onLayoutChange, onLayoutChanged, startLayout });
  callbacks.current = { onLayoutChange, onLayoutChanged, startLayout };

  const groupSize = boxSize === undefined ? undefined : Math.max(0, boxSize - handlesSize);
  const ordered = (): PanelEntry[] => [...panels.current.values()].sort((a, b) => a.order - b.order);

  const reportSizes = (): void => {
    const { ids, sizes: current, groupSize: size } = state.current;
    if (size === undefined) return;
    ids.forEach((panelId, index) => {
      const entry = panels.current.get(panelId);
      if (entry === undefined) return;
      const next = { asPercentage: current[index], inPixels: (current[index] / 100) * size };
      const before = entry.reported;
      if (before?.asPercentage === next.asPercentage && before.inPixels === next.inPixels) return;
      entry.reported = next;
      entry.onResize?.(next, entry.givenId, before);
    });
  };

  /** Draws `next`, reporting it as it changes; a drag's moves are settled only once it ends. */
  const apply = (next: readonly number[]): void => {
    const { ids, limits, sizes: previous } = state.current;
    if (sameEntries(previous, next)) return;
    ids.forEach((panelId, index) => {
      const entry = panels.current.get(panelId);
      const collapses = limits[index].collapsible && near(next[index], limits[index].collapsedSize);
      if (entry && collapses && !near(previous[index] ?? next[index], limits[index].collapsedSize)) {
        entry.expandTo = previous[index];
      }
    });
    state.current.sizes = next;
    const named = keyed(ids, next);
    sizes.value = named;
    if (state.current.groupSize === undefined) return;
    callbacks.current.onLayoutChange?.(named);
    reportSizes();
  };

  const settle = (meta: ResizableLayoutChangedMeta): void => {
    const { ids, sizes: current, settled, groupSize: size } = state.current;
    if (sameEntries(current, settled)) return;
    state.current.settled = current;
    const named = keyed(ids, current);
    setSettled(named);
    if (size !== undefined) callbacks.current.onLayoutChanged?.(named, meta);
  };

  useLayoutEffect(() => {
    const entries = ordered();
    const ids = entries.map((entry) => entry.id);
    const limits = entries.map((entry) => limitsOf(entry, groupSize));
    const was = state.current;
    const fresh = !sameEntries(was.ids, ids) || (was.groupSize === undefined && groupSize !== undefined);
    let next: readonly number[];
    if (fresh) {
      const given = callbacks.current.startLayout;
      const named = given && ids.length > 0 && ids.every((panelId) => given[panelId] !== undefined);
      next = named ? ids.map((panelId) => given[panelId]) : defaultLayout(limits);
    } else {
      next = rescaled(was.sizes, limits, was.groupSize ?? 0, groupSize ?? 0);
    }
    next = validated(next, limits);
    const resized = was.groupSize !== groupSize;
    state.current = { ...was, ids, limits, groupSize };
    // A fresh layout is drawn and reported whole, as on mount, even where it matches the one before.
    if (fresh) Object.assign(state.current, { sizes: [], settled: [] });
    apply(next);
    settle({ isUserInteraction: false });
    if (resized) reportSizes();
    // `ordered`, `apply` and `settle` read the refs they need; the layout is made again when the panels
    // register, change or leave, or the group changes size.
  }, [registry, groupSize]);

  const pivotsAround = (order: number): readonly [number, number] | undefined => {
    const entries = ordered();
    const before = entries.filter((entry) => entry.order < order).length - 1;
    if (before < 0 || before + 1 >= entries.length) return undefined;
    return [before, before + 1];
  };

  const resizePanel = (panelId: string, size: number, meta: ResizableLayoutChangedMeta): void => {
    const { ids, limits, sizes: current } = state.current;
    const index = ids.indexOf(panelId);
    if (index < 0 || current[index] === size) return;
    const last = index === ids.length - 1;
    let next: readonly number[];
    const earlierCollapsed = ids
      .slice(0, index)
      .every((_, before) => limits[before].collapsible && near(limits[before].collapsedSize, current[before]));
    if (last && size < current[index] && (index === 0 || earlierCollapsed)) {
      const taken = current.slice(0, index).reduce((sum, entry) => sum + entry, 0);
      next = current.map((entry, at) => (at === index ? rounded(100 - taken) : entry));
    } else {
      next = adjusted({
        delta: last ? current[index] - size : size - current[index],
        initial: current,
        limits,
        pivots: last ? [index - 1, index] : [index, index + 1],
        previous: current,
        trigger: 'imperative',
      });
    }
    apply(validated(next, limits));
    settle(meta);
  };

  const resizeBy = (order: number, delta: number, trigger: Trigger): void => {
    const pivots = pivotsAround(order);
    if (disabled || pivots === undefined) return;
    const { limits, sizes: current } = state.current;
    apply(validated(adjusted({ delta, initial: current, limits, pivots, previous: current, trigger }), limits));
    settle({ isUserInteraction: true });
  };

  const context: ResizableGroupContextValue = {
    orientation,
    disabled,
    disableCursor,
    sizes,
    targetSize: coarsePointer() ? resizeTargetMinimumSize.coarse : resizeTargetMinimumSize.fine,
    registerPanel: (entry) => {
      panels.current.set(entry.id, entry);
      setRegistry((count) => count + 1);
      return () => {
        if (panels.current.get(entry.id) === entry) panels.current.delete(entry.id);
        setRegistry((count) => count + 1);
      };
    },
    registerHandle: (entry) => {
      handles.current.add(entry);
      const measure = (): void =>
        setHandlesSize([...handles.current].reduce((sum, handle) => sum + handle.thickness, 0));
      measure();
      return () => {
        handles.current.delete(entry);
        measure();
      };
    },
    panelsAround: (order) => {
      const pivots = pivotsAround(order);
      const entries = ordered();
      return pivots && [entries[pivots[0]].id, entries[pivots[1]].id];
    },
    rangeAround: (order) => {
      const pivots = pivotsAround(order);
      const { ids, limits, sizes: current } = state.current;
      if (pivots === undefined || current.length !== ids.length || ids.length === 0) return undefined;
      const [before] = pivots;
      const toward = (size: number): number =>
        validated(
          adjusted({
            delta: size - current[before],
            initial: current,
            limits,
            pivots,
            previous: current,
            trigger: 'pointer',
          }),
          limits,
        )[before];
      const { collapsible, collapsedSize, minSize, maxSize } = limits[before];
      return { min: toward(collapsible ? collapsedSize : minSize), max: toward(maxSize), now: current[before] };
    },
    startDrag: (order) => {
      const pivots = pivotsAround(order);
      const size = state.current.groupSize;
      if (disabled || pivots === undefined || size === undefined || size <= 0) return false;
      state.current.drag = { pivots, initial: state.current.sizes, groupSize: size };
      return true;
    },
    moveDrag: (distance) => {
      const drag = state.current.drag;
      if (drag === undefined) return;
      const { limits, sizes: current } = state.current;
      const delta = (distance / drag.groupSize) * 100;
      apply(
        validated(
          adjusted({
            delta,
            initial: drag.initial,
            limits,
            pivots: drag.pivots,
            previous: current,
            trigger: 'pointer',
          }),
          limits,
        ),
      );
    },
    endDrag: () => {
      if (state.current.drag === undefined) return;
      state.current.drag = undefined;
      settle({ isUserInteraction: true });
    },
    resizeBy: (order, delta) => resizeBy(order, delta, 'keyboard'),
    toggleCollapse: (order) => {
      const pivots = pivotsAround(order);
      if (disabled || pivots === undefined) return;
      const [before] = pivots;
      const { ids, limits, sizes: current } = state.current;
      const { collapsible, collapsedSize, minSize } = limits[before];
      if (!collapsible) return;
      const target =
        collapsedSize === current[before] ? (panels.current.get(ids[before])?.expandTo ?? minSize) : collapsedSize;
      resizeBy(order, target - current[before], 'keyboard');
    },
    resetAround: (order) => {
      const pivots = pivotsAround(order);
      if (disabled || pivots === undefined) return;
      const { ids, limits } = state.current;
      const index = pivots.find((at) => limits[at].defaultSize !== undefined);
      const size = index === undefined ? undefined : limits[index].defaultSize;
      if (index !== undefined && size !== undefined) resizePanel(ids[index], size, { isUserInteraction: false });
    },
    focusHandle: (order, backwards) => {
      const list = [...handles.current].sort((a, b) => a.order - b.order);
      const at = list.findIndex((entry) => entry.order === order);
      if (at < 0) return;
      const next = backwards ? (at > 0 ? at - 1 : list.length - 1) : at + 1 < list.length ? at + 1 : 0;
      list[next].focus();
    },
    panelApi: (panelId) => {
      const indexOf = (): number => state.current.ids.indexOf(panelId);
      const limitsAt = (): Limits | undefined => state.current.limits[indexOf()];
      const sizeAt = (): number => state.current.sizes[indexOf()] ?? 0;
      return {
        collapse: () => {
          const limits = limitsAt();
          if (!limits?.collapsible || sizeAt() === limits.collapsedSize) return;
          const entry = panels.current.get(panelId);
          if (entry) entry.expandTo = sizeAt();
          resizePanel(panelId, limits.collapsedSize, { isUserInteraction: false });
        },
        expand: () => {
          const limits = limitsAt();
          if (!limits?.collapsible || sizeAt() !== limits.collapsedSize) return;
          const size = panels.current.get(panelId)?.expandTo ?? limits.minSize;
          resizePanel(panelId, size === 0 ? 1 : size, { isUserInteraction: false });
        },
        getSize: () => ({
          asPercentage: sizeAt(),
          inPixels: (sizeAt() / 100) * (state.current.groupSize ?? 0),
        }),
        isCollapsed: () => {
          const limits = limitsAt();
          return limits !== undefined && limits.collapsible && near(limits.collapsedSize, sizeAt());
        },
        resize: (size) => {
          const groupPixels = state.current.groupSize;
          const pixels = pixelsOf(size, groupPixels);
          if (pixels === undefined || groupPixels === undefined || groupPixels <= 0) return;
          resizePanel(panelId, rounded((pixels / groupPixels) * 100), { isUserInteraction: false });
        },
      };
    },
  };

  useImperativeHandle(
    groupRef,
    () => ({
      getLayout: () => keyed(state.current.ids, state.current.sizes),
      setLayout: (next) => {
        const { ids, limits } = state.current;
        apply(
          validated(
            ids.map((panelId) => next[panelId] ?? 0),
            limits,
          ),
        );
        settle({ isUserInteraction: false });
        return keyed(ids, state.current.sizes);
      },
    }),
    // `apply` and `settle` read the group's state from refs, so the handle stays the same object.
    [],
  );

  return (
    <ResizableGroupContext.Provider value={context}>
      <View
        ref={elementRef}
        nativeID={id === undefined ? undefined : String(id)}
        className={cn('flex h-full w-full', className)}
        style={[
          style,
          {
            flexDirection: vertical ? 'column' : sides.start === 'start' ? 'row' : 'row-reverse',
            overflow: 'hidden',
          },
        ]}
        {...props}
      >
        {flattened(children).map((child, order) => (
          <ResizableOrderContext.Provider key={isValidElement(child) ? (child.key ?? order) : order} value={order}>
            {child}
          </ResizableOrderContext.Provider>
        ))}
        {/* Fills the group inside its border, out of the flow, so the panels' share is measured without it. */}
        <View
          pointerEvents="none"
          style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }}
          onLayout={(event: LayoutChangeEvent) => {
            const { width, height } = event.nativeEvent.layout;
            setBoxSize(vertical ? height : width);
          }}
        />
      </View>
    </ResizableGroupContext.Provider>
  );
}

type ResizablePanelProps = Omit<ViewProps, 'id'> & {
  /** The size a collapsed panel keeps, 0% by default. */
  collapsedSize?: ResizableSize;
  /** Lets the panel collapse to `collapsedSize` when dragged, or pressed with Enter, below its `minSize`. */
  collapsible?: boolean;
  /** The size the panel starts at; the panels with none share the room the others leave. */
  defaultSize?: ResizableSize;
  /** Keeps the panel's size whatever a handle does. */
  disabled?: boolean;
  elementRef?: Ref<ViewInstance>;
  /** Whether the panel keeps its percentage (the default) or its px when the group changes size. */
  groupResizeBehavior?: ResizableGroupResizeBehavior;
  /** Identifies the panel in the group's layout; a generated one when left out. */
  id?: string | number;
  /** The largest the panel can be made, 100% by default. */
  maxSize?: ResizableSize;
  /** The smallest the panel can be made, 0% by default. */
  minSize?: ResizableSize;
  /** Called as the panel's size changes, with its `id` and the size before; once the group is laid out. */
  onResize?: (
    panelSize: ResizablePanelSize,
    id: string | number | undefined,
    prevPanelSize: ResizablePanelSize | undefined,
  ) => void;
  panelRef?: Ref<ResizablePanelImperativeHandle>;
};

/**
 * One of a group's panels, sized by the group. Its props other than `className`, `style` and `children` go to
 * the box the group sizes, and those three to a box inside it that fills it, as upstream splits them.
 */
function ResizablePanel({
  className,
  style,
  children,
  collapsedSize,
  collapsible = false,
  defaultSize,
  disabled = false,
  elementRef,
  groupResizeBehavior = 'preserve-relative-size',
  id,
  maxSize,
  minSize,
  onResize,
  panelRef,
  ...props
}: ResizablePanelProps): ReactNode {
  const group = useResizableGroup('ResizablePanel');
  const order = useContext(ResizableOrderContext);
  const generated = useId();
  const panelId = id === undefined ? generated : String(id);
  const onResizeRef = useRef(onResize);
  onResizeRef.current = onResize;
  const { registerPanel, sizes } = group;
  // Before the group has made its layout, a panel given a percentage grows by it, and any other by 1.
  const fallback = percentOf(defaultSize, undefined) ?? 1;

  useLayoutEffect(
    () =>
      registerPanel({
        id: panelId,
        givenId: id,
        order,
        collapsedSize,
        collapsible,
        defaultSize,
        disabled,
        maxSize,
        minSize,
        groupResizeBehavior,
        onResize: (...args) => onResizeRef.current?.(...args),
        reported: undefined,
        expandTo: undefined,
      }),
    // `registerPanel` is made on every render of the group; the entry is made again only when the panel changes.
    [panelId, id, order, collapsedSize, collapsible, defaultSize, disabled, maxSize, minSize, groupResizeBehavior],
  );

  useImperativeHandle(panelRef, () => group.panelApi(panelId), [panelId]);

  const grown = useAnimatedStyle(() => ({ flexGrow: sizes.value[panelId] ?? fallback }));

  return (
    <Animated.View
      ref={elementRef}
      style={[{ flexBasis: 0, flexShrink: 1, minWidth: 0, minHeight: 0, overflow: 'hidden' }, grown]}
      {...props}
    >
      {/* Not every engine styles an Animated.View by its className, so the classes go to a View inside it. */}
      <View className={className} style={[{ flexGrow: 1 }, style]}>
        {children}
      </View>
    </Animated.View>
  );
}

type ResizableHandleProps = Omit<ViewProps, 'id' | 'role'> & {
  /** Draws a grip on the handle. */
  withHandle?: boolean;
  /** Blocks resizing by this handle; the panels either side may still move as another handle drags them. */
  disabled?: boolean;
  /** Keeps a double tap or double click from resetting the panel before the handle to its `defaultSize`. */
  disableDoubleClick?: boolean;
  elementRef?: Ref<ViewInstance>;
  /** Identifies the handle; a generated one when left out. */
  id?: string | number;
};

/**
 * The browser's own handling a handle turns off, and the cursor it shows: a drag on the handle would
 * otherwise pan the page, and a press draw the focus outline over the ring the handle draws itself.
 */
/** A cursor class, under any variant, which a style would otherwise outrank on the web. */
const CURSOR_CLASS = /(^|[\s:])cursor-/;

function webHandleStyle(cursor: 'not-allowed' | 'row-resize' | 'col-resize' | undefined): ViewStyle {
  // React Native Web reads these values, which React Native's style type does not list.
  return { touchAction: 'none', outlineWidth: 0, cursor: cursor as ViewStyle['cursor'] } as ViewStyle;
}

/**
 * The handle between two panels, dragged to move room from one to the other. A drag on it is kept from a
 * scrolling parent. It is announced as adjustable, valued at the size of the panel before it, and a screen
 * reader's swipe up or down grows or shrinks that panel. On the web it is a focusable separator: the arrow keys
 * along the group move it, Home and End move it as far as it goes, Enter collapses or opens a collapsible
 * panel before it, and F6 moves focus to the next handle.
 */
function ResizableHandle({
  withHandle = false,
  className,
  style,
  disabled = false,
  disableDoubleClick = false,
  elementRef,
  id,
  onLayout,
  onKeyDown,
  onFocus,
  onBlur,
  ...props
}: ResizableHandleProps): ReactNode {
  const group = useResizableGroup('ResizableHandle');
  const order = useContext(ResizableOrderContext);
  const sides = useDirectionSides();
  const vertical = group.orientation === 'vertical';
  const inactive = disabled || group.disabled;
  const own = useRef<ViewInstance | null>(null);
  const [thickness, setThickness] = useState(1);
  const { focusVisible, onFocus: focusVisibleOnFocus, onBlur: focusVisibleOnBlur } = useFocusVisible();
  const drag = useRef<{ start: number; moved: boolean } | undefined>(undefined);
  const lastTap = useRef(0);
  const { registerHandle } = group;
  const web = Platform.OS === 'web';

  useLayoutEffect(() => registerHandle({ order, thickness, focus: () => own.current?.focus() }), [order, thickness]);

  const range = group.rangeAround(order);

  const along = (event: GestureResponderEvent): number => {
    if (vertical) return event.nativeEvent.pageY;
    // Read right to left, the panel before the handle sits to its right, so a finger moving left grows it.
    return sides.rtl ? -event.nativeEvent.pageX : event.nativeEvent.pageX;
  };

  const onResponderGrant = (event: GestureResponderEvent): boolean => {
    drag.current = !inactive && group.startDrag(order) ? { start: along(event), moved: false } : undefined;
    // True keeps a scrolling parent from taking the touch from the handle.
    return true;
  };

  const onResponderMove = (event: GestureResponderEvent): void => {
    const held = drag.current;
    if (held === undefined) return;
    const distance = along(event) - held.start;
    if (distance !== 0) held.moved = true;
    group.moveDrag(distance);
  };

  const onResponderEnd = (event: GestureResponderEvent | undefined): void => {
    const held = drag.current;
    drag.current = undefined;
    if (held === undefined) return;
    group.endDrag();
    if (event === undefined || held.moved || disableDoubleClick) return;
    const now = event.nativeEvent.timestamp;
    if (now - lastTap.current <= DOUBLE_TAP_MS) {
      lastTap.current = 0;
      group.resetAround(order);
    } else {
      lastTap.current = now;
    }
  };

  const handleKeyDown = (event: KeyDownEvent): void => {
    onKeyDown?.(event);
    if (inactive) return;
    const { key, shiftKey } = event.nativeEvent;
    const deltas: Readonly<Record<string, number | undefined>> = {
      ArrowDown: vertical ? KEY_STEP : undefined,
      ArrowUp: vertical ? -KEY_STEP : undefined,
      ArrowRight: vertical ? undefined : KEY_STEP,
      ArrowLeft: vertical ? undefined : -KEY_STEP,
      End: 100,
      Home: -100,
    };
    if (key in deltas) {
      event.preventDefault();
      const delta = deltas[key];
      if (delta !== undefined) group.resizeBy(order, delta);
    } else if (key === 'Enter') {
      event.preventDefault();
      group.toggleCollapse(order);
    } else if (key === 'F6') {
      event.preventDefault();
      group.focusHandle(order, shiftKey);
    }
  };

  const extra = Math.max(0, (group.targetSize - thickness) / 2);
  const role = web
    ? ({ role: 'separator', 'aria-orientation': vertical ? 'horizontal' : 'vertical' } as const)
    : ({ accessibilityRole: 'adjustable' } as const);

  return (
    <View
      ref={(node: ViewInstance | null) => {
        own.current = node;
        assignRef(elementRef, node);
      }}
      nativeID={id === undefined ? undefined : String(id)}
      accessible
      focusable={!inactive}
      {...role}
      aria-disabled={inactive || undefined}
      aria-valuemin={range?.min}
      aria-valuemax={range?.max}
      aria-valuenow={range?.now}
      // Without a text iOS reads the value as a share of the range, which is not the panel's size.
      aria-valuetext={web || range === undefined ? undefined : `${Math.round(range.now)}%`}
      accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
      onAccessibilityAction={(event: AccessibilityActionEvent) => {
        if (inactive) return;
        if (event.nativeEvent.actionName === 'increment') group.resizeBy(order, KEY_STEP);
        if (event.nativeEvent.actionName === 'decrement') group.resizeBy(order, -KEY_STEP);
      }}
      hitSlop={web ? undefined : vertical ? { top: extra, bottom: extra } : { left: extra, right: extra }}
      onStartShouldSetResponder={() => !inactive}
      onResponderTerminationRequest={() => false}
      onResponderGrant={onResponderGrant}
      onResponderMove={onResponderMove}
      onResponderRelease={onResponderEnd}
      onResponderTerminate={() => onResponderEnd(undefined)}
      onKeyDown={handleKeyDown}
      onFocus={(event) => {
        focusVisibleOnFocus(event);
        onFocus?.(event);
      }}
      onBlur={(event) => {
        focusVisibleOnBlur();
        onBlur?.(event);
      }}
      onLayout={(event: LayoutChangeEvent) => {
        const { width, height } = event.nativeEvent.layout;
        setThickness(vertical ? height : width);
        onLayout?.(event);
      }}
      className={cn(
        'relative items-center justify-center bg-border',
        vertical ? 'h-px w-full' : 'w-px',
        focusVisible && 'ring-1 ring-ring',
        className,
      )}
      // Above the panel after it, which would otherwise take the touches on that side of its widened area.
      // The web's own handling goes first, so a caller's style replaces it.
      style={[
        web
          ? webHandleStyle(
              group.disableCursor || group.disabled || CURSOR_CLASS.test(className ?? '')
                ? undefined
                : disabled
                  ? 'not-allowed'
                  : vertical
                    ? 'row-resize'
                    : 'col-resize',
            )
          : undefined,
        style,
        { flexGrow: 0, flexShrink: 0, zIndex: 1 },
      ]}
      {...props}
    >
      {web ? (
        <View
          style={
            vertical
              ? { position: 'absolute', left: 0, right: 0, top: -extra, bottom: -extra }
              : { position: 'absolute', top: 0, bottom: 0, left: -extra, right: -extra }
          }
        />
      ) : null}
      {withHandle ? <View className={cn('z-10 shrink-0 cn-resizable-handle-icon', vertical && 'rotate-90')} /> : null}
    </View>
  );
}

export { ResizableHandle, ResizablePanel, ResizablePanelGroup };
export type {
  ResizableGroupImperativeHandle,
  ResizableHandleProps,
  ResizableLayout,
  ResizableLayoutChangedMeta,
  ResizablePanelGroupProps,
  ResizablePanelImperativeHandle,
  ResizablePanelProps,
  ResizablePanelSize,
  ResizableSize,
};
