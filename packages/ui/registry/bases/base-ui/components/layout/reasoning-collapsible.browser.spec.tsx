import type { ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-react';

import { drawingIn, expectPlaying, expectStill, playMotion } from '../../../../../test/motion';
import {
  ReasoningCollapsible,
  ReasoningCollapsibleContent,
  ReasoningCollapsibleTrigger,
} from './reasoning-collapsible';
import { useReasoningCollapsible } from '../../hooks/use-reasoning-collapsible';

function Reasoning() {
  return (
    <ReasoningCollapsible>
      <ReasoningCollapsibleTrigger>Thought for 3s</ReasoningCollapsibleTrigger>
      <ReasoningCollapsibleContent>thought</ReasoningCollapsibleContent>
    </ReasoningCollapsible>
  );
}

function Label(): ReactNode {
  const { streaming, duration } = useReasoningCollapsible();
  return streaming ? 'Thinking' : `Thought for ${duration ?? '?'}s`;
}

function Streamed({ streaming, defaultOpen }: { streaming?: boolean; defaultOpen?: boolean }): ReactNode {
  return (
    <ReasoningCollapsible streaming={streaming} defaultOpen={defaultOpen}>
      <ReasoningCollapsibleTrigger>
        <Label />
      </ReasoningCollapsibleTrigger>
      <ReasoningCollapsibleContent>
        <strong>bold</strong> thought
      </ReasoningCollapsibleContent>
    </ReasoningCollapsible>
  );
}

describe('ReasoningCollapsible', () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('renders the node it is given as content while open', async () => {
    await render(<Streamed defaultOpen />);

    await expect.element(page.getByText('bold')).toBeVisible();
  });

  it('renders the consumer label inside the trigger', async () => {
    await render(<Streamed streaming />);

    await expect.element(page.getByRole('button')).toHaveTextContent('Thinking');
  });

  it('opens while streaming, reports the elapsed seconds and closes after the stream ends', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date'] });
    vi.setSystemTime(0);
    const { rerender } = await render(<Streamed streaming />);
    await expect.element(page.getByText('bold')).toBeVisible();

    vi.setSystemTime(2500);
    await rerender(<Streamed streaming={false} />);
    await expect.element(page.getByRole('button')).toHaveTextContent('Thought for 3s');

    await vi.advanceTimersByTimeAsync(1000);
    await expect.element(page.getByRole('button')).toHaveAttribute('aria-expanded', 'false');
  });

  it('throws when the hook is used outside <ReasoningCollapsible>', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});

    await expect(render(<Label />)).rejects.toThrow(/must be used within <ReasoningCollapsible>/);
  });
});

// The browser project runs as a viewer who asked for reduced motion.
describe('ReasoningCollapsibleTrigger under reduced motion', () => {
  it('keeps the chevron still on hover and focus', async () => {
    await render(<Reasoning />);
    const trigger = page.getByRole('button', { name: 'Thought for 3s' });

    await userEvent.hover(trigger);
    await expectStill(trigger.element());
    await userEvent.tab();
    await expectStill(trigger.element());
  });
});

describe('ReasoningCollapsibleTrigger in motion', () => {
  playMotion();

  it('plays its chevron while the pointer is on it', async () => {
    // The pointer rests where an earlier case left it, over where this control mounts, so it is moved off first.
    await userEvent.unhover(document.body);
    await render(<Reasoning />);
    const trigger = page.getByRole('button', { name: 'Thought for 3s' });
    const rest = drawingIn(trigger.element());

    await userEvent.hover(trigger);
    await expectPlaying(trigger.element(), rest);
  });
});
