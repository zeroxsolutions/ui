import {
  addDays,
  addMonths,
  addWeeks,
  addYears,
  differenceInCalendarDays,
  differenceInCalendarMonths,
  endOfMonth,
  endOfWeek,
  endOfYear,
  format,
  getWeek,
  isAfter,
  isBefore,
  isSameDay,
  isSameMonth,
  setMonth,
  setYear,
  startOfDay,
  startOfMonth,
  startOfWeek,
  startOfYear,
  type Day,
  type Locale,
} from 'date-fns';
import { enUS } from 'date-fns/locale/en-US';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { useEffect, useRef, useState, type ComponentRef, type ComponentType, type ReactNode, type Ref } from 'react';
import {
  AccessibilityInfo,
  Platform,
  Pressable,
  View,
  type GestureResponderEvent,
  type KeyDownEvent,
  type PressableProps,
  type Role,
  type StyleProp,
  type ViewProps,
  type ViewStyle,
} from 'react-native';
import { cn } from '../lib/utils';
import { Button, type ButtonProps } from './button';
import { useDirection } from './direction';
import { Icon } from './icon';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select';
import { Text } from './text';

// A `cn-<slot>` token stands for that slot's classes; the registry build replaces each with
// the classes translated for the target engine. `cn-calendar@part=cell` is a day cell's size in the
// style, `@part=column` a weekday column's width and `@part=caption` the caption's height and side room.

/** A range of days, `to` left out while only its first day is chosen. */
interface DateRange {
  from: Date | undefined;
  to?: Date | undefined;
}

/**
 * What a day can be matched by, as react-day-picker takes it: a day, a list of days, a range, the days
 * before or after a day, days of the week (0 is Sunday), a function of the day, or `true` for every day.
 */
type Matcher =
  | boolean
  | Date
  | readonly Date[]
  | DateRange
  | { before: Date }
  | { after: Date }
  | { before: Date; after: Date }
  | { dayOfWeek: number | readonly number[] }
  | ((date: Date) => boolean);

/** A day drawn in a month's grid, and the month it is drawn in, which a day of the weeks either side is not in. */
interface CalendarDay {
  date: Date;
  displayMonth: Date;
  outside: boolean;
}

/** What a day is, as its button draws and announces it, with a key for each of the `modifiers` passed. */
interface DayModifiers {
  [modifier: string]: boolean;
  today: boolean;
  selected: boolean;
  disabled: boolean;
  hidden: boolean;
  outside: boolean;
  focused: boolean;
  range_start: boolean;
  range_middle: boolean;
  range_end: boolean;
}

interface DateOptions {
  locale: Locale;
}

/** How the calendar writes its text; each takes react-day-picker's arguments and defaults to its output. */
interface Formatters {
  formatCaption: (month: Date, options: DateOptions) => string;
  formatDay: (date: Date, options: DateOptions) => string;
  formatWeekdayName: (weekday: Date, options: DateOptions) => string;
  formatMonthDropdown: (month: Date, options: DateOptions) => string;
  formatYearDropdown: (year: Date, options: DateOptions) => string;
  formatWeekNumber: (weekNumber: number) => string;
}

/** What a screen reader reads for each part; each takes react-day-picker's arguments and defaults to its text. */
interface Labels {
  labelDayButton: (date: Date, modifiers: DayModifiers, options: DateOptions) => string;
  labelGrid: (month: Date, options: DateOptions) => string;
  labelWeekday: (weekday: Date, options: DateOptions) => string;
  labelNext: (month: Date | undefined) => string;
  labelPrevious: (month: Date | undefined) => string;
  labelMonthDropdown: () => string;
  labelYearDropdown: () => string;
  labelWeekNumber: (weekNumber: number) => string;
}

const DEFAULT_FORMATTERS: Formatters = {
  formatCaption: (month, { locale }) => format(month, 'LLLL y', { locale }),
  formatDay: (date, { locale }) => format(date, 'd', { locale }),
  formatWeekdayName: (weekday, { locale }) => format(weekday, 'cccccc', { locale }),
  formatMonthDropdown: (month, { locale }) => format(month, 'LLL', { locale }),
  formatYearDropdown: (year, { locale }) => format(year, 'yyyy', { locale }),
  formatWeekNumber: (weekNumber) => (weekNumber < 10 ? `0${weekNumber}` : String(weekNumber)),
};

