import type { ComponentProps } from 'react';
import { describe, expect, it } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-react';

import { drawingIn, expectPlaying, expectStill, playMotion } from '../../../../../test/motion';
import {
  CollapsibleCard,
  CollapsibleCardActions,
  CollapsibleCardContent,
  CollapsibleCardHeader,
  CollapsibleCardTitle,
  CollapsibleCardTrigger,
} from './collapsible-card';

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

const body = () => page.getByText('Body');

describe('CollapsibleCard', () => {
  it('opens by default and collapses from its trigger', async () => {
    await renderCard();
    await expect.element(body()).toBeVisible();

    await userEvent.click(page.getByRole('button', { name: 'Toggle content' }));

    await expect.element(body()).not.toBeInTheDocument();
  });

  it('starts collapsed when defaultOpen is false', async () => {
    await renderCard({ defaultOpen: false });
    await expect.element(body()).not.toBeInTheDocument();
    await expect
      .element(page.getByRole('button', { name: 'Toggle content' }))
      .toHaveAttribute('aria-expanded', 'false');
  });

  it('lets the trigger take its own content and name', async () => {
    await render(
      <CollapsibleCard>
        <CollapsibleCardTrigger aria-label="Collapse layers">Layers</CollapsibleCardTrigger>
        <CollapsibleCardContent>Body</CollapsibleCardContent>
      </CollapsibleCard>,
    );
    await expect.element(page.getByRole('button', { name: 'Collapse layers' })).toHaveTextContent('Layers');
  });

  it('names a trigger with text children by that text', async () => {
    await render(
      <CollapsibleCard>
        <CollapsibleCardTrigger>Layers</CollapsibleCardTrigger>
        <CollapsibleCardContent>Body</CollapsibleCardContent>
      </CollapsibleCard>,
    );
    await userEvent.click(page.getByRole('button', { name: 'Layers' }));
    await expect.element(body()).not.toBeInTheDocument();
  });

  it('names a trigger whose children are an icon alone "Toggle content"', async () => {
    await render(
      <CollapsibleCard>
        <CollapsibleCardTrigger>
          <svg aria-hidden />
        </CollapsibleCardTrigger>
        <CollapsibleCardContent>Body</CollapsibleCardContent>
      </CollapsibleCard>,
    );
    await userEvent.click(page.getByRole('button', { name: 'Toggle content' }));
    await expect.element(body()).not.toBeInTheDocument();
  });

  it('names a trigger by text nested in its children', async () => {
    await render(
      <CollapsibleCard>
        <CollapsibleCardTrigger>
          <svg aria-hidden />
          <span>Layers</span>
        </CollapsibleCardTrigger>
        <CollapsibleCardContent>Body</CollapsibleCardContent>
      </CollapsibleCard>,
    );
    await expect.element(page.getByRole('button', { name: 'Layers' })).toBeVisible();
  });

  it("runs the caller's hover and focus handlers on the trigger beside its own", async () => {
    const calls: string[] = [];
    await render(
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
    const trigger = page.getByRole('button', { name: 'Toggle content' });
    await userEvent.hover(trigger);
    await userEvent.unhover(trigger);
    await userEvent.tab();
    await userEvent.tab();
    expect(calls).toEqual(['enter', 'leave', 'focus', 'blur']);
  });

  it('composes a caller onClick on the trigger with the toggle', async () => {
    let clicks = 0;
    await render(
      <CollapsibleCard>
        <CollapsibleCardTrigger onClick={() => (clicks += 1)} />
        <CollapsibleCardContent>Body</CollapsibleCardContent>
      </CollapsibleCard>,
    );
    await userEvent.click(page.getByRole('button', { name: 'Toggle content' }));
    expect(clicks).toBe(1);
    await expect.element(body()).not.toBeInTheDocument();
  });

  // The browser project runs as a viewer who asked for reduced motion.
  it('keeps the chevron still on hover and focus when the user prefers reduced motion', async () => {
    await renderCard();
    const trigger = page.getByRole('button', { name: 'Toggle content' });

    await userEvent.hover(trigger);
    await expectStill(trigger.element());
    await userEvent.tab();
    await expectStill(trigger.element());
  });
});

describe('CollapsibleCardTrigger in motion', () => {
  playMotion();

  it('plays its chevron while the pointer is on it', async () => {
    // The pointer rests where an earlier case left it, over where this control mounts, so it is moved off first.
    await userEvent.unhover(document.body);
    await renderCard();
    const trigger = page.getByRole('button', { name: 'Toggle content' });
    const rest = drawingIn(trigger.element());

    await userEvent.hover(trigger);
    await expectPlaying(trigger.element(), rest);
  });
});
