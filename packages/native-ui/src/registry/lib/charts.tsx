/**
 * The chart parts upstream's chart demos take from Recharts, in Recharts' names and with the props those
 * demos use, drawn with react-native-svg so they run on a device and in the browser. They are the responsive
 * container; the bar, line and area charts and their series; the pie chart, its slices, its label and the
 * text it draws; the axes, the grid, the tooltip and the legend. A part reads its colours, such as
 * `var(--color-desktop)`, through the palette the chart's container provides.
 */
import { scaleBand, scaleLinear, scalePoint } from 'd3-scale';
import {
  curveBasis,
  curveBumpX,
  curveLinear,
  curveMonotoneX,
  curveMonotoneY,
  curveNatural,
  curveStep,
  curveStepAfter,
  curveStepBefore,
  arc as arcPath,
  area as areaPath,
  line as linePath,
  type CurveFactory,
} from 'd3-shape';
import {
  Children,
  cloneElement,
  createContext,
  isValidElement,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ComponentProps,
  type ComponentRef,
  type ReactElement,
  type ReactNode,
} from 'react';
import {
  Platform,
  Text as NativeText,
  View,
  type AccessibilityActionEvent,
  type GestureResponderEvent,
  type KeyDownEvent,
  type LayoutChangeEvent,
  type PointerEvent,
} from 'react-native';
import Animated, {
  Easing,
  useAnimatedProps,
  useSharedValue,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import Svg, { Circle, ClipPath, Defs, G, Line as SvgLine, Mask, Path, Rect, Text as SvgText } from 'react-native-svg';
import { useReducedMotion } from './motion';

/** One row of a chart's `data`, such as `{ month: "January", desktop: 186 }`. */
type ChartDatum = Readonly<Record<string, unknown>>;

/**
 * How a chart's parts read colours and names: the container of upstream's chart provides it, as its
 * stylesheet provides the `--color-<key>` variables on the web.
 */
interface ChartPalette {
  /**
   * The colour to draw for `value` as a part is given it: `var(--color-<key>)`, a theme variable such as
   * `var(--chart-1)`, or a colour. `undefined` for none.
   */
  resolveColor: (value: string | undefined) => string | undefined;
  /** The name a screen reader hears for the series or the category `key`, such as `Desktop` for `desktop`. */
  nameOf: (key: string) => string | undefined;
}

const ChartPaletteContext = createContext<ChartPalette>({
  resolveColor: (value) => value,
  nameOf: () => undefined,
});

/** The colours a part draws where upstream's chart container styles Recharts' own. */
const THEME = {
  tick: 'var(--muted-foreground)',
  grid: 'var(--border)',
  cursorFill: 'var(--muted)',
  cursorStroke: 'var(--border)',
  surface: 'var(--background)',
} as const;

/** Recharts' colour for a series given none. */
const DEFAULT_SERIES_COLOR = '#3182bd';

// ---------------------------------------------------------------------------------------------------------
// Size

interface ChartSize {
  width: number;
  height: number;
}

const ChartSizeContext = createContext<ChartSize | undefined>(undefined);

type ResponsiveContainerProps = {
  /** The size drawn before the container has been measured. */
  initialDimension?: ChartSize;
  children?: ReactNode;
};

/** Fills its parent and gives the chart inside it the size it was laid out at. */
function ResponsiveContainer({
  initialDimension = { width: 320, height: 200 },
  children,
}: ResponsiveContainerProps): ReactNode {
  const [size, setSize] = useState<ChartSize>(initialDimension);
  const onLayout = (event: LayoutChangeEvent): void => {
    const { width, height } = event.nativeEvent.layout;
    setSize((current) => (current.width === width && current.height === height ? current : { width, height }));
  };
  return (
    <View onLayout={onLayout} className="w-full flex-1 self-stretch">
      <ChartSizeContext.Provider value={size}>{children}</ChartSizeContext.Provider>
    </View>
  );
}

function useChartSize(width: number | undefined, height: number | undefined): ChartSize | undefined {
  const measured = useContext(ChartSizeContext);
  if (width !== undefined && height !== undefined) return { width, height };
  return measured;
}

// ---------------------------------------------------------------------------------------------------------
// Motion

/** Recharts' entrance: one and a half seconds on CSS's `ease`. */
const ENTRANCE_MS = 1500;
const EASE = Easing.bezier(0.25, 0.1, 0.25, 1);

const AnimatedRect = Animated.createAnimatedComponent(Rect);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

/**
 * The share of a chart's entrance drawn so far, from 0 to 1, run by Reanimated so the chart is not drawn
 * again for each frame. It is 1 from the start where `animate` is false or the system asks for reduced motion.
 */
function useEntrance(animate: boolean, duration: number): SharedValue<number> {
  const reduced = useReducedMotion();
  const still = !animate || reduced;
  const progress = useSharedValue(still ? 1 : 0);
  useEffect(() => {
    progress.value = still ? 1 : withTiming(1, { duration, easing: EASE });
  }, [progress, still, duration]);
  return progress;
}

/** Where an entrance comes in from: up from the axis for bars, from a side for lines and areas. */
type EntranceDirection = 'up' | 'right' | 'left';

/**
 * A clip path, named `id`, over the part of the chart its entrance has reached, which the series drawn
 * through it grow into.
 */
function EntranceClip({
  id,
  progress,
  plot,
  size,
  direction,
}: {
  id: string;
  progress: SharedValue<number>;
  plot: Plot;
  size: ChartSize;
  direction: EntranceDirection;
}): ReactNode {
  // The clip reaches past the plot's edge by the room a point's circle takes.
  const reach = 8;
  const span = plot.right - plot.left + reach;
  const animatedProps = useAnimatedProps(() => {
    const share = progress.value;
    if (direction === 'up') {
      const top = plot.bottom * (1 - share);
      return { x: 0, y: top, width: size.width, height: size.height - top };
    }
    const width = plot.left + span * share;
    return { x: direction === 'right' ? 0 : size.width - width, y: 0, width, height: size.height };
  });
  return (
    <Defs>
      <ClipPath id={id}>
        <AnimatedRect testID="chart-entrance" animatedProps={animatedProps} />
      </ClipPath>
    </Defs>
  );
}

/**
 * A mask, named `id`, over the sector of a ring its entrance has swept, from `startAngle` towards
 * `endAngle` in degrees anticlockwise from three o'clock, as Recharts sweeps a pie in.
 */
function SweepMask({
  id,
  progress,
  cx,
  cy,
  radius,
  startAngle,
  endAngle,
}: {
  id: string;
  progress: SharedValue<number>;
  cx: number;
  cy: number;
  radius: number;
  startAngle: number;
  endAngle: number;
}): ReactNode {
  // A circle of half the radius stroked as wide as the radius covers the ring out to it; its dash, which
  // starts at three o'clock and runs clockwise, is the swept sector.
  const half = radius / 2;
  const circumference = 2 * Math.PI * half;
  const sweep = Math.min(360, Math.abs(endAngle - startAngle)) / 360;
  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - sweep * progress.value),
  }));
  const mirror = endAngle > startAngle ? ` translate(0 ${2 * cy}) scale(1 -1)` : '';
  return (
    <Defs>
      <Mask id={id} maskUnits="userSpaceOnUse" x={cx - radius} y={cy - radius} width={radius * 2} height={radius * 2}>
        <AnimatedCircle
          testID="chart-entrance"
          cx={cx}
          cy={cy}
          r={half}
          fill="none"
          stroke="white"
          strokeWidth={radius + 2}
          strokeDasharray={[circumference, circumference]}
          transform={`rotate(${-startAngle} ${cx} ${cy})${mirror}`}
          animatedProps={animatedProps}
        />
      </Mask>
    </Defs>
  );
}