const DEFAULT_LABELS: Labels = {
  labelDayButton: (date, modifiers, { locale }) => {
    const label = format(date, 'PPPP', { locale });
    return `${modifiers.today ? 'Today, ' : ''}${label}${modifiers.selected ? ', selected' : ''}`;
  },
  labelGrid: (month, { locale }) => format(month, 'LLLL y', { locale }),
  labelWeekday: (weekday, { locale }) => format(weekday, 'cccc', { locale }),
  labelNext: () => 'Go to the Next Month',
  labelPrevious: () => 'Go to the Previous Month',
  labelMonthDropdown: () => 'Choose the Month',
  labelYearDropdown: () => 'Choose the Year',
  labelWeekNumber: (weekNumber) => `Week ${weekNumber}`,
};

/** React Native's Role names no `gridcell`; React Native Web writes any role it is given onto the element. */
const GRIDCELL = 'gridcell' as Role;
const WEB = Platform.OS === 'web';

function isRange(matcher: Matcher): matcher is DateRange {
  return typeof matcher === 'object' && 'from' in matcher;
}

function isDateList(matcher: unknown): matcher is readonly Date[] {
  return Array.isArray(matcher) && matcher.every((entry) => entry instanceof Date);
}

/** Whether `date` matches `matcher`, in react-day-picker's sense of each kind. */
function matches(date: Date, matcher: Matcher): boolean {
  if (typeof matcher === 'boolean') return matcher;
  if (typeof matcher === 'function') return matcher(date);
  if (matcher instanceof Date) return isSameDay(date, matcher);
  if (isDateList(matcher)) return matcher.some((entry) => isSameDay(date, entry));
  if (isRange(matcher)) return inRange(date, matcher);
  if ('dayOfWeek' in matcher) {
    const days: readonly number[] = typeof matcher.dayOfWeek === 'number' ? [matcher.dayOfWeek] : matcher.dayOfWeek;
    return days.includes(date.getDay());
  }
  if ('before' in matcher && 'after' in matcher) {
    const before = differenceInCalendarDays(matcher.before, date) > 0;
    const after = differenceInCalendarDays(date, matcher.after) > 0;
    // Before a day that comes after the other is the days between them; otherwise the days outside them.
    return isAfter(matcher.before, matcher.after) ? before && after : before || after;
  }
  if ('before' in matcher) return differenceInCalendarDays(matcher.before, date) > 0;
  if ('after' in matcher) return differenceInCalendarDays(date, matcher.after) > 0;
  return false;
}

function matchesAny(date: Date, matcher: Matcher | readonly Matcher[] | undefined): boolean {
  if (matcher === undefined) return false;
  if (Array.isArray(matcher) && !isDateList(matcher)) {
    return (matcher as readonly Matcher[]).some((entry) => matches(date, entry));
  }
  return matches(date, matcher as Matcher);
}

function inRange(date: Date, { from, to }: DateRange): boolean {
  if (from === undefined) return false;
  if (to === undefined) return isSameDay(date, from);
  const [start, end] = isAfter(from, to) ? [to, from] : [from, to];
  return differenceInCalendarDays(date, start) >= 0 && differenceInCalendarDays(end, date) >= 0;
}

/** The range after a press on `date`, as react-day-picker's `addToRange` makes it. */
function addToRange(date: Date, range: DateRange | undefined, min: number, max: number, required: boolean) {
  const { from, to } = range ?? {};
  let next: DateRange | undefined;
  if (from === undefined) {
    next = { from: date, to: min > 0 ? undefined : date };
  } else if (to === undefined) {
    if (isSameDay(from, date)) next = min === 0 ? { from, to: date } : required ? { from, to: undefined } : undefined;
    else next = isBefore(date, from) ? { from: date, to: from } : { from, to: date };
  } else if (isSameDay(from, date) && isSameDay(to, date)) {
    next = required ? { from, to } : undefined;
  } else if (isSameDay(from, date)) {
    next = { from, to: min > 0 ? undefined : date };
  } else if (isSameDay(to, date)) {
    next = { from: date, to: min > 0 ? undefined : date };
  } else {
    next = isBefore(date, from) ? { from: date, to } : { from, to: date };
  }
  if (next?.from !== undefined && next.to !== undefined) {
    const length = differenceInCalendarDays(next.to, next.from);
    if ((max > 0 && length > max) || (min > 1 && length < min)) next = { from: date, to: undefined };
  }
  return next;
}

