import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { CardFooter, CardHeader, CardTitle } from '@/registry/bases/base-ui/ui/card';
import {
  AiProviderCard,
  AiProviderCardAction,
  AiProviderCardDescription,
  AiProviderCardStatus,
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

  it('carries the status tone on the root for the status note to read', () => {
    render(
      <AiProviderCard status="busy">
        <CardFooter>
          <AiProviderCardStatus>Command failed</AiProviderCardStatus>
        </CardFooter>
      </AiProviderCard>,
    );

    const card = document.querySelector('[data-slot="ai-provider-card"]');
    expect(card?.getAttribute('data-status')).toBe('busy');
    expect(card?.querySelector('[data-slot="ai-provider-card-status"]')?.textContent).toBe('Command failed');
  });

  it('sets no status when none is given', () => {
    render(<AiProviderCard />);

    expect(document.querySelector('[data-slot="ai-provider-card"]')?.hasAttribute('data-status')).toBe(false);
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
    expect(document.querySelector('[data-slot="card-description"]')?.textContent).toBe('Models');
  });

  it("keeps the upstream card-description slot so CardHeader's own recipe selects on it", () => {
    render(
      <AiProviderCard>
        <CardHeader>
          <CardTitle>Custom provider</CardTitle>
          <AiProviderCardDescription>Models</AiProviderCardDescription>
        </CardHeader>
      </AiProviderCard>,
    );

    const header = document.querySelector('[data-slot="card-header"]');
    expect(header?.querySelector('[data-slot="card-description"]')?.textContent).toBe('Models');
  });
});