// ---------------------------------------------------------------------------------------------------------
// Configuration parts: each draws nothing itself, and the chart around it reads its props.

/** An item of the payload a tooltip's content is given, one per series at the active point. */
interface TooltipPayloadItem {
  dataKey?: string;
  name?: string;
  value?: number | string;
  /** The series' colour as the series was given it, such as `var(--color-desktop)`. */
  color?: string;
  fill?: string;
  stroke?: string;
  /** The row of data the point comes from. */
  payload?: ChartDatum;
  type?: string;
}

/** What a tooltip's `content` is drawn with, as Recharts hands it. */
interface TooltipContentProps {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  /** The active category, such as `January`. */
  label?: unknown;
  coordinate?: { x: number; y: number };
}

interface CursorProps {
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
}

type TooltipProps = {
  /** Every other prop is handed to `content`, as Recharts hands it, such as ChartTooltipContent's `labelClassName`. */
  [prop: string]: unknown;
  /** The element drawn for the active point, cloned with {@link TooltipContentProps}, or a function drawing it. */
  content?: ReactElement | ((props: TooltipContentProps) => ReactNode);
  /** The band or the line drawn behind the active point; `false` draws none. */
  cursor?: boolean | CursorProps;
  /** The point active before anyone presses the chart. */
  defaultIndex?: number;
  /** The distance from the active point to the tooltip, in pixels. */
  offset?: number;
};

/**
 * Shows the values at the point a press, a pointer or the arrow keys make active. Placed inside a chart,
 * it draws nothing itself.
 */
function Tooltip(_props: TooltipProps): ReactNode {
  return null;
}

/** An item of the payload a legend's content is given, one per series, or per slice of a pie. */
interface LegendPayloadItem {
  /** The series' name, such as `desktop`. */
  value?: string;
  dataKey?: string;
  color?: string;
  type?: string;
  payload?: ChartDatum;
}

/** What a legend's `content` is drawn with, as Recharts hands it. */
interface LegendContentProps {
  payload?: LegendPayloadItem[];
  verticalAlign?: 'top' | 'middle' | 'bottom';
}

type LegendProps = {
  /** The element drawn for the legend, cloned with {@link LegendContentProps}, or a function drawing it. */
  content?: ReactElement | ((props: LegendContentProps) => ReactNode);
  /** Whether the legend sits above or below the plot. */
  verticalAlign?: 'top' | 'bottom';
};

/** Names each series under or over the chart. Placed inside a chart, it draws nothing itself. */
function Legend(_props: LegendProps): ReactNode {
  return null;
}

type XAxisProps = {
  /** The key of each row that names its category, such as `month`. */
  dataKey?: string;
  hide?: boolean;
  /** Whether each tick draws a short line to the axis. */
  tickLine?: boolean;
  /** Whether the axis draws its line. */
  axisLine?: boolean;
  /** The room between a tick's label and the axis, in pixels. */
  tickMargin?: number;
  /** The text a tick shows for its category. */
  tickFormatter?: (value: never, index: number) => string;
  /** The room the axis takes under the plot, in pixels. */
  height?: number;
  /** The least room between two tick labels before one is left out, in pixels. */
  minTickGap?: number;
  /** Whether the categories run right to left, as a chart read right to left draws them. */
  reversed?: boolean;
};

/** The category axis under the plot. Placed inside a chart, the chart draws it. */
function XAxis(_props: XAxisProps): ReactNode {
  return null;
}

type YAxisProps = {
  hide?: boolean;
  tickLine?: boolean;
  axisLine?: boolean;
  tickMargin?: number;
  tickFormatter?: (value: number, index: number) => string;
  /** The room the axis takes beside the plot, in pixels. */
  width?: number;
  /** How many ticks the axis aims for. */
  tickCount?: number;
};

/** The value axis beside the plot. Placed inside a chart, the chart draws it. */
function YAxis(_props: YAxisProps): ReactNode {
  return null;
}

type CartesianGridProps = {
  /** Whether the grid draws a line at each category. */
  vertical?: boolean;
  /** Whether the grid draws a line at each value tick. */
  horizontal?: boolean;
  stroke?: string;
  strokeDasharray?: string;
  /** The side of the value axis the grid's lines start from; the lines span the plot either way. */
  orientation?: 'left' | 'right';
};

/** The lines behind the plot. Placed inside a chart, the chart draws it. */
function CartesianGrid(_props: CartesianGridProps): ReactNode {
  return null;
}

/** What every series of a chart takes. */
type SeriesProps = {
  /** The key of each row the series draws, such as `desktop`. */
  dataKey: string;
  /** The series' name in the tooltip and the legend, `dataKey` when left out. */
  name?: string;
  hide?: boolean;
  /** Whether the series grows in as the chart is first drawn. */
  isAnimationActive?: boolean;
  /** How long the entrance takes, in milliseconds. */
  animationDuration?: number;
};

type BarProps = SeriesProps & {
  fill?: string;
  fillOpacity?: number;
  /** The corner radius of each bar, one for all four corners or `[topLeft, topRight, bottomRight, bottomLeft]`. */
  radius?: number | readonly [number, number, number, number];
};

/** A bar for each row of the chart's data. Placed inside a BarChart, the chart draws it. */
function Bar(_props: BarProps): ReactNode {
  return null;
}

/** Recharts' curve names, each the d3-shape curve it draws with. */
const CURVES = {
  basis: curveBasis,
  bump: curveBumpX,
  linear: curveLinear,
  monotone: curveMonotoneX,
  monotoneX: curveMonotoneX,
  monotoneY: curveMonotoneY,
  natural: curveNatural,
  step: curveStep,
  stepBefore: curveStepBefore,
  stepAfter: curveStepAfter,
} as const satisfies Readonly<Record<string, CurveFactory>>;

type CurveType = keyof typeof CURVES;

/** A point's circle: `true` draws Recharts' own, `false` none. */
type DotProps = { r?: number; fill?: string; stroke?: string; strokeWidth?: number };

type LineProps = SeriesProps & {
  /** How the line runs between points. */
  type?: CurveType;
  stroke?: string;
  strokeWidth?: number;
  /** The circle at each point. */
  dot?: boolean | DotProps;
  /** The circle at the point the tooltip shows. */
  activeDot?: boolean | DotProps;
};

/** A line through each row of the chart's data. Placed inside a LineChart, the chart draws it. */
function Line(_props: LineProps): ReactNode {
  return null;
}

type AreaProps = LineProps & {
  fill?: string;
  fillOpacity?: number;
};

/** The area under a line through each row of the chart's data. Placed inside an AreaChart, the chart draws it. */
function Area(_props: AreaProps): ReactNode {
  return null;
}

// ---------------------------------------------------------------------------------------------------------
// Reading the children

type Series =
  | { kind: 'bar'; props: BarProps }
  | { kind: 'line'; props: LineProps }
  | { kind: 'area'; props: AreaProps };

type SeriesKind = Series['kind'];

interface ChartParts {
  series: Series[];
  xAxis?: XAxisProps;
  yAxis?: YAxisProps;
  grid?: CartesianGridProps;
  tooltip?: TooltipProps;
  legend?: LegendProps;
  other: ReactNode[];
}