type CalendarDayButtonProps = Omit<PressableProps, 'children'> & {
  ref?: Ref<ComponentRef<typeof Pressable>>;
  day: CalendarDay;
  modifiers: DayModifiers;
  locale?: Locale;
  children?: ReactNode;
};

/**
 * The button a day is drawn as: primary while selected or at a range's ends, muted between them, muted text
 * outside the month, and dimmed while disabled. Pass it, or one built on it, as `components.DayButton`.
 */
function CalendarDayButton({ className, day, modifiers, locale, children, ...props }: CalendarDayButtonProps) {
  const single = modifiers.selected && !modifiers.range_start && !modifiers.range_end && !modifiers.range_middle;
  const primary = single || modifiers.range_start || modifiers.range_end;
  return (
    <Pressable
      role="button"
      className={cn(
        'flex-1 items-center justify-center rounded-md active:bg-muted',
        primary && 'bg-primary active:bg-primary',
        modifiers.range_middle && 'rounded-none bg-muted',
        modifiers.disabled && 'opacity-50',
        className,
      )}
      {...props}
    >
      <Text
        className={cn(
          'text-sm',
          (modifiers.outside || modifiers.disabled) && 'text-muted-foreground',
          primary && 'text-primary-foreground',
        )}
      >
        {children ?? format(day.date, 'd', { locale: locale ?? enUS })}
      </Text>
    </Pressable>
  );
}

interface CalendarSharedProps {
  /** The Button variant of the previous and next month buttons. */
  buttonVariant?: ButtonProps['variant'];
  /** The first month drawn; pass it to control the month, and follow `onMonthChange`. */
  month?: Date;
  /** The first month drawn at the start, when the calendar holds its own; today's when left out. */
  defaultMonth?: Date;
  /** Called with the new first month when the calendar moves to another. */
  onMonthChange?: (month: Date) => void;
  /** The earliest month the calendar moves to. */
  startMonth?: Date;
  /** The latest month the calendar moves to. */
  endMonth?: Date;
  /** How many months are drawn, one under another; 1 by default. */
  numberOfMonths?: number;
  /** Moves by `numberOfMonths` months at a time instead of one. */
  pagedNavigation?: boolean;
  /** Disables the previous and next buttons and the keyboard's moves to another month. */
  disableNavigation?: boolean;
  /** Leaves out the previous and next buttons. */
  hideNavigation?: boolean;
  /** The caption as text (`label`), or as dropdowns of the months, the years or both. */
  captionLayout?: 'label' | 'dropdown' | 'dropdown-months' | 'dropdown-years';
  /** Lists the years in the year dropdown latest first. */
  reverseYears?: boolean;
  /** Draws the days of the weeks either side of the month; true by default. */
  showOutsideDays?: boolean;
  /** Draws six weeks for every month. */
  fixedWeeks?: boolean;
  /** Draws the week's number before each week. */
  showWeekNumber?: boolean;
  /** The first day of the week, 0 for Sunday; the locale's when left out. */
  weekStartsOn?: Day;
  /** The date-fns locale the calendar writes its text in; English (US) when left out. */
  locale?: Locale;
  /** The day marked as today; the device's when left out. */
  today?: Date;
  /** Days that take no press and are announced disabled. */
  disabled?: Matcher | readonly Matcher[];
  /** Days drawn as blank space. */
  hidden?: Matcher | readonly Matcher[];
  /** Modifiers of your own, each the days it matches, which the day's `modifiers` then carry by name. */
  modifiers?: Record<string, Matcher | readonly Matcher[] | undefined>;
  /** Classes added to the cell of each day a modifier, built in or your own, is true for. */
  modifiersClassNames?: Record<string, string>;
  /** Styles added to the cell of each day a modifier, built in or your own, is true for. */
  modifiersStyles?: Record<string, StyleProp<ViewStyle>>;
  /** Called with a pressed day and its modifiers; with it the days are buttons even without a `mode`. */
  onDayClick?: (date: Date, modifiers: DayModifiers, event: GestureResponderEvent) => void;
  /** Drawn under the months, in a polite live region; a string is drawn as text. */
  footer?: ReactNode;
  formatters?: Partial<Formatters>;
  labels?: Partial<Labels>;
  /** The component each day is drawn with, such as one built on CalendarDayButton. */
  components?: { DayButton?: ComponentType<CalendarDayButtonProps> };
}

