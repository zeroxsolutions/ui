import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import * as React from 'react';
import type { ComponentProps, ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  ReasoningCollapsible,
  ReasoningCollapsibleContent,
  ReasoningCollapsibleTrigger,
} from './reasoning-collapsible';
import { useReasoningCollapsible } from '../../hooks/use-reasoning-collapsible';

const { startAnimation, stopAnimation } = vi.hoisted(() => ({
  startAnimation: vi.fn(),
  stopAnimation: vi.fn(),
}));

vi.mock('@/registry/bases/base-ui/icons/chevron-down-icon', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/registry/bases/base-ui/icons/chevron-down-icon')>();
  return {
    ...actual,
    ChevronDownIcon: React.forwardRef<unknown, ComponentProps<'div'>>((props, ref) => {
      React.useImperativeHandle(ref, () => ({ startAnimation, stopAnimation }));
      return <div aria-hidden={props['aria-hidden']} className={props.className} />;
    }),
  };
});

function stubPrefersReducedMotion(matches: boolean): void {
  vi.spyOn(window, 'matchMedia').mockReturnValue({
    matches,
    media: '(prefers-reduced-motion: reduce)',
    onchange: null,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
    addListener: () => undefined,
    removeListener: () => undefined,
    dispatchEvent: () => false,
  } as MediaQueryList);
}

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.restoreAllMocks();
  startAnimation.mockClear();
  stopAnimation.mockClear();
});

function Label(): ReactNode {
  const { streaming, duration } = useReasoningCollapsible();
  return streaming ? 'Thinking' : `Thought for ${duration ?? '?'}s`;
}

function Reasoning({ streaming, defaultOpen }: { streaming?: boolean; defaultOpen?: boolean }): ReactNode {
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
  it('marks the root only while the reasoning is streaming', () => {
    const { container, rerender } = render(<Reasoning streaming />);
    expect(container.firstElementChild?.hasAttribute('data-streaming')).toBe(true);

    rerender(<Reasoning streaming={false} />);
    expect(container.firstElementChild?.hasAttribute('data-streaming')).toBe(false);
  });

  it('renders the node it is given as content while open', () => {
    render(<Reasoning defaultOpen />);
    expect(screen.getByText('bold').tagName).toBe('STRONG');
  });

  it('renders the consumer label inside the trigger', () => {
    render(<Reasoning streaming />);
    expect(screen.getByRole('button').textContent).toBe('Thinking');
  });

  it('opens while streaming, reports the elapsed seconds and closes after the stream ends', () => {
    vi.useFakeTimers();
    vi.setSystemTime(0);
    const { rerender } = render(<Reasoning streaming />);
    expect(screen.getByText('bold')).toBeTruthy();

    vi.setSystemTime(2500);
    rerender(<Reasoning streaming={false} />);
    expect(screen.getByRole('button').textContent).toBe('Thought for 3s');

    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(screen.getByRole('button').getAttribute('aria-expanded')).toBe('false');
  });

  it('throws when the hook is used outside <ReasoningCollapsible>', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<Label />)).toThrow(/must be used within <ReasoningCollapsible>/);
  });

  it('skips the chevron hover and focus animation when the user prefers reduced motion', () => {
    stubPrefersReducedMotion(true);
    render(<Reasoning />);
    const trigger = screen.getByRole('button');

    fireEvent.mouseEnter(trigger);
    fireEvent.focus(trigger);
    expect(startAnimation).not.toHaveBeenCalled();

    fireEvent.mouseLeave(trigger);
    fireEvent.blur(trigger);
    expect(stopAnimation).not.toHaveBeenCalled();
  });
});
