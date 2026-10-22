import { fireEvent, render, screen } from '@testing-library/react-native';
import { processColor } from 'react-native';
import { G } from 'react-native-svg';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Label,
  Line,
  LineChart,
  Pie,
  PieChart,
  Text as ChartText,
  XAxis,
} from '../lib/charts';
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from './chart';

const mockTheme: { scheme: 'light' | 'dark'; variables: Record<string, unknown> } = {
  scheme: 'light',
  variables: {},
};

jest.mock('nativewind', () => ({
  ...jest.requireActual<object>('nativewind'),
  useColorScheme: () => ({ colorScheme: mockTheme.scheme }),
  useUnstableNativeVariable: (name: string) => mockTheme.variables[name],
}));

const chartData = [
  { month: 'January', desktop: 186, mobile: 80 },
  { month: 'February', desktop: 305, mobile: 200 },
  { month: 'March', desktop: 237, mobile: 120 },
  { month: 'April', desktop: 73, mobile: 190 },
  { month: 'May', desktop: 209, mobile: 130 },
  { month: 'June', desktop: 214, mobile: 140 },
];

const chartConfig = {
  desktop: { label: 'Desktop', color: '#2563eb' },
  mobile: { label: 'Mobile', color: '#60a5fa' },
} satisfies ChartConfig;

/** The svg is hidden from screen readers, which hear the chart's values from its surface. */
const HIDDEN = { includeHiddenElements: true } as const;

type Element = ReturnType<typeof screen.getByTestId>;

/** The colour an svg element draws its fill with, as react-native-svg hands it to the native view. */
function fillOf(element: Element): unknown {
  return (element.props.fill as { payload?: unknown } | undefined)?.payload;
}

function MonthBars({
  config = chartConfig,
  tooltip = <ChartTooltip content={<ChartTooltipContent />} />,
  legend = null,
}: {
  config?: ChartConfig;
  tooltip?: React.ReactNode;
  legend?: React.ReactNode;
}): React.ReactNode {
  return (
    <ChartContainer config={config} className="min-h-[200px] w-full">
      <BarChart accessibilityLayer data={chartData}>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="month"
          tickLine={false}
          tickMargin={10}
          axisLine={false}
          tickFormatter={(value: string) => value.slice(0, 3)}
        />
        {tooltip}
        {legend}
        <Bar dataKey="desktop" fill="var(--color-desktop)" radius={4} isAnimationActive={false} />
        <Bar dataKey="mobile" fill="var(--color-mobile)" radius={4} isAnimationActive={false} />
      </BarChart>
    </ChartContainer>
  );
}

/** The colour an svg element draws its stroke with. */
function strokeOf(element: Element): unknown {
  return (element.props.stroke as { payload?: unknown } | undefined)?.payload;
}

function MonthLines({ dot }: { dot?: boolean }): React.ReactNode {
  return (
    <ChartContainer config={chartConfig}>
      <LineChart accessibilityLayer data={chartData} margin={{ left: 12, right: 12 }}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Line
          dataKey="desktop"
          type="monotone"
          stroke="var(--color-desktop)"
          strokeWidth={2}
          dot={dot}
          isAnimationActive={false}
        />
        <Line
          dataKey="mobile"
          type="monotone"
          stroke="var(--color-mobile)"
          strokeWidth={2}
          dot={dot}
          isAnimationActive={false}
        />
      </LineChart>
    </ChartContainer>
  );
}

function MonthArea(): React.ReactNode {
  return (
    <ChartContainer config={chartConfig}>
      <AreaChart accessibilityLayer data={chartData} margin={{ left: 12, right: 12 }}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
        <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="line" />} />
        <Area
          dataKey="desktop"
          type="natural"
          fill="var(--color-desktop)"
          fillOpacity={0.4}
          stroke="var(--color-desktop)"
          isAnimationActive={false}
        />
      </AreaChart>
    </ChartContainer>
  );
}

const browserData = [
  { browser: 'chrome', visitors: 275, fill: 'var(--color-chrome)' },
  { browser: 'safari', visitors: 200, fill: 'var(--color-safari)' },
  { browser: 'firefox', visitors: 287, fill: 'var(--color-firefox)' },
];

const browserConfig = {
  visitors: { label: 'Visitors' },
  chrome: { label: 'Chrome', color: '#2563eb' },
  safari: { label: 'Safari', color: '#60a5fa' },
  firefox: { label: 'Firefox', color: '#dc2626' },
} satisfies ChartConfig;

