import { fireEvent, isHiddenFromAccessibility, render, screen, userEvent } from '@testing-library/react-native';
import { emittedClasses } from '../../../build/slot-tokens.testing';
import { CardFooter, CardHeader, CardTitle } from '../../ui/card';
import { Switch } from '../../ui/switch';
import {
  AiProviderCard,
  AiProviderCardAction,
  AiProviderCardDescription,
  AiProviderCardLabel,
  AiProviderCardTrigger,
} from './ai-provider-card';

type ExampleProps = {
  onSelect?: () => void;
  onCheckedChange?: (checked: boolean) => void;
};

function Example({ onSelect, onCheckedChange = () => undefined }: ExampleProps) {
  return (
    <AiProviderCard testID="card">
      <CardHeader>
        <CardTitle>OpenAI</CardTitle>
        <AiProviderCardDescription>GPT reasoning and chat models.</AiProviderCardDescription>
      </CardHeader>
      <CardFooter>
        <AiProviderCardLabel tone="online">12 models</AiProviderCardLabel>
        <AiProviderCardAction>
          <Switch aria-label="Enable OpenAI" checked={false} onCheckedChange={onCheckedChange} />
        </AiProviderCardAction>
      </CardFooter>
      <AiProviderCardTrigger testID="trigger" aria-label="Select OpenAI" onPress={onSelect} />
    </AiProviderCard>
  );
}

function triggerClasses(style?: 'vega' | 'lyra'): string[] {
  return emittedClasses(screen.getByTestId('trigger').props.className, style);
}

describe('AiProviderCard', () => {
  it('draws its header, its description on at most two lines, and its note', async () => {
    await render(<Example />);

    expect(screen.getByRole('heading', { name: 'OpenAI' })).toBeOnTheScreen();
    expect(screen.getByText('GPT reasoning and chat models.').props.numberOfLines).toBe(2);
    expect(screen.getByText('12 models')).toBeOnTheScreen();
  });

  it('is a small card unless the caller sizes it', async () => {
    await render(<Example />);

    expect(emittedClasses(screen.getByTestId('card').props.className)).toEqual(
      expect.arrayContaining(['relative', 'h-full', 'py-4']),
    );
  });

  it('is selected through its trigger, a button named by its aria-label', async () => {
    const user = userEvent.setup();
    const onSelect = jest.fn();
    await render(<Example onSelect={onSelect} />);

    await user.press(screen.getByRole('button', { name: 'Select OpenAI' }));

    expect(onSelect).toHaveBeenCalledTimes(1);
  });

  it('is selected by a press on its content', async () => {
    const user = userEvent.setup();
    const onSelect = jest.fn();
    await render(<Example onSelect={onSelect} />);

    await user.press(screen.getByText('GPT reasoning and chat models.'));

    expect(onSelect).toHaveBeenCalledTimes(1);
  });

  it('does not select the card when the control in its action is pressed', async () => {
    const user = userEvent.setup();
    const onSelect = jest.fn();
    const onCheckedChange = jest.fn();
    await render(<Example onSelect={onSelect} onCheckedChange={onCheckedChange} />);

    await user.press(screen.getByRole('switch', { name: 'Enable OpenAI' }));

    expect(onCheckedChange).toHaveBeenCalledWith(true);
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('draws a card with no trigger as a plain card', async () => {
    await render(
      <AiProviderCard testID="card">
        <CardHeader>
          <CardTitle>OpenAI</CardTitle>
        </CardHeader>
      </AiProviderCard>,
    );

    expect(screen.queryByRole('button')).toBeNull();
    expect(screen.getByRole('heading', { name: 'OpenAI' })).toBeOnTheScreen();
  });

  it.each([
    ['vega', 'rounded-xl'],
    ['lyra', 'rounded-none'],
  ] as const)("rounds the trigger in %s to the card's %s, covering it under its content", async (style, radius) => {
    await render(<Example />);

    expect(triggerClasses(style)).toEqual(expect.arrayContaining([radius, 'absolute', 'inset-0', '-z-10']));
  });

  it('draws a hairline inside the edge while the trigger or the card is pressed', async () => {
    await render(<Example />);
    expect(triggerClasses()).not.toContain('border');

    await fireEvent(screen.getByTestId('trigger'), 'pressIn');
    expect(triggerClasses()).toEqual(expect.arrayContaining(['border', 'border-foreground/20']));
    await fireEvent(screen.getByTestId('trigger'), 'pressOut');
    expect(triggerClasses()).not.toContain('border');

    await fireEvent(screen.getByText('12 models'), 'pressIn');
    expect(triggerClasses()).toContain('border');
  });

  it('draws the wider focus ring while the trigger holds keyboard focus', async () => {
    await render(<Example />);

    await fireEvent(screen.getByTestId('trigger'), 'focus');

    expect(triggerClasses()).toEqual(expect.arrayContaining(['border-[3px]', 'border-ring/50']));

    await fireEvent(screen.getByTestId('trigger'), 'blur');

    expect(triggerClasses()).not.toContain('border-[3px]');
  });
});

describe('AiProviderCardLabel', () => {
  it('draws its tone as a status dot before its text, hidden from a screen reader', async () => {
    await render(
      <AiProviderCardLabel testID="label" tone="busy">
        Needs a key
      </AiProviderCardLabel>,
    );

    const dot = screen.getByTestId('label').children[0];
    expect(typeof dot).not.toBe('string');
    if (typeof dot === 'string') return;
    expect(isHiddenFromAccessibility(dot)).toBe(true);
    expect(screen.getByText('Needs a key').props.numberOfLines).toBe(1);
  });

  it('draws no dot without a tone', async () => {
    await render(<AiProviderCardLabel testID="label">12 models</AiProviderCardLabel>);

    expect(screen.getByTestId('label').children).toHaveLength(1);
  });

  it('sets its note in small muted text', async () => {
    await render(<AiProviderCardLabel>12 models</AiProviderCardLabel>);

    expect(emittedClasses(screen.getByText('12 models').props.className)).toEqual(
      expect.arrayContaining(['text-muted-foreground', 'text-xs']),
    );
  });
});