type CalendarSelectionProps =
  | { mode?: undefined; selected?: undefined; onSelect?: undefined; required?: undefined }
  | {
      mode: 'single';
      /** The selected day; with `onSelect` the calendar follows it, without it the calendar holds its own. */
      selected?: Date;
      onSelect?: (date: Date | undefined, triggerDate: Date) => void;
      /** Keeps a day selected: a press on the selected day leaves it so. */
      required?: boolean;
    }
  | {
      mode: 'multiple';
      selected?: readonly Date[];
      onSelect?: (dates: Date[] | undefined, triggerDate: Date) => void;
      required?: boolean;
      /** The fewest days that stay selected. */
      min?: number;
      /** The most days selected; a press past it starts again from that day. */
      max?: number;
    }
  | {
      mode: 'range';
      selected?: DateRange;
      onSelect?: (range: DateRange | undefined, triggerDate: Date) => void;
      required?: boolean;
      /** The fewest nights a range spans. */
      min?: number;
      /** The most nights a range spans. */
      max?: number;
    };

type CalendarProps = Omit<ViewProps, 'children'> & CalendarSharedProps & CalendarSelectionProps;

/** The selection a mode holds, and what a press on a day does to it. */
function useSelection(props: CalendarSelectionProps) {
  const [own, setOwn] = useState<Date | readonly Date[] | DateRange | undefined>(props.selected);
  // react-day-picker follows `selected` only with `onSelect`; without one it holds its own.
  const selected = props.onSelect === undefined ? own : props.selected;

  const isSelected = (date: Date): boolean => {
    if (selected === undefined) return false;
    if (props.mode === 'single') return isSameDay(selected as Date, date);
    if (props.mode === 'multiple') return (selected as readonly Date[]).some((entry) => isSameDay(entry, date));
    if (props.mode === 'range') return inRange(date, selected as DateRange);
    return false;
  };

  const rangeOf = (date: Date): Pick<DayModifiers, 'range_start' | 'range_middle' | 'range_end'> => {
    const range = props.mode === 'range' ? (selected as DateRange | undefined) : undefined;
    if (range?.from === undefined || !inRange(date, range)) {
      return { range_start: false, range_middle: false, range_end: false };
    }
    const start = isSameDay(date, range.from);
    const end = isSameDay(date, range.to ?? range.from);
    return { range_start: start, range_end: end, range_middle: !start && !end };
  };

  const select = (date: Date): void => {
    if (props.mode === 'single') {
      const current = selected as Date | undefined;
      const next = !props.required && current !== undefined && isSameDay(current, date) ? undefined : date;
      setOwn(next);
      props.onSelect?.(next, date);
    } else if (props.mode === 'multiple') {
      const current = (selected as readonly Date[] | undefined) ?? [];
      let next: Date[];
      if (current.some((entry) => isSameDay(entry, date))) {
        if (current.length === props.min || (props.required && current.length === 1)) return;
        next = current.filter((entry) => !isSameDay(entry, date));
      } else {
        next = current.length === props.max ? [date] : [...current, date];
      }
      setOwn(next);
      props.onSelect?.(next, date);
    } else if (props.mode === 'range') {
      const next = addToRange(
        date,
        selected as DateRange | undefined,
        props.min ?? 0,
        props.max ?? 0,
        props.required ?? false,
      );
      setOwn(next);
      props.onSelect?.(next, date);
    }
  };

  const firstSelected = (): Date | undefined => {
    if (selected === undefined) return undefined;
    if (selected instanceof Date) return selected;
    if (Array.isArray(selected)) return (selected as readonly Date[])[0];
    return (selected as DateRange).from;
  };

  return { isSelected, rangeOf, select, firstSelected };
}

