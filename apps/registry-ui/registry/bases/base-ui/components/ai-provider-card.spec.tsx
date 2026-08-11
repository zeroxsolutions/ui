import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { AiProviderCard } from './ai-provider-card';

afterEach(cleanup);

describe('AiProviderCard', () => {
  it('invokes onSelect when the card body is clicked', () => {
    const onSelect = vi.fn();
    render(
      <AiProviderCard name="OpenAI" description="Models" onSelect={onSelect} />,
    );

    fireEvent.click(screen.getByText('OpenAI'));

    expect(onSelect).toHaveBeenCalledTimes(1);
  });

  it('does not invoke onSelect when the trailing action is activated', () => {
    const onSelect = vi.fn();
    const onAction = vi.fn();
    render(
      <AiProviderCard
        name="OpenAI"
        onSelect={onSelect}
        action={
          <button type="button" onClick={onAction}>
            toggle
          </button>
        }
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'toggle' }));

    expect(onAction).toHaveBeenCalledTimes(1);
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('shows the tone-styled status in place of the meta note', () => {
    render(
      <AiProviderCard
        name="Claude Code"
        meta="12 models"
        status={{ tone: 'busy', text: 'Command failed' }}
      />,
    );

    const status = screen.getByText('Command failed');
    expect(status.className).toContain('text-destructive');
    expect(screen.queryByText('12 models')).toBeNull();
  });

  it('renders with neither an icon nor a description', () => {
    render(<AiProviderCard name="Custom provider" />);

    expect(screen.getByText('Custom provider')).toBeTruthy();
  });
});
