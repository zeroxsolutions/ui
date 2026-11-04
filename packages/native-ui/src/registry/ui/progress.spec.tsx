import { render, screen } from '@testing-library/react-native';
import { emittedClasses } from '../../build/slot-tokens.testing';
import { Progress, ProgressLabel, ProgressValue } from './progress';

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

describe('Progress with a label and a value', () => {
  function renderLabelled(props: { value?: number; 'aria-label'?: string } = {}) {
    return render(
      <Progress value={props.value ?? 56} aria-label={props['aria-label']} testID="progress">
        <ProgressLabel>Upload</ProgressLabel>
        <ProgressValue />
      </Progress>,
    );
  }

  it('is named by its label and announces its value', async () => {
    await renderLabelled();

    expect(screen.getByRole('progressbar', { name: 'Upload' }).props.accessibilityValue).toEqual(
      expect.objectContaining({ min: 0, max: 100, now: 56 }),
    );
  });

  it('keeps an aria-label over its label', async () => {
    await renderLabelled({ 'aria-label': 'Photo upload' });

    expect(screen.getByRole('progressbar', { name: 'Photo upload' })).toBeOnTheScreen();
  });

  it('draws the label, the value as a whole percentage, and the bar filled to it', async () => {
    await renderLabelled({ value: 33.4 });

    expect(screen.getByText('Upload', { includeHiddenElements: true })).toBeOnTheScreen();
    expect(screen.getByText('33%', { includeHiddenElements: true })).toBeOnTheScreen();
    const [, , track] = screen.getByTestId('progress').children;
    if (typeof track === 'string') throw new Error('The track is not an element');
    const [fill] = track.children;
    if (typeof fill === 'string') throw new Error('The indicator is not an element');
    expect(fill.props.style).toEqual(expect.objectContaining({ width: '33.4%' }));
  });

  it('draws what a function child of the value makes of the percentage', async () => {
    await render(
      <Progress value={3} testID="progress">
        <ProgressValue>{(formatted, value) => `${value} of 100 (${formatted})`}</ProgressValue>
      </Progress>,
    );

    expect(screen.getByText('3 of 100 (3%)', { includeHiddenElements: true })).toBeOnTheScreen();
  });

  it("draws Vega's label and muted value, on a row above the track", async () => {
    await renderLabelled();

    expect(emittedClasses(screen.getByText('Upload', { includeHiddenElements: true }).props.className)).toEqual(
      expect.arrayContaining(['text-sm', 'font-sans-medium']),
    );
    expect(emittedClasses(screen.getByText('56%', { includeHiddenElements: true }).props.className)).toEqual(
      expect.arrayContaining(['ml-auto', 'text-muted-foreground', 'text-sm']),
    );
    const [, , track] = screen.getByTestId('progress').children;
    if (typeof track === 'string') throw new Error('The track is not an element');
    expect(emittedClasses(track.props.className)).toEqual(expect.arrayContaining(['bg-muted', 'h-1.5', 'w-full']));
  });
});
