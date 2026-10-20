import { render, screen } from '@testing-library/react-native';
import { Check } from 'lucide-react-native';
import { registerCSS } from 'react-native-css-interop/test';
import { Icon } from './icon';

describe('Icon', () => {
  beforeEach(() => {
    registerCSS('.text-red-500 { color: #ef4444; } .size-4 { width: 16px; height: 16px; }');
  });

  it('renders the lucide icon it is given', async () => {
    await render(<Icon as={Check} accessible role="img" aria-label="Saved" />);

    expect(screen.getByRole('img', { name: 'Saved' })).toBeOnTheScreen();
  });

  it('draws the glyph in the colour and size its classes name', async () => {
    await render(<Icon as={Check} className="size-4 text-red-500" accessible role="img" aria-label="Saved" />);

    const glyph = screen.getByRole('img', { name: 'Saved' });
    expect(glyph.props).toEqual(expect.objectContaining({ width: 16, height: 16, stroke: '#ef4444' }));
  });

  it('takes an explicit size and colour over its classes', async () => {
    await render(
      <Icon
        as={Check}
        className="size-4 text-red-500"
        size={24}
        color="#000000"
        accessible
        role="img"
        aria-label="Saved"
      />,
    );

    const glyph = screen.getByRole('img', { name: 'Saved' });
    expect(glyph.props).toEqual(expect.objectContaining({ width: 24, height: 24, stroke: '#000000' }));
  });
});
