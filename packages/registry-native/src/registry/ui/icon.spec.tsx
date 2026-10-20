import { render, screen } from '@testing-library/react-native';
import { Check } from 'lucide-react-native';
import { Icon } from './icon';

describe('Icon', () => {
  it('renders the lucide icon it is given', async () => {
    await render(<Icon as={Check} accessible role="img" aria-label="Saved" />);

    expect(screen.getByRole('img', { name: 'Saved' })).toBeOnTheScreen();
  });
});
