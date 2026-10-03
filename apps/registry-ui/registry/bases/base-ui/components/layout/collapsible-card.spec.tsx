import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import * as React from 'react';
import type { ComponentProps } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  CollapsibleCard,
  CollapsibleCardActions,
  CollapsibleCardContent,
  CollapsibleCardHeader,
  CollapsibleCardTitle,
  CollapsibleCardTrigger,
} from './collapsible-card';

const { startAnimation, stopAnimation } = vi.hoisted(() => ({
  startAnimation: vi.fn(),
  stopAnimation: vi.fn(),
}));

vi.mock('@/registry/bases/base-ui/ui/chevron-down', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/registry/bases/base-ui/ui/chevron-down')>();
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
  vi.restoreAllMocks();
  startAnimation.mockClear();
  stopAnimation.mockClear();
});

function renderCard(props: ComponentProps<typeof CollapsibleCard> = {}) {
  return render(
    <CollapsibleCard {...props}>
      <CollapsibleCardHeader>
        <CollapsibleCardTitle>Layers</CollapsibleCardTitle>
        <CollapsibleCardActions>
          <CollapsibleCardTrigger />
        </CollapsibleCardActions>
      </CollapsibleCardHeader>
      <CollapsibleCardContent>Body</CollapsibleCardContent>
    </CollapsibleCard>,
  );
}

describe('CollapsibleCard', () => {
  it('opens by default and collapses from its trigger', () => {
    renderCard();
    expect(screen.getByText('Body')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Toggle content' }));

    expect(screen.queryByText('Body')).toBeNull();
  });

  it('starts collapsed when defaultOpen is false', () => {
    renderCard({ defaultOpen: false });
    expect(screen.queryByText('Body')).toBeNull();
    expect(screen.getByRole('button', { name: 'Toggle content' }).getAttribute('aria-expanded')).toBe('false');
  });

  it('stamps its variant on the root, default when none is given', () => {
    const { container } = renderCard();
    const root = container.firstElementChild;
    expect(root?.getAttribute('data-variant')).toBe('default');
  });

  it('takes the plain variant', () => {
    const { container } = renderCard({ variant: 'plain' });
    const root = container.firstElementChild;
    expect(root?.getAttribute('data-variant')).toBe('plain');
  });

  it('lets the trigger take its own content and name', () => {
    render(
      <CollapsibleCard>
        <CollapsibleCardTrigger aria-label="Collapse layers">Layers</CollapsibleCardTrigger>
        <CollapsibleCardContent>Body</CollapsibleCardContent>
      </CollapsibleCard>,
    );
    const trigger = screen.getByRole('button', { name: 'Collapse layers' });
    expect(trigger.textContent).toBe('Layers');
  });

  it('names a trigger with text children by that text', () => {
    render(
      <CollapsibleCard>
        <CollapsibleCardTrigger>Layers</CollapsibleCardTrigger>
        <CollapsibleCardContent>Body</CollapsibleCardContent>
      </CollapsibleCard>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Layers' }));
    expect(screen.queryByText('Body')).toBeNull();
  });

  it("runs the caller's hover and focus handlers on the trigger beside its own", () => {
    const calls: string[] = [];
    render(
      <CollapsibleCard>
        <CollapsibleCardTrigger
          onMouseEnter={() => calls.push('enter')}
          onMouseLeave={() => calls.push('leave')}
          onFocus={() => calls.push('focus')}
          onBlur={() => calls.push('blur')}
        />
        <CollapsibleCardContent>Body</CollapsibleCardContent>
      </CollapsibleCard>,
    );
    const trigger = screen.getByRole('button', { name: 'Toggle content' });
    fireEvent.mouseEnter(trigger);
    fireEvent.mouseLeave(trigger);
    fireEvent.focus(trigger);
    fireEvent.blur(trigger);
    expect(calls).toEqual(['enter', 'leave', 'focus', 'blur']);
  });

  it('composes a caller onClick on the trigger with the toggle', () => {
    let clicks = 0;
    render(
      <CollapsibleCard>
        <CollapsibleCardTrigger onClick={() => (clicks += 1)} />
        <CollapsibleCardContent>Body</CollapsibleCardContent>
      </CollapsibleCard>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Toggle content' }));
    expect(clicks).toBe(1);
    expect(screen.queryByText('Body')).toBeNull();
  });

  it('skips the chevron hover and focus animation when the user prefers reduced motion', () => {
    stubPrefersReducedMotion(true);
    renderCard();
    const trigger = screen.getByRole('button', { name: 'Toggle content' });

    fireEvent.mouseEnter(trigger);
    fireEvent.focus(trigger);
    expect(startAnimation).not.toHaveBeenCalled();

    fireEvent.mouseLeave(trigger);
    fireEvent.blur(trigger);
    expect(stopAnimation).not.toHaveBeenCalled();
  });
});
