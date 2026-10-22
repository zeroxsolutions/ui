import { useRef, useState, type ReactNode } from 'react';
import {
  View,
  type AccessibilityActionEvent,
  type GestureResponderEvent,
  type KeyDownEvent,
  type LayoutChangeEvent,
  type ViewProps,
} from 'react-native';
import { cn } from '../lib/utils';

// A `cn-<slot>` token stands for that slot's classes; the registry build replaces each with
// the classes translated for the target engine.

type SliderValue = number | readonly number[];

/** What the slider passes beside a new value. */
interface SliderChangeDetails {
  /** The index of the thumb that moved. */
  activeThumbIndex: number;
}

type SliderProps = Omit<ViewProps, 'children'> & {
  /** The value, a number for one thumb or an array with one entry per thumb; pass it to control the slider. */
  value?: SliderValue;
  /** The value the slider starts from when `value` is left out. With neither, two thumbs sit at `min` and `max`. */
  defaultValue?: SliderValue;
  /** Called as a thumb moves, with the new value in the shape `value` or `defaultValue` was given in. */
  onValueChange?: (value: number | readonly number[], details: SliderChangeDetails) => void;
  /** Called once a change is finished: a drag released, a key pressed or a screen reader's adjustment. */
  onValueCommitted?: (value: number | readonly number[]) => void;
  /** The lowest value, 0 by default. */
  min?: number;
  /** The highest value, 100 by default. */
  max?: number;
  /** The difference between two neighbouring values, 1 by default; every value is rounded to a multiple of it from `min`. */
  step?: number;
  /** How far Page Up, Page Down and a Shift-held arrow key move a thumb, 10 by default. */
  largeStep?: number;
  /** The fewest steps a range keeps between two thumbs, 0 by default. */
  minStepsBetweenValues?: number;
  /**
   * What a thumb dragged into its neighbour does: `push` it along (the default), `swap` places with it, or
   * stop at it (`none`). The keyboard and a screen reader stop a thumb at its neighbour whatever this says.
   */
  thumbCollisionBehavior?: 'push' | 'swap' | 'none';
  orientation?: 'horizontal' | 'vertical';
  /** Blocks every input and is announced on each thumb. */
  disabled?: boolean;
  /** How a value is written for a screen reader, such as `{ style: 'percent' }`. */
  format?: Intl.NumberFormatOptions;
  /** The locale `format` writes values in; the system's when left out. */
  locale?: Intl.LocalesArgument;
  /**
   * A thumb's text for a screen reader, from its formatted value; by default the formatted value, followed in
   * a two-thumb range by "start range" or "end range".
   */
  getAriaValueText?: (formattedValue: string, value: number, index: number) => string;
  /** The name every thumb is announced with. */
  'aria-label'?: string;
  /** The id of the Label every thumb takes its name from. */
  'aria-labelledby'?: string;
};

function valuesOf(value: SliderValue | undefined): readonly number[] | undefined {
  if (value === undefined) return undefined;
  return typeof value === 'number' ? [value] : value;
}

/** The decimals `num` is written with, so a value rounded to a step keeps no floating-point tail. */
function decimalsOf(num: number): number {
  if (Math.abs(num) < 1 && num !== 0) {
    const [mantissa, exponent] = num.toExponential().split('e-');
    return (mantissa.split('.')[1]?.length ?? 0) + Number(exponent);
  }
  return num.toString().split('.')[1]?.length ?? 0;
}

function roundToStep(value: number, step: number, min: number): number {
  const nearest = Math.round((value - min) / step) * step + min;
  return Number(nearest.toFixed(Math.max(decimalsOf(step), decimalsOf(min))));
}

function clamp(value: number, low: number, high: number): number {
  return Math.min(high, Math.max(low, value));
}

/**
 * `values` with the thumb at `index` moved to `next`, the thumbs either side of it pushed along to keep `gap`,
 * and let back towards where they were at `initial`, the drag's start, as the moved thumb returns.
 */
function pushed(
  values: readonly number[],
  index: number,
  next: number,
  gap: number,
  min: number,
  max: number,
  initial: readonly number[] = values,
) {
  const moved = [...values];
  const last = moved.length - 1;
  moved[index] = clamp(next, min + index * gap, max - (last - index) * gap);
  for (let i = index + 1; i <= last; i += 1) {
    const low = moved[i - 1] + gap;
    moved[i] = clamp(Math.max(Math.min(moved[i], initial[i]), low), low, max - (last - i) * gap);
  }
  for (let i = index - 1; i >= 0; i -= 1) {
    const high = moved[i + 1] - gap;
    moved[i] = clamp(Math.min(Math.max(moved[i], initial[i]), high), min + i * gap, high);
  }
  return moved;
}

/** `values` with the thumb at `index` moved to `next`, held between its neighbours less `gap`. */
function bounded(values: readonly number[], index: number, next: number, gap: number, min: number, max: number) {
  const moved = [...values];
  moved[index] = clamp(
    next,
    values[index - 1] === undefined ? min : values[index - 1] + gap,
    values[index + 1] === undefined ? max : values[index + 1] - gap,
  );
  return moved;
}

