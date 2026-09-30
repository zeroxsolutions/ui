import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import type { ComponentProps } from 'react';
import { afterEach, describe, expect, it } from 'vitest';

import {
  CollapsibleCard,
  CollapsibleCardActions,
  CollapsibleCardContent,
  CollapsibleCardHeader,
  CollapsibleCardTitle,
  CollapsibleCardTrigger,
} from './collapsible-card';

afterEach(cleanup);

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

    fireEvent.click(screen.getByRole('button', { name: 'Toggle' }));

    expect(screen.queryByText('Body')).toBeNull();
  });

  it('starts collapsed when defaultOpen is false', () => {
    renderCard({ defaultOpen: false });
    expect(screen.queryByText('Body')).toBeNull();
    expect(screen.getByRole('button', { name: 'Toggle' }).getAttribute('aria-expanded')).toBe('false');
  });

  it('stamps its variant on the root, default when none is given', () => {
    const { container } = renderCard();
    const root = container.querySelector('[data-slot="collapsible-card"]');
    expect(root?.getAttribute('data-variant')).toBe('default');
  });

  it('takes the plain variant', () => {
    const { container } = renderCard({ variant: 'plain' });
    const root = container.querySelector('[data-slot="collapsible-card"]');
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
    const trigger = screen.getByRole('button', { name: 'Toggle' });
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
    fireEvent.click(screen.getByRole('button', { name: 'Toggle' }));
    expect(clicks).toBe(1);
    expect(screen.queryByText('Body')).toBeNull();
  });
});
