import { createContext, useContext, useMemo, type ComponentProps, type ComponentType, type ReactNode } from 'react';
import { View } from 'react-native';
import Svg, { Line, Rect } from 'react-native-svg';
import {
  ChartPaletteContext,
  Legend,
  ResponsiveContainer,
  Tooltip,
  type ChartPalette,
  type LegendContentProps,
  type TooltipContentProps,
  type TooltipPayloadItem,
} from '../lib/charts';
import { useChartTheme } from '../lib/chart-theme';
import { cn } from '../lib/utils';
import { IconClassContext } from './icon';
import { Text, TextClassContext } from './text';

// A `cn-<slot>` token stands for that slot's view classes in the registry's style and `cn-<slot>/text`
// for its text classes; the registry build replaces each with the classes translated for the target engine.

// Format: { THEME_NAME: CSS_SELECTOR }
const THEMES = { light: '', dark: '.dark' } as const;

const INITIAL_DIMENSION = { width: 320, height: 200 } as const;

/**
 * Each series or category key a chart names, such as `desktop`, to its label, its icon and its colour: one
 * `color`, or a `theme` colour per scheme. A colour is a theme variable such as `var(--chart-1)`, or a
 * colour React Native reads, such as `#2563eb` or `hsl(220, 98%, 61%)`; the parts draw it as
 * `var(--color-<key>)`.
 */
type ChartConfig = Record<
  string,
  {
    label?: ReactNode;
    /** A component drawing an Icon, which takes the indicator's size and colour. */
    icon?: ComponentType;
  } & ({ color?: string; theme?: never } | { color?: never; theme: Record<keyof typeof THEMES, string> })
>;

interface ChartContextProps {
  config: ChartConfig;
}

const ChartContext = createContext<ChartContextProps | null>(null);

function useChart(): ChartContextProps {
  const context = useContext(ChartContext);

  if (!context) {
    throw new Error('useChart must be used within a <ChartContainer />');
  }

  return context;
}

// Read by the app's Tailwind scan, the one reader of the chart colours: a theme colour no class names can be
// left out of what a device can draw, so deleting the next line can leave var(--chart-N) colourless there.
// text-chart-1 text-chart-2 text-chart-3 text-chart-4 text-chart-5

const VARIABLE = /^var\(\s*(--[\w-]+)\s*(?:,\s*(.+))?\)$/;
/** A colour naming a variable that names another, deeper than any config needs, is taken as a loop. */
const MOST_REFERENCES = 8;

/**
 * Turns the colours of `config` into the palette the chart's parts draw with: `var(--color-<key>)` is
 * the key's colour for the scheme the app draws, and a theme variable such as `var(--chart-1)` the theme's
 * colour.
 */
function useChartPalette(config: ChartConfig): ChartPalette {
  const { colorScheme, themeColor } = useChartTheme();
  const resolveColor = (value: string | undefined, depth = 0): string | undefined => {
    const match = value === undefined ? null : VARIABLE.exec(value.trim());
    if (match === null || depth > MOST_REFERENCES) return value;
    const [, name = '', fallback] = match;
    const key = name.replace(/^--(color-)?/, '');
    const entry = name.startsWith('--color-') ? config[key] : undefined;
    const own = entry?.theme?.[colorScheme] ?? entry?.color;
    if (own !== undefined) return resolveColor(own, depth + 1);
    return themeColor(`--${key}`) ?? resolveColor(fallback, depth + 1);
  };
  const nameOf = (key: string): string | undefined => {
    const label = config[key]?.label;
    return typeof label === 'string' ? label : undefined;
  };
  return { resolveColor: (value) => resolveColor(value), nameOf };
}

type ChartContainerProps = ComponentProps<typeof View> & {
  config: ChartConfig;
  /** A chart from `@/lib/charts`, such as a BarChart. */
  children: ReactNode;
  /** The size the chart is drawn at before its container has been measured. */
  initialDimension?: {
    width: number;
    height: number;
  };
  id?: string;
};

/**
 * Holds a chart, sized by its classes, 16:9 unless they say otherwise, and gives the parts inside it the
 * colours and labels of `config`.
 */
function ChartContainer({
  id,
  className,
  children,
  config,
  initialDimension = INITIAL_DIMENSION,
  ...props
}: ChartContainerProps): ReactNode {
  return (
    <ChartContext.Provider value={{ config }}>
      <TextClassContext.Provider value="text-xs">
        <View className={cn('flex-row aspect-video justify-center', className)} {...props}>
          <ChartStyle id={id ?? 'chart'} config={config}>
            <ResponsiveContainer initialDimension={initialDimension}>{children}</ResponsiveContainer>
          </ChartStyle>
        </View>
      </TextClassContext.Provider>
    </ChartContext.Provider>
  );
}

