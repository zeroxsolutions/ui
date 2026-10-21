import { render, screen } from '@testing-library/react-native';
import { emittedClasses } from '../../build/slot-tokens.testing';
import { Skeleton } from './skeleton';

describe('Skeleton', () => {
  it("is a muted rounded block that pulses with NativeWind's animate-pulse", async () => {
    await render(<Skeleton testID="skeleton" className="h-4 w-40" />);
    const classes = emittedClasses(screen.getByTestId('skeleton').props.className);

    expect(classes).toEqual(expect.arrayContaining(['bg-muted', 'rounded-md', 'animate-pulse', 'h-4', 'w-40']));
  });

  it('lets a caller radius win over its own', async () => {
    await render(<Skeleton testID="skeleton" className="rounded-full" />);
    const classes = emittedClasses(screen.getByTestId('skeleton').props.className);

    expect(classes).toContain('rounded-full');
    expect(classes).not.toContain('rounded-md');
  });
});
