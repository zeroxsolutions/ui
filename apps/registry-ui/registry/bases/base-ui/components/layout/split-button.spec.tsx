import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

import {
  SplitButton,
  SplitButtonAction,
  SplitButtonContent,
  SplitButtonItem,
  SplitButtonMenu,
  SplitButtonTrigger,
} from './split-button';

beforeAll(() => {
  Element.prototype.scrollIntoView = () => {};
  Element.prototype.getAnimations ??= () => [];
  globalThis.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
});

afterEach(cleanup);

function Example({ onPrimary = () => {}, onSession = () => {} }: { onPrimary?: () => void; onSession?: () => void }) {
  return (
    <SplitButton>
      <SplitButtonAction onClick={onPrimary}>Allow once</SplitButtonAction>
      <SplitButtonMenu>
        <SplitButtonTrigger aria-label="More allow options" />
        <SplitButtonContent>
          <SplitButtonItem onClick={onSession}>Allow this session</SplitButtonItem>
        </SplitButtonContent>
      </SplitButtonMenu>
    </SplitButton>
  );
}

describe('SplitButton', () => {
  it('renders the primary and caret as two segments of one group', () => {
    render(<Example />);

    const group = screen.getByRole('group'); // throws if the ButtonGroup is missing
    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(2);
    // both segments live inside the single group — one divided control
    expect(group.contains(buttons[0])).toBe(true);
    expect(group.contains(buttons[1])).toBe(true);
    // getByRole throws if absent, so these assert the two named segments exist
    screen.getByRole('button', { name: 'Allow once' });
    screen.getByRole('button', { name: 'More allow options' });
  });

  it('runs the fixed primary action on a primary click', () => {
    const onPrimary = vi.fn();
    render(<Example onPrimary={onPrimary} />);

    fireEvent.click(screen.getByRole('button', { name: 'Allow once' }));
    expect(onPrimary).toHaveBeenCalledTimes(1);
  });

  it("opens the menu from the caret and runs the item's own handler", async () => {
    const onSession = vi.fn();
    render(<Example onSession={onSession} />);

    fireEvent.click(screen.getByRole('button', { name: 'More allow options' }));
    fireEvent.click(await screen.findByText('Allow this session'));
    expect(onSession).toHaveBeenCalledTimes(1);
  });
});