/** The weeks of `month`, each seven days from the week's first day, six of them when `fixedWeeks`. */
function weeksOf(month: Date, weekStartsOn: Day, locale: Locale, fixedWeeks: boolean): Date[][] {
  const first = startOfWeek(month, { weekStartsOn, locale });
  const last = endOfWeek(endOfMonth(month), { weekStartsOn, locale });
  const days = differenceInCalendarDays(last, first) + 1;
  const count = fixedWeeks ? Math.max(42, days) : days;
  const weeks: Date[][] = [];
  for (let i = 0; i < count; i += 7) {
    weeks.push(Array.from({ length: 7 }, (_, offset) => addDays(first, i + offset)));
  }
  return weeks;
}

function dayKey(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

/**
 * Where a key moves the focused day, as react-day-picker moves it: the left and right arrows go to the day
 * drawn on that side, the day before in text read left to right and the day after in text read right to left.
 */
function movedBy(
  key: string,
  shiftKey: boolean,
  date: Date,
  weekStartsOn: Day,
  locale: Locale,
  rtl: boolean,
): Date | undefined {
  switch (key) {
    case 'ArrowLeft':
      return addDays(date, rtl ? 1 : -1);
    case 'ArrowRight':
      return addDays(date, rtl ? -1 : 1);
    case 'ArrowUp':
      return addWeeks(date, -1);
    case 'ArrowDown':
      return addWeeks(date, 1);
    case 'PageUp':
      return shiftKey ? addYears(date, -1) : addMonths(date, -1);
    case 'PageDown':
      return shiftKey ? addYears(date, 1) : addMonths(date, 1);
    case 'Home':
      return startOfWeek(date, { weekStartsOn, locale });
    case 'End':
      return endOfWeek(date, { weekStartsOn, locale });
    default:
      return undefined;
  }
}

/**
 * A month's grid of days, with its caption and buttons to the previous and next month, on which a day, several
 * days or a range of days is selected. Today is marked, and each day is a button announced by its full date,
 * with "Today" before it and "selected" after it. On the web the months are grids, and the arrow keys, Page
 * Up and Page Down (with Shift, a year), Home and End move between the days.
 */
/** Mirrors an arrow drawn for text read left to right, so it points the same way in text read right to left. */
const MIRRORED = { transform: [{ scaleX: -1 }] };

function Calendar(props: CalendarProps): ReactNode {
  const rtl = useDirection() === 'rtl';
  const {
    className,
    buttonVariant = 'ghost',
    month: monthProp,
    defaultMonth,
    onMonthChange,
    startMonth: startMonthProp,
    endMonth: endMonthProp,
    numberOfMonths = 1,
    pagedNavigation = false,
    disableNavigation = false,
    hideNavigation = false,
    captionLayout = 'label',
    reverseYears = false,
    showOutsideDays = true,
    fixedWeeks = false,
    showWeekNumber = false,
    weekStartsOn: weekStartsOnProp,
    locale = enUS,
    today: todayProp,
    disabled,
    hidden,
    modifiers: customModifiers,
    modifiersClassNames,
    modifiersStyles,
    onDayClick,
    footer,
    formatters: formattersProp,
    labels: labelsProp,
    components,
    mode,
    selected,
    onSelect,
    required,
    ...rest
  } = props;
  const { min, max, ...viewProps } = rest as typeof rest & { min?: number; max?: number };
  const selection = useSelection({ mode, selected, onSelect, required, min, max } as CalendarSelectionProps);
  const formatters = { ...DEFAULT_FORMATTERS, ...formattersProp };
  const labels = { ...DEFAULT_LABELS, ...labelsProp };
  const options = { locale };
  const weekStartsOn = weekStartsOnProp ?? locale.options?.weekStartsOn ?? 0;
  const today = startOfDay(todayProp ?? new Date());
  const DayButton = components?.DayButton ?? CalendarDayButton;

  const yearDropdown = captionLayout === 'dropdown' || captionLayout === 'dropdown-years';
  const startMonth = startMonthProp
    ? startOfMonth(startMonthProp)
    : yearDropdown
      ? startOfYear(addYears(today, -100))
      : undefined;
  const endMonth = endMonthProp
    ? startOfMonth(endMonthProp)
    : yearDropdown
      ? startOfMonth(endOfYear(today))
      : undefined;

  const bounded = (wanted: Date): Date => {
    let first = startOfMonth(wanted);
    if (endMonth && differenceInCalendarMonths(endMonth, first) < numberOfMonths - 1) {
      first = addMonths(endMonth, 1 - numberOfMonths);
    }
    if (startMonth && differenceInCalendarMonths(first, startMonth) < 0) first = startMonth;
    return first;
  };

  const [ownMonth, setOwnMonth] = useState(() => bounded(monthProp ?? defaultMonth ?? today));
  const firstMonth = monthProp ? startOfMonth(monthProp) : ownMonth;
  const months = Array.from({ length: numberOfMonths }, (_, i) => addMonths(firstMonth, i));
  const lastMonth = months[months.length - 1];

  const goTo = (wanted: Date): void => {
    const next = bounded(wanted);
    if (isSameMonth(next, firstMonth)) return;
    setOwnMonth(next);
    onMonthChange?.(next);
    // iOS reads no live region, so the caption's change is announced there.
    if (Platform.OS === 'ios') AccessibilityInfo.announceForAccessibility(formatters.formatCaption(next, options));
  };

  const step = pagedNavigation ? numberOfMonths : 1;
  const previousMonth =
    disableNavigation || (startMonth && differenceInCalendarMonths(firstMonth, startMonth) <= 0)
      ? undefined
      : addMonths(firstMonth, -step);
  const nextMonth =
    disableNavigation || (endMonth && differenceInCalendarMonths(endMonth, lastMonth) <= 0)
      ? undefined
      : addMonths(firstMonth, step);

  const isDisabled = (date: Date): boolean => matchesAny(date, disabled);
  const isHidden = (date: Date, displayMonth: Date): boolean =>
    matchesAny(date, hidden) || (!isSameMonth(date, displayMonth) && !showOutsideDays);
  const isShown = (date: Date): boolean => months.some((month) => isSameMonth(date, month));

  // The day the keyboard is on, and whether it got there by a key, which is what moves the focus to it.
  const [focused, setFocused] = useState<Date>();
  const movedByKey = useRef(false);
  const dayRefs = useRef(new Map<string, ComponentRef<typeof Pressable>>());
  useEffect(() => {
    if (!movedByKey.current || focused === undefined) return;
    movedByKey.current = false;
    dayRefs.current.get(dayKey(focused))?.focus();
  }, [focused, firstMonth]);

  const tabStop = (() => {
    const candidates = [focused, selection.firstSelected(), today];
    const shown = candidates.find((date) => date !== undefined && isShown(date) && !isDisabled(date));
    if (shown) return shown;
    for (let date = firstMonth; isSameMonth(date, firstMonth); date = addDays(date, 1)) {
      if (!isDisabled(date) && !matchesAny(date, hidden)) return date;
    }
    return undefined;
  })();

  const onKeyDown = (date: Date, event: KeyDownEvent): void => {
    const { key, shiftKey } = event.nativeEvent;
    let next = movedBy(key, shiftKey, date, weekStartsOn, locale, rtl);
    if (next === undefined) return;
    event.preventDefault();
    for (let attempt = 0; attempt < 365 && (isDisabled(next) || matchesAny(next, hidden)); attempt += 1) {
      next = movedBy(key, shiftKey, next, weekStartsOn, locale, rtl) ?? next;
    }
    if (startMonth && isBefore(next, startMonth)) next = startMonth;
    if (endMonth && isAfter(next, endOfMonth(endMonth))) next = endOfMonth(endMonth);
    if (!isShown(next)) {
      if (disableNavigation) return;
      goTo(isBefore(next, firstMonth) ? next : addMonths(next, 1 - numberOfMonths));
    }
    movedByKey.current = true;
    setFocused(next);
  };

  const navButton = (target: Date | undefined, label: string, side: 'previous' | 'next') => (
    <Button
      variant={buttonVariant}
      size="icon"
      aria-label={label}
      disabled={target === undefined}
      onPress={() => target && goTo(target)}
      className="cn-calendar@part=cell p-0"
    >
      <Icon
        as={side === 'previous' ? ChevronLeft : ChevronRight}
        className="size-4"
        style={rtl ? MIRRORED : undefined}
      />
    </Button>
  );

  const caption = (month: Date) => {
    if (captionLayout === 'label') {
      return (
        <Text aria-live="polite" className="font-sans-medium text-sm">
          {formatters.formatCaption(month, options)}
        </Text>
      );
    }
    const monthOptions = Array.from({ length: 12 }, (_, index) => setMonth(startOfYear(month), index)).map((entry) => ({
      label: formatters.formatMonthDropdown(entry, options),
      value: String(entry.getMonth()),
      disabled:
        (startMonth !== undefined && isBefore(entry, startMonth)) ||
        (endMonth !== undefined && isAfter(entry, endMonth)),
    }));
    const firstYear = (startMonth ?? addYears(month, -100)).getFullYear();
    const lastYear = (endMonth ?? month).getFullYear();
    const yearOptions = Array.from({ length: lastYear - firstYear + 1 }, (_, index) => {
      const year = setYear(startOfYear(month), firstYear + index);
      return { label: formatters.formatYearDropdown(year, options), value: String(year.getFullYear()) };
    });
    if (reverseYears) yearOptions.reverse();
    const dropdown = (
      label: string,
      value: string,
      items: ReadonlyArray<{ label: string; value: string; disabled?: boolean }>,
      onChange: (value: string) => void,
    ) => (
      <Select value={value} onValueChange={onChange} items={items}>
        <SelectTrigger size="sm" aria-label={label} className="cn-calendar-caption-label">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {items.map((item) => (
            <SelectItem key={item.value} value={item.value} disabled={item.disabled}>
              {item.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
    return (
      <View className="flex-row items-center justify-center gap-1.5">
        {captionLayout !== 'dropdown-years' &&
          dropdown(labels.labelMonthDropdown(), String(month.getMonth()), monthOptions, (value) =>
            goTo(setMonth(month, Number(value))),
          )}
        {captionLayout !== 'dropdown-months' &&
          dropdown(labels.labelYearDropdown(), String(month.getFullYear()), yearOptions, (value) =>
            goTo(setYear(month, Number(value))),
          )}
      </View>
    );
  };

  const weekdays = weeksOf(firstMonth, weekStartsOn, locale, false)[0];

  return (
    <View className={cn('self-start bg-background cn-calendar', className)} {...viewProps}>
      <View className="relative gap-4">
        {!hideNavigation && (
          <View
            pointerEvents="box-none"
            className="absolute inset-x-0 top-0 z-10 flex-row items-center justify-between gap-1"
          >
            {navButton(previousMonth, labels.labelPrevious(previousMonth), 'previous')}
            {navButton(nextMonth, labels.labelNext(nextMonth), 'next')}
          </View>
        )}
        {months.map((month) => (
          <View key={dayKey(month)} className="gap-4">
            <View className="cn-calendar@part=caption w-full flex-row items-center justify-center">
              {caption(month)}
            </View>
            <View role={WEB ? 'grid' : undefined} aria-label={WEB ? labels.labelGrid(month, options) : undefined}>
              <View role={WEB ? 'row' : undefined} className="flex-row">
                {showWeekNumber && <View className="cn-calendar@part=column" />}
                {weekdays.map((weekday) => (
                  <View
                    key={weekday.getDay()}
                    role={WEB ? 'columnheader' : undefined}
                    accessible
                    aria-label={labels.labelWeekday(weekday, options)}
                    className="cn-calendar@part=column items-center"
                  >
                    <Text className="text-muted-foreground text-[0.8rem]">
                      {formatters.formatWeekdayName(weekday, options)}
                    </Text>
                  </View>
                ))}
              </View>
              {weeksOf(month, weekStartsOn, locale, fixedWeeks).map((week) => (
                <View key={dayKey(week[0])} role={WEB ? 'row' : undefined} className="mt-2 flex-row">
                  {showWeekNumber && (
                    <View
                      accessible
                      aria-label={labels.labelWeekNumber(getWeek(week[0], { weekStartsOn, locale }))}
                      className="cn-calendar@part=cell items-center justify-center"
                    >
                      <Text className="text-muted-foreground text-[0.8rem]">
                        {formatters.formatWeekNumber(getWeek(week[0], { weekStartsOn, locale }))}
                      </Text>
                    </View>
                  )}
                  {week.map((date, column) => {
                    const outside = !isSameMonth(date, month);
                    const modifiers: DayModifiers = {
                      ...Object.fromEntries(
                        Object.entries(customModifiers ?? {}).map(([name, matcher]) => [
                          name,
                          matchesAny(date, matcher),
                        ]),
                      ),
                      today: isSameDay(date, today),
                      selected: selection.isSelected(date),
                      disabled: isDisabled(date),
                      hidden: isHidden(date, month),
                      outside,
                      focused: focused !== undefined && isSameDay(date, focused),
                      ...selection.rangeOf(date),
                    };
                    const { range_start: rangeStart, range_end: rangeEnd, range_middle: rangeMiddle } = modifiers;
                    const ownsTabStop = !outside && tabStop !== undefined && isSameDay(date, tabStop);
                    // A range's strip is rounded where a week starts or ends inside it.
                    const weekStart = rangeMiddle && column === 0;
                    const weekEnd = rangeMiddle && column === week.length - 1;
                    const active = Object.keys(modifiers).filter((name) => modifiers[name]);
                    return (
                      <View
                        key={dayKey(date)}
                        role={WEB ? GRIDCELL : undefined}
                        aria-selected={WEB && mode !== undefined ? modifiers.selected : undefined}
                        className={cn(
                          'cn-calendar@part=cell',
                          modifiers.today && !modifiers.selected && 'rounded-md bg-muted',
                          rangeStart && !rangeEnd && 'rounded-l-md bg-muted',
                          rangeEnd && !rangeStart && 'rounded-r-md bg-muted',
                          rangeMiddle && 'bg-muted',
                          weekStart && 'overflow-hidden rounded-l-md',
                          weekEnd && 'overflow-hidden rounded-r-md',
                          active.map((name) => modifiersClassNames?.[name]),
                        )}
                        style={modifiersStyles && active.map((name) => modifiersStyles[name])}
                      >
                        {modifiers.hidden ? null : mode === undefined && onDayClick === undefined ? (
                          <View className="flex-1 items-center justify-center">
                            <Text className={cn('text-sm', outside && 'text-muted-foreground')}>
                              {formatters.formatDay(date, options)}
                            </Text>
                          </View>
                        ) : (
                          <DayButton
                            ref={(node: ComponentRef<typeof Pressable> | null) => {
                              if (outside) return;
                              if (node) dayRefs.current.set(dayKey(date), node);
                              else dayRefs.current.delete(dayKey(date));
                            }}
                            day={{ date, displayMonth: month, outside }}
                            modifiers={modifiers}
                            locale={locale}
                            aria-label={labels.labelDayButton(date, modifiers, options)}
                            aria-disabled={modifiers.disabled}
                            disabled={modifiers.disabled}
                            tabIndex={WEB ? (ownsTabStop ? 0 : -1) : undefined}
                            onFocus={() => setFocused(date)}
                            onKeyDown={(event: KeyDownEvent) => onKeyDown(date, event)}
                            onPress={(event: GestureResponderEvent) => {
                              setFocused(date);
                              selection.select(date);
                              onDayClick?.(date, modifiers, event);
                            }}
                          >
                            {formatters.formatDay(date, options)}
                          </DayButton>
                        )}
                      </View>
                    );
                  })}
                </View>
              ))}
            </View>
          </View>
        ))}
      </View>
      {footer !== undefined && (
        <View role={WEB ? 'status' : undefined} aria-live="polite" className="mt-4">
          {typeof footer === 'string' ? <Text className="text-sm">{footer}</Text> : footer}
        </View>
      )}
    </View>
  );
}

export { Calendar, CalendarDayButton };
export type {
  CalendarDay,
  CalendarDayButtonProps,
  CalendarProps,
  DateRange,
  DayModifiers,
  Formatters,
  Labels,
  Matcher,
};
