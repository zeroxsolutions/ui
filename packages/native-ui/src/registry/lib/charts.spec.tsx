import { act, render, screen } from '@testing-library/react-native';
import { Bar, BarChart, YAxis } from './charts';

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

  it('counts up from 0 for data with nothing above 0', async () => {
    await render(<ValueAxis values={[0]} />);
    expect(yTicks()).toEqual(['0', '1', '2', '3', '4']);
  });
});

describe('a chart entrance', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    mockMotion.reduced = false;
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('grows the bars in from nothing', async () => {
    await render(<Bars />);
    expect(screen.queryAllByTestId(/^chart-bar-/, HIDDEN)).toHaveLength(0);

    await act(async () => {
      jest.advanceTimersByTime(2000);
    });

    expect(screen.getAllByTestId(/^chart-bar-/, HIDDEN)).toHaveLength(2);
  });

  it('draws the bars at once where the system asks for reduced motion', async () => {
    mockMotion.reduced = true;

    await render(<Bars />);

    expect(screen.getAllByTestId(/^chart-bar-/, HIDDEN)).toHaveLength(2);
  });
});