/**
 * Gives the parts inside it each key's colour of `config` as `var(--color-<key>)`, for the scheme the app
 * draws.
 */
function ChartStyle({ config, children }: { id: string; config: ChartConfig; children?: ReactNode }): ReactNode {
  const palette = useChartPalette(config);
  return <ChartPaletteContext.Provider value={palette}>{children}</ChartPaletteContext.Provider>;
}

const ChartTooltip = Tooltip;

type ChartIndicator = 'line' | 'dot' | 'dashed';

/** The mark beside a tooltip's value in the series' colour: a square dot, a bar, or a dashed bar. */
function ChartTooltipIndicator({
  indicator,
  color,
  nested,
}: {
  indicator: ChartIndicator;
  color: string | undefined;
  nested: boolean;
}): ReactNode {
  if (indicator === 'dot') {
    return (
      <Svg testID="chart-indicator-dot" width={10} height={10} className="shrink-0">
        <Rect width={10} height={10} rx={2} fill={color} />
      </Svg>
    );
  }
  return (
    <View
      testID={`chart-indicator-${indicator}`}
      className={cn(
        'shrink-0 self-stretch',
        indicator === 'line' ? 'w-1' : 'w-[3px]',
        nested && indicator === 'dashed' && 'my-0.5',
      )}
    >
      {/* Out of the flow, the mark takes the row's height rather than giving it one. */}
      <Svg width="100%" height="100%" style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }}>
        {indicator === 'line' ? (
          <Rect width="100%" height="100%" rx={2} fill={color} />
        ) : (
          <Line x1="50%" x2="50%" y1="0" y2="100%" stroke={color} strokeWidth={3} strokeDasharray="3 2" />
        )}
      </Svg>
    </View>
  );
}

/** A label from the config, which may be a string or a node of its own. */
function ChartText({ className, children }: { className?: string; children: ReactNode }): ReactNode {
  return typeof children === 'string' || typeof children === 'number' ? (
    <Text className={className}>{children}</Text>
  ) : (
    children
  );
}

type ChartTooltipContentProps = TooltipContentProps &
  Omit<ComponentProps<typeof View>, 'children'> & {
    hideLabel?: boolean;
    hideIndicator?: boolean;
    indicator?: ChartIndicator;
    /** The key of each payload item, or of its row, whose value names the item in the config. */
    nameKey?: string;
    /** The key of the config, or of the row, whose label heads the tooltip. */
    labelKey?: string;
    labelClassName?: string;
    labelFormatter?: (label: ReactNode, payload: TooltipPayloadItem[]) => ReactNode;
    formatter?: (
      value: number | string,
      name: string,
      item: TooltipPayloadItem,
      index: number,
      payload: unknown,
    ) => ReactNode;
    /** The indicator's colour in place of each series' own. */
    color?: string;
  };

