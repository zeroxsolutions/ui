import { render, screen } from '@testing-library/react-native';
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
});
