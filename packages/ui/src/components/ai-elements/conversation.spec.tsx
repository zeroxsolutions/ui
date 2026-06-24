import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeAll, describe, expect, it } from 'vitest';

import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from './conversation';

beforeAll(() => {
  // Base UI ScrollArea + the stick-to-bottom effect both measure via
  // ResizeObserver; jsdom ships none.
  globalThis.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
  Element.prototype.getAnimations ??= () => [];
});

afterEach(cleanup);

function setGeometry(
  el: HTMLElement,
  { scrollHeight, clientHeight, scrollTop }: Record<string, number>,
) {
  Object.defineProperty(el, 'scrollHeight', {
    value: scrollHeight,
    configurable: true,
  });
  Object.defineProperty(el, 'clientHeight', {
    value: clientHeight,
    configurable: true,
  });
  let top = scrollTop;
  Object.defineProperty(el, 'scrollTop', {
    get: () => top,
    set: (v: number) => {
      top = v;
    },
    configurable: true,
  });
}

describe('Conversation', () => {
  it('renders its content inside the scroll viewport', () => {
    const { container } = render(
      <Conversation>
        <ConversationContent>hello there</ConversationContent>
      </Conversation>,
    );
    expect(screen.getByText('hello there')).toBeTruthy();
    expect(
      container.querySelector('[data-slot="scroll-area-viewport"]'),
    ).toBeTruthy();
  });

  it('keeps ConversationContent a flex column and merges consumer classes', () => {
    render(
      <Conversation>
        <ConversationContent className="max-w-3xl">body</ConversationContent>
      </Conversation>,
    );
    // The content child stays display:flex — the removed `block!` override used
    // to collapse the message gap. Both the base flex classes and the
    // consumer's className survive.
    const content = screen.getByText('body');
    expect(content.className).toContain('flex');
    expect(content.className).toContain('flex-col');
    expect(content.className).toContain('gap-3');
    expect(content.className).toContain('max-w-3xl');
  });

  it('does not paint a viewport-content-child display override on the root', () => {
    const { container } = render(
      <Conversation>
        <ConversationContent>body</ConversationContent>
      </Conversation>,
    );
    const root = container.querySelector('[data-slot="scroll-area"]');
    // The fragile Radix-era descendant selector is gone.
    expect(root?.className ?? '').not.toContain('scroll-area-viewport');
  });

  it('hides the scroll button while pinned to the bottom', () => {
    render(
      <Conversation>
        <ConversationContent>body</ConversationContent>
        <ConversationScrollButton />
      </Conversation>,
    );
    expect(screen.queryByRole('button', { name: 'Scroll to bottom' })).toBeNull();
  });

  it('shows the scroll button after scrolling away, then hides it on jump', () => {
    const { container } = render(
      <Conversation>
        <ConversationContent>body</ConversationContent>
        <ConversationScrollButton />
      </Conversation>,
    );
    const vp = container.querySelector<HTMLElement>(
      '[data-slot="scroll-area-viewport"]',
    )!;
    setGeometry(vp, { scrollHeight: 1000, clientHeight: 100, scrollTop: 0 });
    fireEvent.scroll(vp);

    const button = screen.getByRole('button', { name: 'Scroll to bottom' });
    expect(button).toBeTruthy();

    fireEvent.click(button);
    expect(vp.scrollTop).toBe(1000);
    expect(
      screen.queryByRole('button', { name: 'Scroll to bottom' }),
    ).toBeNull();
  });
});
