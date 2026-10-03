import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { CardFooter, CardHeader, CardTitle } from '@/registry/bases/base-ui/ui/card';
import {
  AiProviderCard,
  AiProviderCardAction,
  AiProviderCardDescription,
  AiProviderCardLabel,
  AiProviderCardTrigger,
} from './ai-provider-card';

afterEach(cleanup);

describe('AiProviderCard', () => {
  it('can be focused and selected from the keyboard', () => {
    const onSelect = vi.fn();
    render(
      <AiProviderCard>
        <CardHeader>
          <CardTitle>OpenAI</CardTitle>
        </CardHeader>
        <AiProviderCardTrigger aria-label="Select OpenAI" onClick={onSelect} />
      </AiProviderCard>,
    );

    const trigger = screen.getByRole('button', { name: 'Select OpenAI' });
    trigger.focus();
    expect(document.activeElement).toBe(trigger);

    fireEvent.click(trigger);
    expect(onSelect).toHaveBeenCalledTimes(1);
  });

  it('does not invoke the trigger when the action is activated', () => {
    const onSelect = vi.fn();
    const onAction = vi.fn();
    render(
      <AiProviderCard>
        <CardFooter>
          <AiProviderCardAction>
            <button type="button" onClick={onAction}>
              toggle
            </button>
          </AiProviderCardAction>
        </CardFooter>
        <AiProviderCardTrigger aria-label="Select OpenAI" onClick={onSelect} />
      </AiProviderCard>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'toggle' }));

    expect(onAction).toHaveBeenCalledTimes(1);
    expect(onSelect).not.toHaveBeenCalled();
  });

  it("draws the label's tone as a status dot before its text", () => {
    const { container } = render(
      <AiProviderCard>
        <CardFooter>
          <AiProviderCardLabel tone="busy">Command failed</AiProviderCardLabel>
        </CardFooter>
      </AiProviderCard>,
    );

    expect(container.querySelector('[data-slot=status-indicator]')?.getAttribute('data-tone')).toBe('busy');
    expect(screen.getByText('Command failed')).toBeTruthy();
  });

  it('draws no dot on a label given no tone', () => {
    const { container } = render(<AiProviderCardLabel>12 models</AiProviderCardLabel>);

    expect(container.querySelector('[data-slot=status-indicator]')).toBeNull();
  });

  it('renders the composed header and description', () => {
    render(
      <AiProviderCard>
        <CardHeader>
          <CardTitle>Custom provider</CardTitle>
          <AiProviderCardDescription>Models</AiProviderCardDescription>
        </CardHeader>
      </AiProviderCard>,
    );

    expect(screen.getByText('Custom provider')).toBeTruthy();
    expect(screen.getByText('Models')).toBeTruthy();
  });
});
