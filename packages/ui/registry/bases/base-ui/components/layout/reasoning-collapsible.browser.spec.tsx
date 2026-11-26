import { describe, it } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-react';

import { drawingIn, expectPlaying, expectStill, playMotion } from '../../../../../test/motion';
import {
  ReasoningCollapsible,
  ReasoningCollapsibleContent,
  ReasoningCollapsibleTrigger,
} from './reasoning-collapsible';

function Reasoning() {
  return (
    <ReasoningCollapsible>
      <ReasoningCollapsibleTrigger>Thought for 3s</ReasoningCollapsibleTrigger>
      <ReasoningCollapsibleContent>thought</ReasoningCollapsibleContent>
    </ReasoningCollapsible>
  );
}

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