/** Sorts a chart's children into its series and its configuration parts, as Recharts reads them by type. */
function readParts(children: ReactNode): ChartParts {
  const parts: ChartParts = { series: [], other: [] };
  Children.forEach(children, (child) => {
    if (!isValidElement(child)) return;
    const props = child.props as Record<string, unknown>;
    if (child.type === Bar) parts.series.push({ kind: 'bar', props: props as BarProps });
    else if (child.type === Line) parts.series.push({ kind: 'line', props: props as LineProps });
    else if (child.type === Area) parts.series.push({ kind: 'area', props: props as AreaProps });
    else if (child.type === XAxis) parts.xAxis = props as XAxisProps;
    else if (child.type === YAxis) parts.yAxis = props as YAxisProps;
    else if (child.type === CartesianGrid) parts.grid = props as CartesianGridProps;
    else if (child.type === Tooltip) parts.tooltip = props as TooltipProps;
    else if (child.type === Legend) parts.legend = props as LegendProps;
    else parts.other.push(child);
  });
  return parts;
}

// ---------------------------------------------------------------------------------------------------------
// Scales

/**
 * The ticks Recharts gives a value axis from 0 to `max`: `count` of them, a step rounded up to the next
 * multiple of 5 in its second digit, or of 1 for a one-digit step, so 305 over five ticks runs 0 to 320 and
 * 21 runs 0 to 24.
 */
function niceTicks(max: number, count: number): number[] {
  const intervals = Math.max(1, count - 1);
  if (!(max > 0)) return Array.from({ length: intervals + 1 }, (_, index) => index);
  const rough = max / intervals;
  const digits = Math.floor(Math.log10(rough)) + 1;
  const unit = 10 ** digits;
  const ratio = digits === 1 ? 0.1 : 0.05;
  const step = (Math.ceil(rough / unit / ratio) * ratio * unit).toPrecision(12);
  return Array.from({ length: intervals + 1 }, (_, index) => Number(step) * index);
}

function numberAt(datum: ChartDatum | undefined, key: string): number {
  const value = Number(datum?.[key]);
  return Number.isFinite(value) ? value : 0;
}

interface Margin {
  top?: number;
  right?: number;
  bottom?: number;
  left?: number;
}

/** Recharts' margin around the plot. */
const DEFAULT_MARGIN = { top: 5, right: 5, bottom: 5, left: 5 } as const;

