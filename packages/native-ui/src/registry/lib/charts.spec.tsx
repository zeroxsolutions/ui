import { render, screen } from '@testing-library/react-native';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Line,
  LineChart,
  Pie,
  PieChart,
  Radar,
  RadarChart,
  RadialBar,
  RadialBarChart,
  YAxis,
} from './charts';

const mockMotion = { reduced: false };

jest.mock('./motion', () => ({
  useReducedMotion: () => mockMotion.reduced,
}));

const HIDDEN = { includeHiddenElements: true } as const;

const data = [
  { month: 'January', desktop: 186 },
  { month: 'February', desktop: 305 },
];

function Bars(): React.ReactNode {
  return (
    <BarChart data={data} width={320} height={200}>
      <Bar dataKey="desktop" fill="#2563eb" />
    </BarChart>
  );
}

/** The y axis' tick labels, which react-native-svg hands each its span. */
function yTicks(): unknown[] {
  return screen.getAllByTestId(/^chart-y-tick-/, HIDDEN).map((tick) => {
    const [span] = tick.children;
    return typeof span === 'object' ? span.props.content : span;
  });
}

function ValueAxis({ values }: { values: readonly number[] }): React.ReactNode {
  return (
    <BarChart data={values.map((value) => ({ value }))} width={320} height={200}>
      <YAxis />
      <Bar dataKey="value" isAnimationActive={false} />
    </BarChart>
  );
}

describe('YAxis', () => {
  it('rounds its step up as Recharts does, so 305 over five ticks runs to 320', async () => {
    await render(<ValueAxis values={[186, 305]} />);
    expect(yTicks()).toEqual(['0', '80', '160', '240', '320']);
  });

  it('rounds a step in the hundreds to a multiple of 50', async () => {
    await render(<ValueAxis values={[1260]} />);
    expect(yTicks()).toEqual(['0', '350', '700', '1050', '1400']);
  });

  it('rounds a one-digit step up to a whole number, so 21 runs to 24', async () => {
    await render(<ValueAxis values={[21]} />);
    expect(yTicks()).toEqual(['0', '6', '12', '18', '24']);
  });

  it('counts up from 0 for data with nothing above 0', async () => {
    await render(<ValueAxis values={[0]} />);
    expect(yTicks()).toEqual(['0', '1', '2', '3', '4']);
  });
});

/** The y of the top edge of the bar `index` of `desktop`, where its path starts. */
function barTop(index = 0): number {
  const d = String(screen.getByTestId(`chart-bar-desktop-${index}`, HIDDEN).props.d);
  return Number(/^M[-\d.e]+,([-\d.e]+)/.exec(d)?.[1]);
}

/** Every point a path names, after `M`, `L`, or at the end of an arc. */
function pathPoints(testID: string): number[][] {
  const d = String(screen.getByTestId(testID, HIDDEN).props.d);
  return d
    .split(/(?=[MLAZ])/)
    .filter((part) => part[0] !== 'Z')
    .map((part) =>
      part
        .slice(1)
        .trim()
        .split(/[\s,]+/)
        .map(Number)
        .slice(-2),
    );
}

// Reanimated's jest setup runs the entrance without drawing its frames onto the svg, so these read the frame a
// chart starts from. The plot runs from 5px to the axis at 195px, and its values to 320.
describe('a chart entrance', () => {
  beforeEach(() => {
    mockMotion.reduced = false;
  });

  it('starts each bar with no height on the axis', async () => {
    await render(<Bars />);

    expect(barTop()).toBe(195);
    expect(String(screen.getByTestId('chart-bar-desktop-0', HIDDEN).props.d).match(/V[-\d.e]+/g)).toEqual([
      'V195',
      'V195',
    ]);
  });

  it('draws the bars whole from the start where the system asks for reduced motion', async () => {
    mockMotion.reduced = true;

    await render(<Bars />);

    expect(barTop()).toBeCloseTo(195 - (190 * 186) / 320);
  });

  it('draws a series at once whose isAnimationActive is false', async () => {
    await render(
      <BarChart data={data} width={320} height={200}>
        <Bar dataKey="desktop" fill="#2563eb" isAnimationActive={false} />
      </BarChart>,
    );

    expect(barTop(1)).toBeCloseTo(195 - (190 * 305) / 320);
  });

  it('starts a line with its whole length dashed off, and its dots hidden', async () => {
    await render(
      <LineChart data={data} width={320} height={200}>
        <Line dataKey="desktop" stroke="#2563eb" />
      </LineChart>,
    );

    const line = screen.getByTestId('chart-line-desktop', HIDDEN);
    expect(line.props.strokeDasharray[0]).toBeGreaterThan(300);
    expect(line.props.strokeDashoffset).toBeCloseTo(Number(line.props.strokeDasharray[0]));
    expect(screen.getByTestId('chart-dots-desktop', HIDDEN).props.opacity).toBe(0);
  });

  it('starts an area flat on the axis', async () => {
    await render(
      <AreaChart data={data} width={320} height={200}>
        <Area dataKey="desktop" fill="#2563eb" />
      </AreaChart>,
    );

    expect(new Set(pathPoints('chart-area-desktop').map(([, y]) => y))).toEqual(new Set([195]));
  });

  it('starts a pie with no slice swept', async () => {
    await render(
      <PieChart width={320} height={200}>
        <Pie data={data} dataKey="desktop" nameKey="month" />
      </PieChart>,
    );

    expect(screen.getByTestId('chart-slice-0', HIDDEN).props.d).toBe('');
  });

  it('starts a radar with every point in its middle', async () => {
    await render(
      <RadarChart data={data} width={320} height={200}>
        <Radar dataKey="desktop" fill="#2563eb" />
      </RadarChart>,
    );

    expect(pathPoints('chart-radar-desktop')).toEqual([
      [160, 100],
      [160, 100],
    ]);
  });

  it('starts a radial bar with no sweep', async () => {
    await render(
      <RadialBarChart data={data} width={320} height={200}>
        <RadialBar dataKey="desktop" />
      </RadialBarChart>,
    );

    expect(screen.getByTestId('chart-radial-bar-desktop-0', HIDDEN).props.d).toBe('');
  });
});
