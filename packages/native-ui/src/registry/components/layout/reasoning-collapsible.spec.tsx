import { act, render, screen, userEvent } from '@testing-library/react-native';
import type { ReactNode } from 'react';
import { useReasoningCollapsible } from '../../hooks/use-reasoning-collapsible';
import { Text } from '../../ui/text';
import {
  ReasoningCollapsible,
  ReasoningCollapsibleContent,
  ReasoningCollapsibleTrigger,
  type ReasoningCollapsibleProps,
} from './reasoning-collapsible';

/** Words the label from the live state, returning a string as the web's does. */
function ReasoningLabel(): ReactNode {
  const { streaming, duration } = useReasoningCollapsible();
  return streaming ? 'Thinking...' : `Thought for ${duration ?? 'a few'} seconds`;
}

function Example(props: ReasoningCollapsibleProps) {
  return (
    <ReasoningCollapsible {...props}>
      <ReasoningCollapsibleTrigger>
        <ReasoningLabel />
      </ReasoningCollapsibleTrigger>
      <ReasoningCollapsibleContent>Checking the logs.</ReasoningCollapsibleContent>
    </ReasoningCollapsible>
  );
}

beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

describe('ReasoningCollapsible', () => {
  it('starts closed when not streaming, its trigger a collapsed button named by its label', async () => {
    await render(<Example />);

    expect(screen.getByRole('button', { name: 'Thought for a few seconds' })).toBeCollapsed();
    expect(screen.queryByText('Checking the logs.')).toBeNull();
  });

  it('opens while streaming, and closes a second after the stream ends, with its duration', async () => {
    await render(<Example streaming />);

    expect(screen.getByRole('button', { name: 'Thinking...' })).toBeExpanded();
    expect(screen.getByText('Checking the logs.')).toBeVisible();

    await act(async () => {
      jest.advanceTimersByTime(2500);
    });
    await screen.rerender(<Example streaming={false} />);

    expect(screen.getByText('Thought for 3 seconds')).toBeOnTheScreen();
    expect(screen.getByText('Checking the logs.')).toBeVisible();

    await act(async () => {
      jest.advanceTimersByTime(1000);
    });

    expect(screen.getByRole('button', { name: 'Thought for 3 seconds' })).toBeCollapsed();
    expect(screen.queryByText('Checking the logs.')).toBeNull();
  });

  it('opens when a stream starts', async () => {
    await render(<Example />);

    await screen.rerender(<Example streaming />);

    expect(screen.getByText('Checking the logs.')).toBeVisible();
  });

  it('stays closed through a stream with defaultOpen false', async () => {
    await render(<Example streaming defaultOpen={false} />);

    expect(screen.queryByText('Checking the logs.')).toBeNull();
  });

  it('closes itself once only, so reopened reasoning stays open', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    const onOpenChange = jest.fn();
    await render(<Example streaming onOpenChange={onOpenChange} />);
    await screen.rerender(<Example streaming={false} onOpenChange={onOpenChange} />);
    await act(async () => {
      jest.advanceTimersByTime(1000);
    });
    expect(screen.queryByText('Checking the logs.')).toBeNull();

    await user.press(screen.getByRole('button'));
    await act(async () => {
      jest.advanceTimersByTime(5000);
    });

    expect(onOpenChange).toHaveBeenCalledWith(true);
    expect(screen.getByText('Checking the logs.')).toBeVisible();
  });

  it('throws when its hook is read outside it', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => undefined);

    await expect(render(<ReasoningLabel />)).rejects.toThrow(
      'ReasoningCollapsible parts must be used within <ReasoningCollapsible>',
    );
  });

  it('holds a Text body as given', async () => {
    await render(
      <ReasoningCollapsible defaultOpen>
        <ReasoningCollapsibleContent>
          <Text>Reading the retry policy.</Text>
        </ReasoningCollapsibleContent>
      </ReasoningCollapsible>,
    );

    expect(screen.getByText('Reading the retry policy.')).toBeVisible();
  });
});