/**
 * The pointer or finger dragging a thumb: where it started, on the screen and in the control, the thumb, and
 * the values at the start, which a pushed thumb goes back towards.
 */
interface Drag {
  page: number;
  location: number;
  index: number;
  initial: readonly number[];
}

/**
 * A value, or a range of values, picked by dragging a thumb along a track. A press on the track moves the
 * nearest thumb there. Each thumb is announced as adjustable, with the slider's range, its value and that
 * value as text, and a screen reader's swipe up or down moves it a step; on the web it takes the arrow keys,
 * Page Up and Page Down, Home and End.
 */
function Slider({
  className,
  value,
  defaultValue,
  onValueChange,
  onValueCommitted,
  min = 0,
  max = 100,
  step = 1,
  largeStep = 10,
  minStepsBetweenValues = 0,
  thumbCollisionBehavior = 'push',
  orientation = 'horizontal',
  disabled = false,
  format,
  locale,
  getAriaValueText,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledBy,
  ...props
}: SliderProps): ReactNode {
  const [ownValues, setOwnValues] = useState<readonly number[]>(() => valuesOf(defaultValue) ?? [min, max]);
  const values = valuesOf(value) ?? ownValues;
  const asNumber = typeof (value ?? defaultValue) === 'number';
  const [length, setLength] = useState<number>();
  const [thumbSize, setThumbSize] = useState(0);
  const drag = useRef<Drag | undefined>(undefined);
  const latest = useRef(values);
  latest.current = values;
  const vertical = orientation === 'vertical';
  const gap = step * minStepsBetweenValues;

  const shaped = (next: readonly number[]): number | readonly number[] => (asNumber ? next[0] : next);

  const change = (next: readonly number[], index: number): void => {
    if (next.every((entry, i) => entry === latest.current[i])) return;
    latest.current = next;
    if (value === undefined) setOwnValues(next);
    onValueChange?.(shaped(next), { activeThumbIndex: index });
  };

  const commit = (): void => onValueCommitted?.(shaped(latest.current));

  /** Moves the thumb at `index` by `delta` from its value rounded to the step, as a key or a screen reader does. */
  const nudge = (index: number, delta: number): void => {
    if (disabled) return;
    const from = roundToStep(latest.current[index], step, min);
    const decimals = Math.max(decimalsOf(from), decimalsOf(Math.abs(delta)), decimalsOf(min));
    const next = clamp(Number((from + delta).toFixed(decimals)), min, max);
    change(bounded(latest.current, index, next, gap, min, max), index);
    commit();
  };

  const onKeyDown = (index: number, event: KeyDownEvent): void => {
    const { key, shiftKey } = event.nativeEvent;
    const arrowStep = shiftKey ? largeStep : step;
    const deltas: Readonly<Record<string, number>> = {
      ArrowUp: arrowStep,
      ArrowRight: arrowStep,
      ArrowDown: -arrowStep,
      ArrowLeft: -arrowStep,
      PageUp: largeStep,
      PageDown: -largeStep,
      Home: min - max,
      End: max - min,
    };
    const delta = deltas[key];
    if (delta === undefined) return;
    event.preventDefault();
    nudge(index, delta);
  };

  /** The value at `location` along the control, measured from its left or, when vertical, its bottom. */
  const valueAt = (location: number): number | undefined => {
    if (length === undefined || length <= thumbSize) return undefined;
    const along = clamp((location - thumbSize / 2) / (length - thumbSize), 0, 1);
    return roundToStep(min + (vertical ? 1 - along : along) * (max - min), step, min);
  };

  const dragTo = (location: number, index: number, initial: readonly number[]): number => {
    const next = valueAt(location);
    if (next === undefined) return index;
    const current = latest.current;
    if (thumbCollisionBehavior === 'push') {
      change(pushed(current, index, next, gap, min, max, initial), index);
      return index;
    }
    const held = bounded(current, index, next, gap, min, max);
    const forward = next > current[index] && index < current.length - 1 && next >= current[index + 1];
    const backward = next < current[index] && index > 0 && next <= current[index - 1];
    if (thumbCollisionBehavior === 'none' || (!forward && !backward)) {
      change(held, index);
      return index;
    }
    // Base UI's swap: the dragged thumb stays a gap short of the one it met, and the drag goes on with that
    // one, which is pushed from where it is; the others go back towards where they started.
    const target = forward ? index + 1 : index - 1;
    const start = held.map((entry, i) => (i === index ? entry : initial[i]));
    const swapped = pushed(
      held,
      target,
      forward ? Math.max(next, held[target]) : Math.min(next, held[target]),
      gap,
      min,
      max,
      start,
    );
    swapped[index] = clamp(
      held[index],
      Math.max(swapped[index - 1] === undefined ? min : swapped[index - 1] + gap, min + index * gap),
      Math.min(
        swapped[index + 1] === undefined ? max : swapped[index + 1] - gap,
        max - (swapped.length - 1 - index) * gap,
      ),
    );
    change(swapped, target);
    return target;
  };

  const locationOf = (event: GestureResponderEvent): number =>
    vertical ? event.nativeEvent.locationY : event.nativeEvent.locationX;
  const pageOf = (event: GestureResponderEvent): number =>
    vertical ? event.nativeEvent.pageY : event.nativeEvent.pageX;

  const onResponderGrant = (event: GestureResponderEvent): void => {
    const location = locationOf(event);
    const pressed = valueAt(location);
    if (pressed === undefined) return;
    const current = latest.current;
    const nearest = current.reduce(
      (best, entry, i) =>
        Math.abs(entry - pressed) < Math.abs(current[best] - pressed) || (entry === current[best] && pressed > entry)
          ? i
          : best,
      0,
    );
    const initial = latest.current;
    drag.current = { page: pageOf(event), location, initial, index: dragTo(location, nearest, initial) };
  };

  const onResponderMove = (event: GestureResponderEvent): void => {
    const held = drag.current;
    if (held === undefined) return;
    held.index = dragTo(held.location + pageOf(event) - held.page, held.index, held.initial);
  };

  const onResponderEnd = (): void => {
    if (drag.current === undefined) return;
    drag.current = undefined;
    commit();
  };

  /** How far along `entry` sits, from 0 at `min` to 1 at `max`. */
  const fractionOf = (entry: number): number => (max === min ? 0 : clamp((entry - min) / (max - min), 0, 1));

  /** The offset of a thumb, or of a thumb's centre, from the control's start, in px once laid out. */
  const offsetOf = (fraction: number, centre: boolean): number | `${number}%` =>
    length === undefined ? `${fraction * 100}%` : fraction * (length - thumbSize) + (centre ? thumbSize / 2 : 0);

  const fractions = values.map(fractionOf);
  const rangeStart = values.length === 1 ? 0 : offsetOf(fractions[0], true);
  const rangeEnd = offsetOf(fractions[fractions.length - 1], true);
  const rangeSize =
    typeof rangeStart === 'number' && typeof rangeEnd === 'number'
      ? rangeEnd - rangeStart
      : `${(fractions[fractions.length - 1] - (values.length === 1 ? 0 : fractions[0])) * 100}%`;

  const textOf = (entry: number, index: number): string => {
    const formatted = new Intl.NumberFormat(locale, format).format(entry);
    if (getAriaValueText !== undefined) return getAriaValueText(formatted, entry, index);
    if (values.length !== 2) return formatted;
    return `${formatted} ${index === 0 ? 'start' : 'end'} range`;
  };

  return (
    <View className={cn(vertical ? 'h-full' : 'w-full', className)} {...props}>
      <View
        className={cn(
          'relative items-center',
          vertical ? 'h-full flex-col cn-slider@orientation=vertical' : 'w-full flex-row',
          disabled && 'opacity-50',
        )}
        hitSlop={vertical ? { left: 12, right: 12 } : { top: 12, bottom: 12 }}
        onLayout={(event: LayoutChangeEvent) => {
          const { width, height } = event.nativeEvent.layout;
          setLength(vertical ? height : width);
        }}
        onStartShouldSetResponder={() => !disabled}
        onResponderTerminationRequest={() => false}
        onResponderGrant={onResponderGrant}
        onResponderMove={onResponderMove}
        onResponderRelease={onResponderEnd}
        onResponderTerminate={onResponderEnd}
      >
        <View
          pointerEvents="none"
          className={cn(
            'relative grow overflow-hidden cn-slider-track',
            vertical ? 'cn-slider-track@orientation=vertical' : 'cn-slider-track@orientation=horizontal',
          )}
        >
          <View
            className={cn('absolute cn-slider-range', vertical ? 'inset-x-0' : 'inset-y-0')}
            style={vertical ? { bottom: rangeStart, height: rangeSize } : { left: rangeStart, width: rangeSize }}
          />
        </View>
        {values.map((entry, index) => (
          <View
            // A thumb is known by its place in the range, which is what keeps its focus as values change.
            key={index}
            accessible
            accessibilityRole="adjustable"
            aria-label={ariaLabel}
            aria-labelledby={ariaLabelledBy}
            aria-disabled={disabled}
            aria-valuemin={min}
            aria-valuemax={max}
            aria-valuenow={entry}
            aria-valuetext={textOf(entry, index)}
            accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
            onAccessibilityAction={(event: AccessibilityActionEvent) => {
              if (event.nativeEvent.actionName === 'increment') nudge(index, step);
              if (event.nativeEvent.actionName === 'decrement') nudge(index, -step);
            }}
            focusable={!disabled}
            onKeyDown={(event: KeyDownEvent) => onKeyDown(index, event)}
            pointerEvents="none"
            onLayout={(event: LayoutChangeEvent) => {
              const { width, height } = event.nativeEvent.layout;
              setThumbSize(vertical ? height : width);
            }}
            // The merge drops Nova's `relative` for `absolute`; passed as one string, Uniwind draws `relative`.
            className={cn('cn-slider-thumb absolute shrink-0')}
            style={
              vertical ? { bottom: offsetOf(fractions[index], false) } : { left: offsetOf(fractions[index], false) }
            }
          />
        ))}
      </View>
    </View>
  );
}

export { Slider };
export type { SliderChangeDetails, SliderProps, SliderValue };
