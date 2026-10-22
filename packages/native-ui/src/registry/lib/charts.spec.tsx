import { render, screen } from '@testing-library/react-native';
import { Bar, BarChart, Radar, RadarChart, RadialBar, RadialBarChart, YAxis } from './charts';

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

// Reanimated's jest setup runs the entrance without drawing its frames onto the svg, so these read the frame a
// chart starts from.
describe('a chart entrance', () => {
  beforeEach(() => {
    mockMotion.reduced = false;
  });

  // The bars are drawn through a clip that rises from the axis, at the plot's 195px bottom, to the top.
  it('starts the bars from the axis', async () => {
    await render(<Bars />);

    expect(screen.getByTestId('chart-entrance', HIDDEN)).toHaveProp('y', 195);
    expect(screen.getByTestId('chart-entrance', HIDDEN)).toHaveProp('height', 5);
  });

  it('draws the bars whole from the start where the system asks for reduced motion', async () => {
    mockMotion.reduced = true;

    await render(<Bars />);

    expect(screen.getByTestId('chart-entrance', HIDDEN)).toHaveProp('y', 0);
    expect(screen.getByTestId('chart-entrance', HIDDEN)).toHaveProp('height', 200);
  });

  // A radar grows out of its middle, through a disc that starts with no radius.
  it('grows a radar from its middle', async () => {
    await render(
      <RadarChart data={data} width={320} height={200}>
        <Radar dataKey="desktop" fill="#2563eb" />
      </RadarChart>,
    );

    expect(screen.getByTestId('chart-entrance', HIDDEN)).toHaveProp('r', 0);
    expect(screen.getByTestId('chart-entrance', HIDDEN)).toHaveProp('cx', 160);
  });

  // A radial bar is swept round through a mask whose dash starts with nothing drawn.
  it('sweeps a radial bar round from its start', async () => {
    await render(
      <RadialBarChart data={data} width={320} height={200}>
        <RadialBar dataKey="desktop" />
      </RadialBarChart>,
    );

    const entrance = screen.getByTestId('chart-entrance', HIDDEN);
    expect(entrance.props.strokeDashoffset).toBeCloseTo(Number(entrance.props.strokeDasharray[0]));
    expect(screen.getByTestId('chart-series-desktop', HIDDEN).props.mask).toBeDefined();
  });

  it('draws a series at once whose isAnimationActive is false', async () => {
    await render(
      <BarChart data={data} width={320} height={200}>
        <Bar dataKey="desktop" fill="#2563eb" isAnimationActive={false} />
      </BarChart>,
    );

    expect(screen.getByTestId('chart-series-desktop', HIDDEN).props.clipPath).toBeUndefined();
  });
});