function BrowserDonut({ legend = null }: { legend?: React.ReactNode }): React.ReactNode {
  return (
    <ChartContainer config={browserConfig} className="aspect-square">
      <PieChart>
        <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
        {legend}
        <Pie
          data={browserData}
          dataKey="visitors"
          nameKey="browser"
          innerRadius={60}
          strokeWidth={5}
          isAnimationActive={false}
        >
          <Label
            content={({ viewBox }) => (
              <G testID="center-label" x={0} y={0}>
                <ChartText x={viewBox.cx} y={viewBox.cy} textAnchor="middle" verticalAnchor="middle">
                  762
                </ChartText>
              </G>
            )}
          />
        </Pie>
      </PieChart>
    </ChartContainer>
  );
}

/** The text of x tick `index`, which react-native-svg hands its span. */
function tickText(index: number): unknown {
  const [span] = screen.getByTestId(`chart-x-tick-${index}`, HIDDEN).children;
  return typeof span === 'object' ? span.props.content : span;
}

/** A press at `x` across the chart, which is drawn at its initial 320 by 200 until it is laid out. */
async function pressAt(x: number): Promise<void> {
  await fireEvent(screen.getByTestId('chart-surface'), 'responderGrant', {
    nativeEvent: { locationX: x, locationY: 40 },
  });
}