/** What a ChartTooltip draws: the active label, then each series' indicator, name and value. */
function ChartTooltipContent({
  active,
  payload,
  className,
  indicator = 'dot',
  hideLabel = false,
  hideIndicator = false,
  label,
  labelFormatter,
  labelClassName,
  formatter,
  color,
  nameKey,
  labelKey,
  coordinate: _coordinate,
  ...props
}: ChartTooltipContentProps): ReactNode {
  const { config } = useChart();
  const { resolveColor } = useContext(ChartPaletteContext);

  const tooltipLabel = useMemo(() => {
    if (hideLabel || !payload?.length) {
      return null;
    }

    const [item] = payload;
    const key = `${labelKey ?? item?.dataKey ?? item?.name ?? 'value'}`;
    const itemConfig = getPayloadConfigFromPayload(config, item, key);
    const value = !labelKey && typeof label === 'string' ? (config[label]?.label ?? label) : itemConfig?.label;

    if (labelFormatter) {
      return <ChartText className={cn('font-sans-medium', labelClassName)}>{labelFormatter(value, payload)}</ChartText>;
    }

    if (!value) {
      return null;
    }

    return <ChartText className={cn('font-sans-medium', labelClassName)}>{value}</ChartText>;
  }, [label, labelFormatter, payload, hideLabel, labelClassName, config, labelKey]);

  if (!active || !payload?.length) {
    return null;
  }

  const nestLabel = payload.length === 1 && indicator !== 'dot';

  return (
    <TextClassContext.Provider value="cn-chart-tooltip/text">
      <View className={cn('cn-chart-tooltip min-w-32 items-start', className)} {...props}>
        {!nestLabel ? tooltipLabel : null}
        <View className="gap-1.5 self-stretch">
          {payload
            .filter((item) => item.type !== 'none')
            .map((item, index) => {
              const key = `${nameKey ?? item.name ?? item.dataKey ?? 'value'}`;
              const itemConfig = getPayloadConfigFromPayload(config, item, key);
              const indicatorColor = resolveColor(color ?? (item.payload?.fill as string | undefined) ?? item.color);
              const Glyph = itemConfig?.icon;

              return (
                <View
                  key={index}
                  className={cn('w-full flex-row flex-wrap items-stretch gap-2', indicator === 'dot' && 'items-center')}
                >
                  {formatter && item?.value !== undefined && item.name ? (
                    formatter(item.value, item.name, item, index, item.payload)
                  ) : (
                    <>
                      {Glyph ? (
                        <IconClassContext.Provider value="size-2.5 text-muted-foreground">
                          <Glyph />
                        </IconClassContext.Provider>
                      ) : (
                        !hideIndicator && (
                          <ChartTooltipIndicator indicator={indicator} color={indicatorColor} nested={nestLabel} />
                        )
                      )}
                      <View className={cn('flex-1 flex-row justify-between', nestLabel ? 'items-end' : 'items-center')}>
                        <View className="gap-1.5">
                          {nestLabel ? tooltipLabel : null}
                          <ChartText className="text-muted-foreground">{itemConfig?.label ?? item.name}</ChartText>
                        </View>
                        {item.value != null && (
                          <Text className="text-foreground font-sans-medium tabular-nums">
                            {typeof item.value === 'number' ? item.value.toLocaleString() : String(item.value)}
                          </Text>
                        )}
                      </View>
                    </>
                  )}
                </View>
              );
            })}
        </View>
      </View>
    </TextClassContext.Provider>
  );
}

const ChartLegend = Legend;

type ChartLegendContentProps = LegendContentProps &
  ComponentProps<typeof View> & {
    hideIcon?: boolean;
    /** The key of each payload item, or of its row, whose value names the item in the config. */
    nameKey?: string;
  };

/** What a ChartLegend draws: each series' colour, or its icon, and its label from the config. */
function ChartLegendContent({
  className,
  hideIcon = false,
  payload,
  verticalAlign = 'bottom',
  nameKey,
  ...props
}: ChartLegendContentProps): ReactNode {
  const { config } = useChart();
  const { resolveColor } = useContext(ChartPaletteContext);

  if (!payload?.length) {
    return null;
  }

  return (
    <View
      className={cn('flex-row items-center justify-center gap-4', verticalAlign === 'top' ? 'pb-3' : 'pt-3', className)}
      {...props}
    >
      {payload
        .filter((item) => item.type !== 'none')
        .map((item, index) => {
          const key = `${nameKey ?? item.dataKey ?? 'value'}`;
          const itemConfig = getPayloadConfigFromPayload(config, item, key);
          const Glyph = itemConfig?.icon;

          return (
            <View key={index} className="flex-row items-center gap-1.5">
              {Glyph && !hideIcon ? (
                <IconClassContext.Provider value="size-3 text-muted-foreground">
                  <Glyph />
                </IconClassContext.Provider>
              ) : (
                <Svg width={8} height={8} className="shrink-0">
                  <Rect width={8} height={8} rx={2} fill={resolveColor(item.color)} />
                </Svg>
              )}
              {itemConfig?.label === undefined ? null : <ChartText>{itemConfig.label}</ChartText>}
            </View>
          );
        })}
    </View>
  );
}

function getPayloadConfigFromPayload(config: ChartConfig, payload: unknown, key: string) {
  if (typeof payload !== 'object' || payload === null) {
    return undefined;
  }

  const payloadPayload =
    'payload' in payload && typeof payload.payload === 'object' && payload.payload !== null
      ? payload.payload
      : undefined;

  let configLabelKey: string = key;

  if (key in payload && typeof payload[key as keyof typeof payload] === 'string') {
    configLabelKey = payload[key as keyof typeof payload] as string;
  } else if (
    payloadPayload &&
    key in payloadPayload &&
    typeof payloadPayload[key as keyof typeof payloadPayload] === 'string'
  ) {
    configLabelKey = payloadPayload[key as keyof typeof payloadPayload] as string;
  }

  return configLabelKey in config ? config[configLabelKey] : config[key];
}

export { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent, ChartStyle };
export type { ChartConfig };
