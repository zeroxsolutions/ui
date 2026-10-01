import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { Wrench } from 'lucide-react';
import { afterEach, describe, expect, it } from 'vitest';

import {
  ToolCallCard,
  ToolCallCardContent,
  ToolCallCardDescription,
  ToolCallCardSection,
  ToolCallCardSectionTitle,
  ToolCallCardStatus,
  ToolCallCardTitle,
  ToolCallCardTrigger,
  type ToolCallCardState,
} from './tool-call-card';

afterEach(cleanup);

function Card({ state, defaultOpen }: { state: ToolCallCardState; defaultOpen?: boolean }) {
  return (
    <ToolCallCard state={state} defaultOpen={defaultOpen}>
      <ToolCallCardTrigger>
        <Wrench />
        <ToolCallCardTitle>search</ToolCallCardTitle>
        <ToolCallCardDescription>3 results</ToolCallCardDescription>
        <ToolCallCardStatus>Completed</ToolCallCardStatus>
      </ToolCallCardTrigger>
      <ToolCallCardContent>
        <ToolCallCardSection>
          <ToolCallCardSectionTitle>Parameters</ToolCallCardSectionTitle>
          <pre>{'{ "q": "hi" }'}</pre>
        </ToolCallCardSection>
      </ToolCallCardContent>
    </ToolCallCard>
  );
}

describe('ToolCallCard', () => {
  it.each<ToolCallCardState>(['input-streaming', 'input-available', 'output-available', 'output-error'])(
    'reflects the %s state on the root',
    (state) => {
      const { container } = render(<Card state={state} />);
      expect(container.firstElementChild?.getAttribute('data-state')).toBe(state);
    },
  );

  it('renders the header parts inside the trigger, which names the button', () => {
    render(<Card state="output-available" />);
    expect(screen.getByRole('button', { name: 'search 3 results Completed' })).toBeTruthy();
  });

  it('opens its sections from the trigger', () => {
    render(<Card state="output-available" />);
    expect(screen.queryByText('Parameters')).toBeNull();

    fireEvent.click(screen.getByRole('button'));
    expect(screen.getByRole('heading', { name: 'Parameters' })).toBeTruthy();
    expect(screen.getByText('{ "q": "hi" }')).toBeTruthy();
  });

  it('runs the caller onClick on the trigger and still toggles', () => {
    let clicks = 0;
    render(
      <ToolCallCard state="input-available">
        <ToolCallCardTrigger onClick={() => (clicks += 1)}>
          <ToolCallCardTitle>search</ToolCallCardTitle>
        </ToolCallCardTrigger>
        <ToolCallCardContent>body</ToolCallCardContent>
      </ToolCallCard>,
    );
    fireEvent.click(screen.getByRole('button'));
    expect(clicks).toBe(1);
    expect(screen.getByText('body')).toBeTruthy();
  });
});
