import { render, screen } from '@testing-library/react-native';
import { emittedClasses } from '../../build/slot-tokens.testing';
import { Progress } from './progress';

// The progress bar is one accessible element, so its indicator is reached as its child.
function indicator() {
  const [child] = screen.getByRole('progressbar').children;
  if (typeof child === 'string') throw new Error('The indicator is not an element');
  return child;
}

describe('Progress', () => {
  it('fills the indicator to its value and announces it', async () => {
    await render(<Progress value={40} />);

    expect(indicator().props.style).toEqual(expect.objectContaining({ width: '40%' }));
    expect(screen.getByRole('progressbar').props.accessibilityValue).toEqual(
      expect.objectContaining({ min: 0, max: 100, now: 40 }),
    );
  });

  it('is empty with no value', async () => {
    await render(<Progress />);

    expect(indicator().props.style).toEqual(expect.objectContaining({ width: '0%' }));
  });

  it.each([
    [-10, '0%', 0],
    [250, '100%', 100],
    [Number.NaN, '0%', 0],
  ])('draws and announces a value of %s as %s', async (value, width, now) => {
    await render(<Progress value={value} />);

    expect(indicator().props.style).toEqual(expect.objectContaining({ width }));
    expect(screen.getByRole('progressbar').props.accessibilityValue).toEqual(expect.objectContaining({ now }));
  });

  it("draws Vega's muted track and primary indicator", async () => {
    await render(<Progress value={40} testID="track" />);

    expect(emittedClasses(screen.getByTestId('track').props.className)).toEqual(
      expect.arrayContaining(['bg-muted', 'h-1.5', 'rounded-full']),
    );
    expect(emittedClasses(indicator().props.className)).toContain('bg-primary');
  });
});
