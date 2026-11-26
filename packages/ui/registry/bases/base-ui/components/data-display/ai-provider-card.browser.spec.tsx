import { describe, expect, it, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-react';

import { CardFooter, CardHeader, CardTitle } from '@/registry/bases/base-ui/ui/card';
import {
  AiProviderCard,
  AiProviderCardAction,
  AiProviderCardDescription,
  AiProviderCardLabel,
  AiProviderCardTrigger,
} from './ai-provider-card';

describe('AiProviderCard', () => {
  it('is reached with Tab and selected with Enter', async () => {
    const onSelect = vi.fn();
    await render(
      <AiProviderCard>
        <CardHeader>
          <CardTitle>OpenAI</CardTitle>
        </CardHeader>
        <AiProviderCardTrigger aria-label="Select OpenAI" onClick={onSelect} />
      </AiProviderCard>,
    );

    await userEvent.tab();
    await expect.element(page.getByRole('button', { name: 'Select OpenAI' })).toHaveFocus();
    await userEvent.keyboard('{Enter}');

    expect(onSelect).toHaveBeenCalledTimes(1);
  });

  it('lets a pointer reach an action over the card without selecting the card', async () => {
    const onSelect = vi.fn();
    const onAction = vi.fn();
    await render(
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

    await userEvent.click(page.getByRole('button', { name: 'toggle' }), { timeout: 2000 });

    expect(onAction).toHaveBeenCalledTimes(1);
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('draws a status dot before a label given a tone, and none before one given no tone', async () => {
    await render(
      <AiProviderCard>
        <CardFooter>
          <AiProviderCardLabel tone="busy">Command failed</AiProviderCardLabel>
          <AiProviderCardLabel>12 models</AiProviderCardLabel>
        </CardFooter>
      </AiProviderCard>,
    );

    await expect.element(page.getByText('Command failed')).toBeVisible();
    const dots = page.getByTestId('status-indicator').all();
    expect(dots).toHaveLength(1);
    expect(page.getByText('Command failed').element().parentElement?.contains(dots[0].element())).toBe(true);
  });

  it('renders the composed header and description', async () => {
    await render(
      <AiProviderCard>
        <CardHeader>
          <CardTitle>Custom provider</CardTitle>
          <AiProviderCardDescription>Models</AiProviderCardDescription>
        </CardHeader>
      </AiProviderCard>,
    );

    await expect.element(page.getByText('Custom provider')).toBeVisible();
    await expect.element(page.getByText('Models')).toBeVisible();
  });
});
