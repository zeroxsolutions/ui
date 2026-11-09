import { render, screen } from '@testing-library/react-native';
import { emittedClasses } from '../../../build/slot-tokens.testing';
import { UnsavedIndicator } from './unsaved-indicator';

describe('UnsavedIndicator', () => {
  it('is announced as an image named Unsaved changes', async () => {
    await render(<UnsavedIndicator />);

    expect(screen.getByRole('img', { name: 'Unsaved changes' })).toBeOnTheScreen();
  });

  it("is named in the caller's language with aria-label", async () => {
    await render(<UnsavedIndicator aria-label="Modifications non enregistrees" />);

    expect(screen.getByRole('img', { name: 'Modifications non enregistrees' })).toBeOnTheScreen();
    expect(screen.queryByRole('img', { name: 'Unsaved changes' })).toBeNull();
  });

  it('draws a small round dot in the foreground at 70%', async () => {
    await render(<UnsavedIndicator className="ml-1" />);

    expect(emittedClasses(screen.getByRole('img').props.className)).toEqual(
      expect.arrayContaining(['bg-foreground/70', 'size-2', 'shrink-0', 'rounded-full', 'ml-1']),
    );
  });
});
