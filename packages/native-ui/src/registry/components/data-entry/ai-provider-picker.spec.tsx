import { render, screen, userEvent } from '@testing-library/react-native';
import { AI_PROVIDER_PICKER_SAMPLE_ENTRIES, AiProviderPicker } from './ai-provider-picker';

const ENTRIES = [
  { provider: 'openai', name: 'OpenAI', description: 'Chat models.', meta: '12 models' },
  { provider: 'claude', name: 'Anthropic Claude', description: 'Long-context models.' },
];

describe('AiProviderPicker', () => {
  it('shows one card per entry, titled by its name, with its description', async () => {
    await render(<AiProviderPicker entries={ENTRIES} />);

    expect(screen.getAllByRole('heading').map((heading) => heading.props.children)).toEqual([
      'OpenAI',
      'Anthropic Claude',
    ]);
    expect(screen.getByText('Chat models.')).toBeOnTheScreen();
    expect(screen.getByText('Long-context models.')).toBeOnTheScreen();
  });

  it('offers every card as a button named Select and the entry name, with or without onSelect', async () => {
    await render(<AiProviderPicker entries={ENTRIES} />);

    expect(screen.getByRole('button', { name: 'Select OpenAI' })).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Select Anthropic Claude' })).toBeOnTheScreen();
  });

  it('calls onSelect with the provider key of the card pressed', async () => {
    const user = userEvent.setup();
    const onSelect = jest.fn();
    await render(<AiProviderPicker entries={ENTRIES} onSelect={onSelect} />);

    await user.press(screen.getByRole('button', { name: 'Select Anthropic Claude' }));

    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith('claude');
  });

  it('shows the note only of an entry that has one', async () => {
    await render(<AiProviderPicker entries={ENTRIES} />);

    expect(screen.getByText('12 models')).toBeOnTheScreen();
    expect(screen.queryAllByText(/models$/)).toHaveLength(1);
  });

  it('shows the sample entries when given none', async () => {
    await render(<AiProviderPicker />);

    for (const entry of AI_PROVIDER_PICKER_SAMPLE_ENTRIES) {
      expect(screen.getByRole('button', { name: `Select ${entry.name}` })).toBeOnTheScreen();
    }
  });
});
