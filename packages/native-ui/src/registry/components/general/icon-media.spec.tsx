import { render, screen } from '@testing-library/react-native';
import { IconMedia } from './icon-media';

describe('IconMedia', () => {
  it('is one image for a screen reader, named by its aria-label', async () => {
    await render(<IconMedia aria-label="Vision input" />);

    const image = screen.getByRole('img', { name: 'Vision input' });
    expect(image.props.accessible).toBe(true);
  });

  it('is no element of its own for a screen reader without a label', async () => {
    await render(<IconMedia testID="media" />);

    expect(screen.queryByRole('img')).toBeNull();
    expect(screen.getByTestId('media').props.accessible).toBe(false);
  });
});
