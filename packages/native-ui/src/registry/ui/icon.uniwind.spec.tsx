import { render, screen } from '@testing-library/react-native';
import { Check } from 'lucide-react-native';
import { Icon } from './icon.uniwind';

// Uniwind's HOC resolves className to the mapped props, which the jest run has no engine for; it only needs to pass props on.
jest.mock('uniwind', () => ({ withUniwind: (component: unknown) => component }));

describe('Icon on Uniwind', () => {
  it('does not pass the className it mapped on to the svg', async () => {
    await render(<Icon as={Check} className="size-4 text-red-500" accessible role="img" aria-label="Saved" />);

    expect(screen.getByRole('img', { name: 'Saved' }).props.className).not.toMatch(/size-4|text-red-500/);
  });
});