describe('Chart', () => {
  beforeEach(() => {
    mockTheme.scheme = 'light';
    mockTheme.variables = {};
  });

  it('draws a bar for each row of each series, in the colour its config key names', async () => {
    await render(<MonthBars />);

    expect(screen.getAllByTestId(/^chart-bar-desktop-/, HIDDEN)).toHaveLength(6);
    expect(screen.getAllByTestId(/^chart-bar-mobile-/, HIDDEN)).toHaveLength(6);
    expect(fillOf(screen.getByTestId('chart-bar-desktop-0', HIDDEN))).toBe(processColor('#2563eb'));
    expect(fillOf(screen.getByTestId('chart-bar-mobile-0', HIDDEN))).toBe(processColor('#60a5fa'));
  });

  it('draws a config colour naming a theme variable in the theme colour', async () => {
    mockTheme.variables = { '--chart-1': [37, 99, 235] };

    await render(
      <MonthBars config={{ desktop: { label: 'Desktop', color: 'var(--chart-1)' }, mobile: chartConfig.mobile }} />,
    );

    expect(fillOf(screen.getByTestId('chart-bar-desktop-0', HIDDEN))).toBe(processColor('rgb(37, 99, 235)'));
  });

  it('draws a theme colour with its alpha', async () => {
    mockTheme.variables = { '--border': [255, 255, 255], '--border-alpha': 0.1 };

    await render(<MonthBars config={{ desktop: { color: 'var(--border)' }, mobile: chartConfig.mobile }} />);

    expect(fillOf(screen.getByTestId('chart-bar-desktop-0', HIDDEN))).toBe(processColor('rgba(255, 255, 255, 0.1)'));
  });

  it("draws a key's theme colour for the scheme the app draws", async () => {
    const config = {
      desktop: { label: 'Desktop', theme: { light: '#2563eb', dark: '#dc2626' } },
      mobile: chartConfig.mobile,
    } satisfies ChartConfig;

    mockTheme.scheme = 'dark';
    await render(<MonthBars config={config} />);

    expect(fillOf(screen.getByTestId('chart-bar-desktop-0', HIDDEN))).toBe(processColor('#dc2626'));
  });

  it('shows the values of the category a press lands on', async () => {
    await render(<MonthBars />);
    expect(screen.queryByText('February')).toBeNull();

    // Six categories share the 310px between the 5px margins, so 80px falls in the second.
    await pressAt(80);

    expect(screen.getByText('February')).toBeOnTheScreen();
    expect(screen.getByText('305')).toBeOnTheScreen();
    expect(screen.getByText('200')).toBeOnTheScreen();
    expect(screen.getByText('Desktop')).toBeOnTheScreen();
    expect(screen.getByText('Mobile')).toBeOnTheScreen();
  });

  it('moves the tooltip with a drag across the categories', async () => {
    await render(<MonthBars />);

    await pressAt(80);
    await fireEvent(screen.getByTestId('chart-surface'), 'responderMove', {
      nativeEvent: { locationX: 300, locationY: 40 },
    });

    expect(screen.getByText('June')).toBeOnTheScreen();
    expect(screen.queryByText('February')).toBeNull();
  });

  it('draws the cursor over the active band, and none with cursor={false}', async () => {
    const { rerender } = await render(<MonthBars />);
    await pressAt(80);
    expect(screen.getByTestId('chart-cursor', HIDDEN)).toBeOnTheScreen();

    await rerender(<MonthBars tooltip={<ChartTooltip cursor={false} content={<ChartTooltipContent />} />} />);
    expect(screen.queryByTestId('chart-cursor', HIDDEN)).toBeNull();
  });

  it('shows the point a tooltip names as its defaultIndex before any press', async () => {
    await render(<MonthBars tooltip={<ChartTooltip defaultIndex={2} content={<ChartTooltipContent />} />} />);

    expect(screen.getByText('March')).toBeOnTheScreen();
  });

  it('hides the label with hideLabel and the indicator name stays', async () => {
    await render(<MonthBars tooltip={<ChartTooltip content={<ChartTooltipContent hideLabel />} />} />);

    await pressAt(80);

    expect(screen.queryByText('February')).toBeNull();
    expect(screen.getByText('Desktop')).toBeOnTheScreen();
  });

  it('reads every value to a screen reader, and steps through the points with its swipes', async () => {
    await render(<MonthBars />);
    const surface = screen.getByRole('adjustable');

    expect(surface.props['aria-label']).toContain('January: Desktop 186, Mobile 80');
    expect(surface.props['aria-label']).toContain('June: Desktop 214, Mobile 140');

    await fireEvent(surface, 'accessibilityAction', { nativeEvent: { actionName: 'increment' } });
    expect(screen.getByRole('adjustable').props['aria-valuetext']).toBe('January: Desktop 186, Mobile 80');
    expect(screen.getByText('January')).toBeOnTheScreen();

    await fireEvent(surface, 'accessibilityAction', { nativeEvent: { actionName: 'increment' } });
    expect(screen.getByRole('adjustable').props['aria-valuetext']).toBe('February: Desktop 305, Mobile 200');

    await fireEvent(surface, 'accessibilityAction', { nativeEvent: { actionName: 'decrement' } });
    expect(screen.getByRole('adjustable').props['aria-valuetext']).toBe('January: Desktop 186, Mobile 80');
  });

  it('gives a chart with no tooltip its values as a label', async () => {
    await render(<MonthBars tooltip={null} />);

    expect(screen.getByLabelText(/January: Desktop 186, Mobile 80/)).toBeOnTheScreen();
  });

  it('names each series in the legend by its config label', async () => {
    await render(<MonthBars tooltip={null} legend={<ChartLegend content={<ChartLegendContent />} />} />);

    expect(screen.getByText('Desktop')).toBeOnTheScreen();
    expect(screen.getByText('Mobile')).toBeOnTheScreen();
  });

  it('heads the tooltip with the config label labelKey names', async () => {
    const config = {
      desktop: { label: 'Desktop', color: '#2563eb' },
      mobile: { label: 'Mobile', color: '#60a5fa' },
      visitors: { label: 'Total Visitors' },
    } satisfies ChartConfig;
    await render(
      <MonthBars config={config} tooltip={<ChartTooltip content={<ChartTooltipContent labelKey="visitors" />} />} />,
    );

    await pressAt(80);

    expect(screen.getByText('Total Visitors')).toBeOnTheScreen();
  });

  it('labels each x tick with its formatted category', async () => {
    await render(<MonthBars />);

    expect(tickText(0)).toBe('Jan');
    expect(tickText(5)).toBe('Jun');
  });

  describe('LineChart', () => {
    it('draws a line per series in the colour its config key names, through a point per row', async () => {
      await render(<MonthLines />);

      expect(strokeOf(screen.getByTestId('chart-line-desktop', HIDDEN))).toBe(processColor('#2563eb'));
      expect(strokeOf(screen.getByTestId('chart-line-mobile', HIDDEN))).toBe(processColor('#60a5fa'));
      expect(screen.getAllByTestId(/^chart-dot-desktop-/, HIDDEN)).toHaveLength(6);
    });

    it('draws no point circles with dot={false}', async () => {
      await render(<MonthLines dot={false} />);

      expect(screen.queryAllByTestId(/^chart-dot-/, HIDDEN)).toHaveLength(0);
    });

    it('puts the first and the last points at the plot edges, inside the margin', async () => {
      await render(<MonthLines />);

      expect(screen.getByTestId('chart-dot-desktop-0', HIDDEN).props.cx).toBe(12);
      expect(screen.getByTestId('chart-dot-desktop-5', HIDDEN).props.cx).toBe(308);
    });

    it('shows the values of the nearest point to a press, with a dot on each line there', async () => {
      await render(<MonthLines />);

      // The points sit 59.2px apart from 12px, so 70px is nearest the second.
      await pressAt(70);

      expect(screen.getByText('February')).toBeOnTheScreen();
      expect(screen.getByText('305')).toBeOnTheScreen();
      expect(screen.getByTestId('chart-active-dot-desktop', HIDDEN).props.cx).toBeCloseTo(71.2);
      expect(screen.getByTestId('chart-cursor', HIDDEN)).toBeOnTheScreen();
    });

    it('is announced as a line chart with its values', async () => {
      await render(<MonthLines />);

      expect(screen.getByRole('adjustable').props['aria-label']).toMatch(
        /^Line chart\. January: Desktop 186, Mobile 80/,
      );
    });
  });

  describe('AreaChart', () => {
    it('fills the area under its line in the colour its config key names, at the opacity it is given', async () => {
      await render(<MonthArea />);
      const area = screen.getByTestId('chart-area-desktop', HIDDEN);

      expect(fillOf(area)).toBe(processColor('#2563eb'));
      expect(area.props.fillOpacity).toBe(0.4);
      expect(strokeOf(screen.getByTestId('chart-line-desktop', HIDDEN))).toBe(processColor('#2563eb'));
    });

    it('draws no point circles unless given dot', async () => {
      await render(<MonthArea />);

      expect(screen.queryAllByTestId(/^chart-dot-/, HIDDEN)).toHaveLength(0);
    });

    it('shows the label and value of the nearest point, with its name beside the line indicator', async () => {
      await render(<MonthArea />);

      await pressAt(70);

      expect(screen.getByText('February')).toBeOnTheScreen();
      expect(screen.getByText('Desktop')).toBeOnTheScreen();
      expect(screen.getByText('305')).toBeOnTheScreen();
      expect(screen.getByRole('adjustable').props['aria-label']).toMatch(/^Area chart\. January: Desktop 186/);
    });
  });

  describe('PieChart', () => {
    it("draws a slice per row in the colour its row's fill names", async () => {
      await render(<BrowserDonut />);

      expect(screen.getAllByTestId(/^chart-slice-/, HIDDEN)).toHaveLength(3);
      expect(fillOf(screen.getByTestId('chart-slice-0', HIDDEN))).toBe(processColor('#2563eb'));
      expect(fillOf(screen.getByTestId('chart-slice-2', HIDDEN))).toBe(processColor('#dc2626'));
    });

    it('shows the name and value of the slice a press lands on', async () => {
      await render(<BrowserDonut />);

      // The ring sits in the middle of 320 by 200, from 60px to 76px out, and the first slice starts at three
      // o'clock running anticlockwise, so a press 64px up and right of the middle lands in it.
      await fireEvent(screen.getByTestId('chart-surface'), 'responderGrant', {
        nativeEvent: { locationX: 160 + 50, locationY: 100 - 40 },
      });

      expect(screen.getByText('Chrome')).toBeOnTheScreen();
      expect(screen.getByText('275')).toBeOnTheScreen();
    });

    it('shows nothing for a press in the hole of the ring', async () => {
      await render(<BrowserDonut />);

      await fireEvent(screen.getByTestId('chart-surface'), 'responderGrant', {
        nativeEvent: { locationX: 160, locationY: 100 },
      });

      expect(screen.queryByText('Chrome')).toBeNull();
    });

    it('reads every slice by its config label, and steps through them', async () => {
      await render(<BrowserDonut />);
      const surface = screen.getByRole('adjustable');

      expect(surface.props['aria-label']).toBe('Pie chart. Chrome: 275. Safari: 200. Firefox: 287');

      await fireEvent(surface, 'accessibilityAction', { nativeEvent: { actionName: 'increment' } });
      expect(screen.getByRole('adjustable').props['aria-valuetext']).toBe('Chrome: 275');
    });

    it('draws the Label content in the middle of the ring', async () => {
      await render(<BrowserDonut />);

      const label = screen.getByTestId('center-label', HIDDEN);
      const [text] = label.children;
      const [span] = typeof text === 'object' ? text.children : [];

      expect(typeof span === 'object' ? span.props.content : span).toBe('762');
      expect(typeof text === 'object' ? text.props.x : undefined).toEqual([160]);
    });

    it('names each slice in the legend by the config label nameKey points at', async () => {
      await render(<BrowserDonut legend={<ChartLegend content={<ChartLegendContent nameKey="browser" />} />} />);

      expect(screen.getByText('Chrome')).toBeOnTheScreen();
      expect(screen.getByText('Firefox')).toBeOnTheScreen();
    });
  });
});