/** The plot's box inside the chart, in the svg's pixels. */
interface Plot {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

/** Where each category sits along the x axis, as a band for bars or a point for lines and areas. */
interface CategoryScale {
  /** The left of category `index`'s band, or its point. */
  start: (index: number) => number;
  /** The width of a band; 0 for points. */
  bandwidth: number;
  /** The middle of category `index`. */
  center: (index: number) => number;
  /** The category under `x`, the nearest one for points. */
  indexAt: (x: number) => number;
}

function categoryScale(count: number, plot: Plot, banded: boolean, reversed: boolean): CategoryScale {
  const indices = Array.from({ length: count }, (_, index) => index);
  const clamp = (index: number): number => Math.min(count - 1, Math.max(0, index));
  const range: [number, number] = reversed ? [plot.right, plot.left] : [plot.left, plot.right];
  // How far `x` lies along the categories, from the edge the first one sits at.
  const along = (x: number): number => (reversed ? plot.right - x : x - plot.left);
  if (banded) {
    const band = scaleBand<number>().domain(indices).range(range);
    const width = band.bandwidth();
    return {
      start: (index) => band(index) ?? plot.left,
      bandwidth: width,
      center: (index) => (band(index) ?? plot.left) + width / 2,
      indexAt: (x) => clamp(Math.floor(along(x) / (width || 1))),
    };
  }
  const point = scalePoint<number>().domain(indices).range(range);
  const step = point.step();
  return {
    start: (index) => point(index) ?? plot.left,
    bandwidth: 0,
    center: (index) => point(index) ?? plot.left,
    indexAt: (x) => clamp(Math.round(along(x) / (step || 1))),
  };
}

// ---------------------------------------------------------------------------------------------------------
// Drawing helpers

/** A rectangle with each corner rounded by up to half its shorter side, as Recharts draws a bar. */
function roundedRect(
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number | readonly [number, number, number, number],
): string {
  const most = Math.min(width, height) / 2;
  const [tl, tr, br, bl] = (typeof radius === 'number' ? [radius, radius, radius, radius] : radius).map((value) =>
    Math.max(0, Math.min(most, value)),
  );
  return [
    `M${x + tl},${y}`,
    `H${x + width - tr}`,
    `A${tr},${tr} 0 0 1 ${x + width},${y + tr}`,
    `V${y + height - br}`,
    `A${br},${br} 0 0 1 ${x + width - br},${y + height}`,
    `H${x + bl}`,
    `A${bl},${bl} 0 0 1 ${x},${y + height - bl}`,
    `V${y + tl}`,
    `A${tl},${tl} 0 0 1 ${x + tl},${y}`,
    'Z',
  ].join(' ');
}

/** The width a label of `text` takes at the axes' 12px, near enough to keep labels from running together. */
function labelWidth(text: string): number {
  return text.length * 7;
}

const TICK_FONT_SIZE = 12;

/** How far below `y`, in ems, Recharts sets text whose top, middle or bottom sits on `y`. */
const VERTICAL_SHIFT = { start: 0.71, middle: 0.355, end: 0 } as const;

function seriesName(props: SeriesProps): string {
  return props.name ?? props.dataKey;
}

function seriesColor(series: Series): string {
  return (series.kind === 'bar' ? series.props.fill : series.props.stroke) ?? DEFAULT_SERIES_COLOR;
}

function formatValue(value: number | string | undefined): string {
  if (typeof value === 'number') return value.toLocaleString();
  return value === undefined ? '' : String(value);
}

// ---------------------------------------------------------------------------------------------------------
// Tooltip and legend drawing

/** Recharts' tooltip when it is given no content: the label over a line per series. */
function DefaultTooltipContent({ active, payload, label }: TooltipContentProps): ReactNode {
  if (!active || !payload?.length) return null;
  return (
    <View className="border-border bg-background gap-1 rounded-md border px-2.5 py-1.5">
      {label === undefined ? null : <NativeText className="text-foreground text-xs">{String(label)}</NativeText>}
      {payload.map((item, index) => (
        <NativeText key={index} className="text-foreground text-xs">
          {`${item.name ?? ''} : ${formatValue(item.value)}`}
        </NativeText>
      ))}
    </View>
  );
}

/** Recharts' legend when it is given no content: a row of names. */
function DefaultLegendContent({ payload }: LegendContentProps): ReactNode {
  return (
    <View className="flex-row flex-wrap items-center justify-center gap-4">
      {payload?.map((item, index) => (
        <NativeText key={index} className="text-foreground text-xs">
          {item.value}
        </NativeText>
      ))}
    </View>
  );
}

function drawContent<Props extends object>(
  content: ReactElement | ((props: Props) => ReactNode) | undefined,
  props: Props,
  fallback: (props: Props) => ReactNode,
): ReactNode {
  if (typeof content === 'function') return content(props);
  if (isValidElement(content)) return cloneElement(content, props as Partial<unknown>);
  return fallback(props);
}

/** Draws a chart's legend over the top or the bottom edge of the chart, reporting the height it takes. */
function LegendBox({
  legend,
  payload,
  onHeight,
}: {
  legend: LegendProps;
  payload: LegendPayloadItem[];
  onHeight: (height: number) => void;
}): ReactNode {
  const top = legend.verticalAlign === 'top';
  return (
    <View
      onLayout={(event: LayoutChangeEvent) => onHeight(event.nativeEvent.layout.height)}
      style={{ position: 'absolute', left: 0, right: 0, ...(top ? { top: 0 } : { bottom: 0 }) }}
    >
      {drawContent(legend.content, { payload, verticalAlign: legend.verticalAlign ?? 'bottom' }, DefaultLegendContent)}
    </View>
  );
}

/** The props of a Tooltip that Recharts hands its content, its own settings aside. */
function contentPropsOf({
  content: _content,
  cursor: _cursor,
  defaultIndex: _index,
  offset: _offset,
  ...rest
}: TooltipProps): object {
  return rest;
}

interface ActivePoint {
  index: number;
  /** Where the press or the pointer is, in the svg's pixels; the plot's middle for a key or a screen reader. */
  x: number;
  y: number;
}

/** Places the tooltip `offset` from the active point, on the side where it fits inside the chart. */
function TooltipBox({
  point,
  size,
  offset,
  children,
}: {
  point: { x: number; y: number };
  size: ChartSize;
  offset: number;
  children: ReactNode;
}): ReactNode {
  const [box, setBox] = useState<ChartSize | undefined>(undefined);
  const width = box?.width ?? 0;
  const height = box?.height ?? 0;
  const right = point.x + offset;
  const left = right + width > size.width ? Math.max(0, point.x - offset - width) : right;
  const below = point.y + offset;
  const top = below + height > size.height ? Math.max(0, point.y - offset - height) : below;
  return (
    <View
      pointerEvents="none"
      onLayout={(event: LayoutChangeEvent) => {
        const { width: measuredWidth, height: measuredHeight } = event.nativeEvent.layout;
        setBox((current) =>
          current?.width === measuredWidth && current.height === measuredHeight
            ? current
            : { width: measuredWidth, height: measuredHeight },
        );
      }}
      style={{ position: 'absolute', left, top, opacity: box === undefined ? 0 : 1 }}
    >
      {children}
    </View>
  );
}

// ---------------------------------------------------------------------------------------------------------
// Interaction

/** What a chart's surface needs to move its active point. */
interface Interaction {
  /** The point under `x`, `y` in the svg's pixels, or `undefined` outside anything that has one. */
  pointAt: (x: number, y: number) => ActivePoint | undefined;
  /** The point `index` as a key or a screen reader makes it active. */
  pointFor: (index: number) => ActivePoint;
  count: number;
  /** What a screen reader hears for the whole chart. */
  summary: string;
  /** What a screen reader hears for point `index`. */
  describe: (index: number) => string;
}

/** Hides the tooltip of the chart that showed one last, so a page shows one tooltip at a time. */
let hideShownTooltip: (() => void) | undefined;

/** What the surface leaves a screen reader with while no point is active. */
const NOTHING_ACTIVE = 'None selected';

/**
 * The layer over the plot that a press, a pointer on the web, the arrow keys on the web and a screen
 * reader's swipes move the active point with. A drag along it moves the point. A press on the active point
 * again hides it, and so does a scrolling parent taking the touch, a press on another chart, and on the web a
 * press outside the chart, the pointer leaving it or the focus leaving it.
 * @param reversed - whether the points run right to left, so the right arrow steps back through them
 */
function ChartSurface({
  interaction,
  active,
  onActive,
  label,
  reversed = false,
}: {
  interaction: Interaction;
  active: ActivePoint | undefined;
  onActive: (point: ActivePoint | undefined) => void;
  label: string | undefined;
  reversed?: boolean;
}): ReactNode {
  const web = Platform.OS === 'web';
  const surface = useRef<ComponentRef<typeof View>>(null);
  const press = useRef<{ dismiss: boolean }>({ dismiss: false });
  const latest = useRef(onActive);
  latest.current = onActive;
  const hide = useRef((): void => latest.current(undefined)).current;
  const show = (point: ActivePoint | undefined): void => {
    if (point !== undefined && hideShownTooltip !== hide) {
      hideShownTooltip?.();
      hideShownTooltip = hide;
    }
    onActive(point);
  };

  useEffect(
    () => () => {
      if (hideShownTooltip === hide) hideShownTooltip = undefined;
    },
    [hide],
  );

  useEffect(() => {
    if (!web || active === undefined) return undefined;
    const node = surface.current as unknown as { parentElement?: { contains: (target: unknown) => boolean } } | null;
    const onPointerDown = (event: { target: unknown }): void => {
      if (node?.parentElement?.contains(event.target) !== true) hide();
    };
    const page = globalThis as unknown as {
      document: {
        addEventListener: (type: string, listener: (event: { target: unknown }) => void, capture: boolean) => void;
        removeEventListener: (type: string, listener: (event: { target: unknown }) => void, capture: boolean) => void;
      };
    };
    page.document.addEventListener('pointerdown', onPointerDown, true);
    return () => page.document.removeEventListener('pointerdown', onPointerDown, true);
  }, [web, hide, active === undefined]);

  const onGrant = (event: GestureResponderEvent): void => {
    const point = interaction.pointAt(event.nativeEvent.locationX, event.nativeEvent.locationY);
    press.current.dismiss = point !== undefined && active !== undefined && point.index === active.index;
    if (point !== undefined && !press.current.dismiss) show(point);
  };
  const onMove = (event: GestureResponderEvent): void => {
    const point = interaction.pointAt(event.nativeEvent.locationX, event.nativeEvent.locationY);
    if (point === undefined || point.index === active?.index) return;
    press.current.dismiss = false;
    show(point);
  };
  const onRelease = (): void => {
    if (press.current.dismiss) onActive(undefined);
    press.current.dismiss = false;
  };
  const step = (delta: number): void => {
    if (interaction.count === 0) return;
    const index =
      active === undefined
        ? delta > 0
          ? 0
          : interaction.count - 1
        : Math.min(interaction.count - 1, Math.max(0, active.index + delta));
    show(interaction.pointFor(index));
  };
  const along = reversed ? -1 : 1;
  const onKeyDown = (event: KeyDownEvent): void => {
    const moves: Readonly<Record<string, () => void>> = {
      ArrowRight: () => step(along),
      ArrowLeft: () => step(-along),
      Home: () => show(interaction.pointFor(0)),
      End: () => show(interaction.pointFor(interaction.count - 1)),
      Escape: () => onActive(undefined),
    };
    const move = moves[event.nativeEvent.key];
    if (move === undefined || interaction.count === 0) return;
    event.preventDefault();
    move();
  };
  const onPointerMove = (event: PointerEvent): void => {
    if (event.nativeEvent.pointerType !== 'mouse') return;
    show(interaction.pointAt(event.nativeEvent.offsetX, event.nativeEvent.offsetY));
  };

  return (
    <View
      ref={surface}
      testID="chart-surface"
      accessible
      focusable
      {...(web ? { role: 'slider' as const } : { accessibilityRole: 'adjustable' as const })}
      aria-label={[label, interaction.summary].filter(Boolean).join('. ')}
      aria-valuemin={0}
      aria-valuemax={Math.max(0, interaction.count - 1)}
      aria-valuenow={active?.index ?? 0}
      aria-valuetext={active === undefined ? NOTHING_ACTIVE : interaction.describe(active.index)}
      accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
      onAccessibilityAction={(event: AccessibilityActionEvent) => {
        if (event.nativeEvent.actionName === 'increment') step(1);
        if (event.nativeEvent.actionName === 'decrement') step(-1);
      }}
      onStartShouldSetResponder={() => true}
      onResponderGrant={onGrant}
      onResponderMove={onMove}
      onResponderRelease={onRelease}
      onResponderTerminationRequest={() => true}
      onResponderTerminate={() => onActive(undefined)}
      onPointerMove={onPointerMove}
      onPointerLeave={(event: PointerEvent) => {
        if (event.nativeEvent.pointerType === 'mouse') onActive(undefined);
      }}
      onKeyDown={onKeyDown}
      onBlur={() => onActive(undefined)}
      className="absolute inset-0"
    />
  );
}

// ---------------------------------------------------------------------------------------------------------
// Cartesian charts

type CartesianChartProps = {
  data: readonly ChartDatum[];
  margin?: Margin;
  /** Recharts' switch for keyboard and screen reader access; this chart always has both. */
  accessibilityLayer?: boolean;
  /** The room between two bars of one category, in pixels. */
  barGap?: number;
  /** The room around each category's bars, in pixels or as a share of the category such as `"10%"`. */
  barCategoryGap?: number | `${number}%`;
  /** What a screen reader hears before the chart's values, such as `Visitors by month`. */
  title?: string;
  /** The chart's size where no ResponsiveContainer gives it one. */
  width?: number;
  height?: number;
  children?: ReactNode;
};

function shareOf(gap: number | `${number}%`, of: number): number {
  return typeof gap === 'number' ? gap : (Number.parseFloat(gap) / 100) * of;
}

const KIND_NAMES: Readonly<Record<SeriesKind, string>> = { bar: 'Bar chart', line: 'Line chart', area: 'Area chart' };

/** The svg of a bar, line or area chart: the grid, the axes, the cursor and the series, laid out in `size`. */
function CartesianChart({
  kind,
  data,
  margin,
  barGap = 4,
  barCategoryGap = '10%',
  title,
  width,
  height,
  children,
}: CartesianChartProps & { kind: SeriesKind }): ReactNode {
  const size = useChartSize(width, height);
  const palette = useContext(ChartPaletteContext);
  const parts = useMemo(() => readParts(children), [children]);
  const [legendHeight, setLegendHeight] = useState(0);
  const series = parts.series.filter((item) => item.props.hide !== true);
  const animate = series.some((item) => item.props.isAnimationActive !== false);
  const duration = Math.max(...series.map((item) => item.props.animationDuration ?? ENTRANCE_MS), 0);
  const progress = useEntrance(animate, duration);
  const tooltip = parts.tooltip;
  const [active, setActive] = useState<ActivePoint | undefined>(undefined);
  const [touched, setTouched] = useState(false);
  const clipId = `chart-clip-${useId().replace(/[^\w-]/g, '')}`;

  if (size === undefined || size.width <= 0 || size.height <= 0) return null;

  const resolve = (value: string | undefined): string | undefined => palette.resolveColor(value);
  const { top, right, bottom, left } = { ...DEFAULT_MARGIN, ...margin };
  const xAxisHeight = parts.xAxis !== undefined && parts.xAxis.hide !== true ? (parts.xAxis.height ?? 30) : 0;
  const yAxisWidth = parts.yAxis !== undefined && parts.yAxis.hide !== true ? (parts.yAxis.width ?? 60) : 0;
  const legendTop = parts.legend?.verticalAlign === 'top';
  const plot: Plot = {
    left: left + yAxisWidth,
    right: size.width - right,
    top: top + (legendTop ? legendHeight : 0),
    bottom: size.height - bottom - xAxisHeight - (legendTop ? 0 : legendHeight),
  };
  const banded = kind === 'bar';
  const reversed = parts.xAxis?.reversed === true;
  const x = categoryScale(data.length, plot, banded, reversed);
  const ticks = niceTicks(
    Math.max(0, ...data.flatMap((datum) => series.map((item) => numberAt(datum, item.props.dataKey)))),
    parts.yAxis?.tickCount ?? 5,
  );
  const y = scaleLinear()
    .domain([0, ticks[ticks.length - 1] ?? 1])
    .range([plot.bottom, plot.top]);
  const categoryKey = parts.xAxis?.dataKey;
  const categoryOf = (index: number): unknown => (categoryKey === undefined ? index : data[index]?.[categoryKey]);

  const payloadAt = (index: number): TooltipPayloadItem[] =>
    series.map((item) => ({
      dataKey: item.props.dataKey,
      name: seriesName(item.props),
      value: data[index]?.[item.props.dataKey] as number | string | undefined,
      color: seriesColor(item),
      fill: item.kind === 'bar' ? item.props.fill : undefined,
      stroke: item.kind === 'bar' ? undefined : item.props.stroke,
      payload: data[index],
    }));

  const nameOf = (key: string): string => palette.nameOf(key) ?? key;
  const describe = (index: number): string =>
    `${String(categoryOf(index))}: ${series
      .map((item) => `${nameOf(seriesName(item.props))} ${formatValue(data[index]?.[item.props.dataKey] as number)}`)
      .join(', ')}`;
  const pointFor = (index: number): ActivePoint => ({ index, x: x.center(index), y: (plot.top + plot.bottom) / 2 });
  const interaction: Interaction = {
    count: data.length,
    pointAt: (pointX, pointY) =>
      pointX < plot.left || pointX > plot.right || data.length === 0
        ? undefined
        : { index: x.indexAt(pointX), x: pointX, y: pointY },
    pointFor,
    summary: data.map((_, index) => describe(index)).join('. '),
    describe,
  };

  const shown =
    active ?? (!touched && tooltip?.defaultIndex !== undefined ? pointFor(tooltip.defaultIndex) : undefined);
  const activeIndex = shown?.index;

  // Bars of one category share its band less the category gap on each side, with `barGap` between them.
  const band = x.bandwidth;
  const categoryGap = shareOf(barCategoryGap, band);
  const barWidth =
    series.length === 0 ? 0 : Math.max(0, (band - 2 * categoryGap - (series.length - 1) * barGap) / series.length);

  const xTickFormat = parts.xAxis?.tickFormatter;
  const xLabels = data.map((_, index) => {
    const value = categoryOf(index);
    return xTickFormat === undefined ? String(value) : xTickFormat(value as never, index);
  });
  // Recharts leaves a label out where it would run into its neighbour, keeping the one at the right end.
  const minGap = parts.xAxis?.minTickGap ?? 5;
  const shownLabels = new Set<number>();
  let edge = Number.POSITIVE_INFINITY;
  for (const index of data.map((_, at) => at).sort((a, b) => x.center(b) - x.center(a))) {
    const half = labelWidth(xLabels[index] ?? '') / 2;
    const center = x.center(index);
    if (center + half + minGap <= edge) {
      shownLabels.add(index);
      edge = center - half;
    }
  }

  const cursor = tooltip?.cursor ?? true;
  const cursorProps = typeof cursor === 'object' ? cursor : {};
  const tickColor = resolve(THEME.tick);
  const legendPayload: LegendPayloadItem[] = series.map((item) => ({
    value: seriesName(item.props),
    dataKey: item.props.dataKey,
    color: seriesColor(item),
    type: item.kind === 'line' ? 'line' : 'rect',
  }));

  return (
    <View style={{ width: size.width, height: size.height }}>
      <Svg
        width={size.width}
        height={size.height}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      >
        {parts.grid === undefined ? null : (
          <G>
            {parts.grid.horizontal === false
              ? null
              : ticks.map((tick) => (
                  <SvgLine
                    key={`h${tick}`}
                    x1={plot.left}
                    x2={plot.right}
                    y1={y(tick)}
                    y2={y(tick)}
                    stroke={resolve(parts.grid?.stroke ?? THEME.grid)}
                    strokeOpacity={parts.grid?.stroke === undefined ? 0.5 : 1}
                    strokeDasharray={parts.grid?.strokeDasharray}
                  />
                ))}
            {parts.grid.vertical === false
              ? null
              : data.map((_, index) => (
                  <SvgLine
                    key={`v${index}`}
                    x1={x.center(index)}
                    x2={x.center(index)}
                    y1={plot.top}
                    y2={plot.bottom}
                    stroke={resolve(parts.grid?.stroke ?? THEME.grid)}
                    strokeOpacity={parts.grid?.stroke === undefined ? 0.5 : 1}
                    strokeDasharray={parts.grid?.strokeDasharray}
                  />
                ))}
          </G>
        )}
        {cursor === false || activeIndex === undefined || tooltip === undefined ? null : banded ? (
          <Rect
            testID="chart-cursor"
            x={x.start(activeIndex)}
            y={plot.top}
            width={band}
            height={plot.bottom - plot.top}
            fill={resolve(cursorProps.fill ?? THEME.cursorFill)}
          />
        ) : (
          <SvgLine
            testID="chart-cursor"
            x1={x.center(activeIndex)}
            x2={x.center(activeIndex)}
            y1={plot.top}
            y2={plot.bottom}
            stroke={resolve(cursorProps.stroke ?? THEME.cursorStroke)}
            strokeWidth={cursorProps.strokeWidth ?? 1}
          />
        )}
        {parts.xAxis === undefined || parts.xAxis.hide === true ? null : (
          <G>
            {parts.xAxis.axisLine === false ? null : (
              <SvgLine x1={plot.left} x2={plot.right} y1={plot.bottom} y2={plot.bottom} stroke={tickColor} />
            )}
            {data.map((_, index) =>
              shownLabels.has(index) ? (
                <G key={index}>
                  {parts.xAxis?.tickLine === false ? null : (
                    <SvgLine
                      x1={x.center(index)}
                      x2={x.center(index)}
                      y1={plot.bottom}
                      y2={plot.bottom + 6}
                      stroke={tickColor}
                    />
                  )}
                  <SvgText
                    testID={`chart-x-tick-${index}`}
                    x={x.center(index)}
                    y={plot.bottom + 6 + (parts.xAxis?.tickMargin ?? 2) + VERTICAL_SHIFT.start * TICK_FONT_SIZE}
                    fontSize={TICK_FONT_SIZE}
                    fill={tickColor}
                    textAnchor="middle"
                  >
                    {xLabels[index]}
                  </SvgText>
                </G>
              ) : null,
            )}
          </G>
        )}
        {parts.yAxis === undefined || parts.yAxis.hide === true ? null : (
          <G>
            {parts.yAxis.axisLine === false ? null : (
              <SvgLine x1={plot.left} x2={plot.left} y1={plot.top} y2={plot.bottom} stroke={tickColor} />
            )}
            {ticks.map((tick, index) => (
              <G key={tick}>
                {parts.yAxis?.tickLine === false ? null : (
                  <SvgLine x1={plot.left - 6} x2={plot.left} y1={y(tick)} y2={y(tick)} stroke={tickColor} />
                )}
                <SvgText
                  testID={`chart-y-tick-${index}`}
                  x={plot.left - 6 - (parts.yAxis?.tickMargin ?? 2)}
                  y={y(tick) + VERTICAL_SHIFT.middle * TICK_FONT_SIZE}
                  fontSize={TICK_FONT_SIZE}
                  fill={tickColor}
                  textAnchor="end"
                >
                  {parts.yAxis?.tickFormatter === undefined ? String(tick) : parts.yAxis.tickFormatter(tick, index)}
                </SvgText>
              </G>
            ))}
          </G>
        )}
        <EntranceClip
          id={clipId}
          progress={progress}
          plot={plot}
          size={size}
          direction={banded ? 'up' : reversed ? 'left' : 'right'}
        />
        {series.map((item, order) => {
          const key = `${item.props.dataKey}-${order}`;
          const clipPath = item.props.isAnimationActive === false ? undefined : `url(#${clipId})`;
          if (item.kind === 'bar') {
            const props = item.props;
            return (
              <G key={key} testID={`chart-series-${props.dataKey}`} clipPath={clipPath}>
                {data.map((datum, index) => {
                  const barTop = y(numberAt(datum, props.dataKey));
                  const barHeight = Math.abs(y(0) - barTop);
                  if (barHeight === 0 || barWidth === 0) return null;
                  return (
                    <Path
                      key={index}
                      testID={`chart-bar-${props.dataKey}-${index}`}
                      d={roundedRect(
                        x.start(index) + categoryGap + order * (barWidth + barGap),
                        Math.min(barTop, y(0)),
                        barWidth,
                        barHeight,
                        props.radius ?? 0,
                      )}
                      fill={resolve(props.fill ?? DEFAULT_SERIES_COLOR)}
                      fillOpacity={props.fillOpacity}
                    />
                  );
                })}
              </G>
            );
          }
          const props = item.props;
          const color = resolve(seriesColor(item));
          const curve = CURVES[props.type ?? 'linear'];
          // A Line draws its points unless told not to, an Area only when told to.
          const dot = props.dot ?? item.kind === 'line';
          const points = data.map((datum, index) => [x.center(index), y(numberAt(datum, props.dataKey))] as const);
          return (
            <G key={key} testID={`chart-series-${props.dataKey}`}>
              <G clipPath={clipPath}>
                {item.kind === 'area' ? (
                  <Path
                    testID={`chart-area-${props.dataKey}`}
                    d={areaPath().curve(curve).y0(y(0))(points.map(([px, py]) => [px, py])) ?? ''}
                    fill={resolve(item.props.fill) ?? color}
                    fillOpacity={item.props.fillOpacity ?? 0.6}
                  />
                ) : null}
                <Path
                  testID={`chart-line-${props.dataKey}`}
                  d={linePath().curve(curve)(points.map(([px, py]) => [px, py])) ?? ''}
                  fill="none"
                  stroke={color}
                  strokeWidth={props.strokeWidth ?? 1}
                />
                {dot === false
                  ? null
                  : points.map(([px, py], index) => (
                      <Circle
                        key={index}
                        testID={`chart-dot-${props.dataKey}-${index}`}
                        cx={px}
                        cy={py}
                        r={(typeof dot === 'object' ? dot.r : undefined) ?? 3}
                        fill={resolve((typeof dot === 'object' ? dot.fill : undefined) ?? THEME.surface)}
                        stroke={resolve(typeof dot === 'object' ? dot.stroke : undefined) ?? color}
                        strokeWidth={(typeof dot === 'object' ? dot.strokeWidth : undefined) ?? props.strokeWidth ?? 1}
                      />
                    ))}
              </G>
              {props.activeDot === false || activeIndex === undefined || tooltip === undefined ? null : (
                <Circle
                  testID={`chart-active-dot-${props.dataKey}`}
                  cx={points[activeIndex]?.[0]}
                  cy={points[activeIndex]?.[1]}
                  r={(typeof props.activeDot === 'object' ? props.activeDot.r : undefined) ?? 4}
                  fill={resolve(typeof props.activeDot === 'object' ? props.activeDot.fill : undefined) ?? color}
                  stroke={resolve(THEME.surface)}
                  strokeWidth={2}
                />
              )}
            </G>
          );
        })}
        {parts.other}
      </Svg>
      {tooltip === undefined ? null : (
        <ChartSurface
          interaction={interaction}
          active={shown}
          label={title ?? KIND_NAMES[kind]}
          reversed={reversed}
          onActive={(point) => {
            setTouched(true);
            setActive(point);
          }}
        />
      )}
      {tooltip === undefined || shown === undefined ? null : (
        <TooltipBox point={shown} size={size} offset={tooltip.offset ?? 10}>
          {drawContent(
            tooltip.content,
            {
              ...contentPropsOf(tooltip),
              active: true,
              payload: payloadAt(shown.index),
              label: categoryOf(shown.index),
              coordinate: { x: shown.x, y: shown.y },
            },
            DefaultTooltipContent,
          )}
        </TooltipBox>
      )}
      {tooltip === undefined ? (
        <View
          accessible
          testID="chart-summary"
          aria-label={[title ?? KIND_NAMES[kind], interaction.summary].join('. ')}
          className="absolute inset-0"
          pointerEvents="none"
        />
      ) : null}
      {parts.legend === undefined ? null : (
        <LegendBox legend={parts.legend} payload={legendPayload} onHeight={setLegendHeight} />
      )}
    </View>
  );
}

/** Bars side by side for each category of `data`. */
function BarChart(props: CartesianChartProps): ReactNode {
  return <CartesianChart kind="bar" {...props} />;
}

/** An area per series under a line through the categories of `data`. */
function AreaChart(props: CartesianChartProps): ReactNode {
  return <CartesianChart kind="area" {...props} />;
}

/** A line per series through the categories of `data`. */
function LineChart(props: CartesianChartProps): ReactNode {
  return <CartesianChart kind="line" {...props} />;
}

// ---------------------------------------------------------------------------------------------------------
// Pie charts

/** A length in pixels, or a share of what it is measured against such as `"80%"`. */
type Length = number | `${number}%`;

function lengthOf(value: Length, of: number): number {
  return typeof value === 'number' ? value : (Number.parseFloat(value) / 100) * of;
}

/** Where a Label is drawn: the middle of the pie, and the slice angles it spans. */
interface PolarViewBox {
  cx: number;
  cy: number;
  innerRadius: number;
  outerRadius: number;
  startAngle: number;
  endAngle: number;
}

type LabelProps = {
  /** Draws the label from the box it is given; react-native-svg's elements, or {@link Text}. */
  content?: (props: { viewBox: PolarViewBox }) => ReactNode;
  /** The text drawn in the middle of the pie where there is no `content`. */
  value?: string | number;
  position?: 'center';
};

/** A label in the middle of the Pie it is placed in. */
function Label(_props: LabelProps): ReactNode {
  return null;
}

type TextProps = Omit<ComponentProps<typeof SvgText>, 'fill'> & {
  /** Which part of the text sits on `y`. */
  verticalAnchor?: 'start' | 'middle' | 'end';
  /** The text's colour, such as `var(--muted-foreground)`; the theme's foreground when left out. */
  fill?: string;
};

/**
 * Text inside a chart's svg, in a colour from the chart's palette, taking react-native-svg's text props such
 * as `textAnchor` and `fontSize`.
 */
function Text({ y, verticalAnchor = 'end', fill, fontSize = 14, ...props }: TextProps): ReactNode {
  const palette = useContext(ChartPaletteContext);
  return (
    <SvgText
      y={Number(y ?? 0) + VERTICAL_SHIFT[verticalAnchor] * Number(fontSize)}
      fill={palette.resolveColor(fill ?? 'var(--foreground)')}
      fontSize={fontSize}
      {...props}
    />
  );
}

type PieProps = Omit<SeriesProps, 'hide'> & {
  data: readonly ChartDatum[];
  /** The key of each row that names its slice, such as `browser`. */
  nameKey?: string;
  innerRadius?: Length;
  outerRadius?: Length;
  cx?: Length;
  cy?: Length;
  /** Where the first slice starts, in degrees anticlockwise from three o'clock. */
  startAngle?: number;
  endAngle?: number;
  /** The angle left between two slices, in degrees. */
  paddingAngle?: number;
  /** The colour of a slice whose row has no `fill`. */
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  /** A Label for the middle of the pie. */
  children?: ReactNode;
};

/** A slice for each row of its `data`. Placed inside a PieChart, the chart draws it. */
function Pie(_props: PieProps): ReactNode {
  return null;
}

type PieChartProps = Pick<CartesianChartProps, 'margin' | 'accessibilityLayer' | 'title' | 'width' | 'height'> & {
  children?: ReactNode;
};

interface Slice {
  index: number;
  name: string;
  value: number;
  fill: string | undefined;
  /** In degrees anticlockwise from three o'clock. */
  startAngle: number;
  endAngle: number;
}

/** Each row's slice of the turn from `startAngle` to `endAngle`, as Recharts lays a pie out. */
function layoutSlices(props: PieProps): Slice[] {
  const { data, dataKey, nameKey = 'name', startAngle = 0, endAngle = 360, paddingAngle = 0 } = props;
  const values = data.map((datum) => Math.max(0, numberAt(datum, dataKey)));
  const total = values.reduce((sum, value) => sum + value, 0);
  const direction = Math.sign(endAngle - startAngle) || 1;
  const drawn = values.filter((value) => value > 0).length;
  const turn = Math.abs(endAngle - startAngle);
  // A whole turn has a gap after every slice; a part of one has none after the last.
  const gaps = Math.max(0, turn >= 360 ? drawn : drawn - 1);
  const room = Math.max(0, turn - paddingAngle * gaps);
  let angle = startAngle;
  return data.map((datum, index) => {
    const value = values[index] ?? 0;
    const sweep = total > 0 ? (value / total) * room : 0;
    const slice: Slice = {
      index,
      name: String(datum[nameKey] ?? index),
      value,
      fill: typeof datum.fill === 'string' ? datum.fill : props.fill,
      startAngle: angle,
      endAngle: angle + direction * sweep,
    };
    if (value > 0) angle += direction * (sweep + paddingAngle);
    return slice;
  });
}

const RADIANS = Math.PI / 180;

/** A point at `radius` and `angle`, in degrees anticlockwise from three o'clock, around `cx`, `cy`. */
function polar(cx: number, cy: number, radius: number, angle: number): { x: number; y: number } {
  return { x: cx + radius * Math.cos(angle * RADIANS), y: cy - radius * Math.sin(angle * RADIANS) };
}

/** A slice of a pie, or of a ring with an `inner` radius, as an svg path around 0, 0. */
function slicePath(slice: Slice, inner: number, outer: number): string {
  // d3's angles run clockwise from twelve o'clock.
  return (
    arcPath()({
      innerRadius: inner,
      outerRadius: outer,
      startAngle: (90 - slice.startAngle) * RADIANS,
      endAngle: (90 - slice.endAngle) * RADIANS,
    }) ?? ''
  );
}

/** A pie, or a ring, of the Pie inside it, with its tooltip and its legend. */
function PieChart({ margin, title, width, height, children }: PieChartProps): ReactNode {
  const size = useChartSize(width, height);
  const palette = useContext(ChartPaletteContext);
  const parts = useMemo(() => {
    const found: { pie?: PieProps; tooltip?: TooltipProps; legend?: LegendProps; other: ReactNode[] } = { other: [] };
    Children.forEach(children, (child) => {
      if (!isValidElement(child)) return;
      if (child.type === Pie) found.pie = child.props as PieProps;
      else if (child.type === Tooltip) found.tooltip = child.props as TooltipProps;
      else if (child.type === Legend) found.legend = child.props as LegendProps;
      else found.other.push(child);
    });
    return found;
  }, [children]);
  const [legendHeight, setLegendHeight] = useState(0);
  const pie = parts.pie;
  const progress = useEntrance(pie?.isAnimationActive !== false, pie?.animationDuration ?? ENTRANCE_MS);
  const maskId = `chart-mask-${useId().replace(/[^\w-]/g, '')}`;
  const [active, setActive] = useState<ActivePoint | undefined>(undefined);
  const [touched, setTouched] = useState(false);

  if (size === undefined || size.width <= 0 || size.height <= 0 || pie === undefined) return null;

  const resolve = (value: string | undefined): string | undefined => palette.resolveColor(value);
  const { top, right, bottom, left } = { ...DEFAULT_MARGIN, ...margin };
  const legendTop = parts.legend?.verticalAlign === 'top';
  const plotTop = top + (legendTop ? legendHeight : 0);
  const plotWidth = size.width - left - right;
  const plotHeight = size.height - top - bottom - legendHeight;
  const maxRadius = Math.max(0, Math.min(plotWidth, plotHeight) / 2);
  const cx = left + lengthOf(pie.cx ?? '50%', plotWidth);
  const cy = plotTop + lengthOf(pie.cy ?? '50%', plotHeight);
  const inner = lengthOf(pie.innerRadius ?? 0, maxRadius);
  const outer = lengthOf(pie.outerRadius ?? '80%', maxRadius);
  const fullSlices = layoutSlices(pie);
  const slices = fullSlices;
  const nameOf = (key: string): string => palette.nameOf(key) ?? key;
  const describe = (index: number): string => {
    const slice = fullSlices[index];
    return slice === undefined ? '' : `${nameOf(slice.name)}: ${formatValue(pie.data[index]?.[pie.dataKey] as number)}`;
  };
  const pointFor = (index: number): ActivePoint => {
    const slice = fullSlices[index];
    const middle = slice === undefined ? 0 : (slice.startAngle + slice.endAngle) / 2;
    return { index, ...polar(cx, cy, (inner + outer) / 2, middle) };
  };
  const pointAt = (px: number, py: number): ActivePoint | undefined => {
    const distance = Math.hypot(px - cx, py - cy);
    if (distance < inner || distance > outer) return undefined;
    const angle = (Math.atan2(cy - py, px - cx) / RADIANS + 360) % 360;
    const slice = fullSlices.find((candidate) => {
      const low = Math.min(candidate.startAngle, candidate.endAngle);
      const high = Math.max(candidate.startAngle, candidate.endAngle);
      return [angle - 360, angle, angle + 360].some((turn) => turn >= low && turn < high);
    });
    return slice === undefined ? undefined : { index: slice.index, x: px, y: py };
  };
  const interaction: Interaction = {
    count: pie.data.length,
    pointAt,
    pointFor,
    summary: pie.data.map((_, index) => describe(index)).join('. '),
    describe,
  };
  const tooltip = parts.tooltip;
  const shown =
    active ?? (!touched && tooltip?.defaultIndex !== undefined ? pointFor(tooltip.defaultIndex) : undefined);
  const payloadAt = (index: number): TooltipPayloadItem[] => {
    const slice = fullSlices[index];
    const datum = pie.data[index];
    if (slice === undefined || datum === undefined) return [];
    return [
      {
        dataKey: pie.dataKey,
        name: slice.name,
        value: datum[pie.dataKey] as number | string | undefined,
        color: slice.fill,
        fill: slice.fill,
        payload: { ...datum, fill: slice.fill },
      },
    ];
  };
  const legendPayload: LegendPayloadItem[] = fullSlices.map((slice) => ({
    value: slice.name,
    dataKey: pie.dataKey,
    color: slice.fill,
    type: 'rect',
    payload: { ...pie.data[slice.index], fill: slice.fill },
  }));
  const viewBox: PolarViewBox = {
    cx,
    cy,
    innerRadius: inner,
    outerRadius: outer,
    startAngle: pie.startAngle ?? 0,
    endAngle: pie.endAngle ?? 360,
  };
  const labels: ReactNode[] = [];
  Children.forEach(pie.children, (child) => {
    if (!isValidElement(child) || child.type !== Label) return;
    const props = child.props as LabelProps;
    labels.push(
      props.content === undefined ? (
        <Text key={labels.length} x={cx} y={cy} textAnchor="middle" verticalAnchor="middle">
          {props.value}
        </Text>
      ) : (
        <G key={labels.length}>{props.content({ viewBox })}</G>
      ),
    );
  });
  const label = title ?? 'Pie chart';

  return (
    <View style={{ width: size.width, height: size.height }}>
      <Svg
        width={size.width}
        height={size.height}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      >
        {pie.isAnimationActive === false ? null : (
          <SweepMask
            id={maskId}
            progress={progress}
            cx={cx}
            cy={cy}
            radius={outer + 1}
            startAngle={pie.startAngle ?? 0}
            endAngle={pie.endAngle ?? 360}
          />
        )}
        <G mask={pie.isAnimationActive === false ? undefined : `url(#${maskId})`}>
          <G x={cx} y={cy}>
            {slices.map((slice) =>
              slice.value > 0 && slice.endAngle !== slice.startAngle ? (
                <Path
                  key={slice.index}
                  testID={`chart-slice-${slice.index}`}
                  d={slicePath(slice, inner, outer)}
                  fill={resolve(slice.fill ?? DEFAULT_SERIES_COLOR)}
                  stroke={resolve(pie.stroke)}
                  strokeWidth={pie.stroke === undefined ? 0 : (pie.strokeWidth ?? 1)}
                />
              ) : null,
            )}
          </G>
        </G>
        {labels}
        {parts.other}
      </Svg>
      {tooltip === undefined ? (
        <View
          accessible
          testID="chart-summary"
          aria-label={[label, interaction.summary].join('. ')}
          className="absolute inset-0"
          pointerEvents="none"
        />
      ) : (
        <ChartSurface
          interaction={interaction}
          active={shown}
          label={label}
          onActive={(point) => {
            setTouched(true);
            setActive(point);
          }}
        />
      )}
      {tooltip === undefined || shown === undefined ? null : (
        <TooltipBox point={shown} size={size} offset={tooltip.offset ?? 10}>
          {drawContent(
            tooltip.content,
            {
              ...contentPropsOf(tooltip),
              active: true,
              payload: payloadAt(shown.index),
              label: fullSlices[shown.index]?.name,
              coordinate: { x: shown.x, y: shown.y },
            },
            DefaultTooltipContent,
          )}
        </TooltipBox>
      )}
      {parts.legend === undefined ? null : (
        <LegendBox legend={parts.legend} payload={legendPayload} onHeight={setLegendHeight} />
      )}
    </View>
  );
}

export {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ChartPaletteContext,
  Label,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Text,
  Tooltip,
  XAxis,
  YAxis,
};
export type {
  AreaProps,
  BarProps,
  CartesianChartProps,
  CartesianGridProps,
  ChartDatum,
  ChartPalette,
  LegendContentProps,
  LegendPayloadItem,
  LegendProps,
  LabelProps,
  LineProps,
  PieChartProps,
  PieProps,
  PolarViewBox,
  TextProps,
  TooltipContentProps,
  TooltipPayloadItem,
  TooltipProps,
  XAxisProps,
  YAxisProps,
};
