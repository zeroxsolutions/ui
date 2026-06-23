import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeAll, describe, expect, it } from 'vitest';

import { ChatComposerGhostText } from './chat-composer-ghost-text';

// jsdom doesn't implement ResizeObserver (the overlay observes the textarea to
// stay aligned through auto-grow). It exists in every real browser target.
beforeAll(() => {
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
});

afterEach(cleanup);

function taRef() {
  return {
    current: document.createElement('textarea'),
  } as React.RefObject<HTMLTextAreaElement>;
}

describe('ChatComposerGhostText', () => {
  it('renders nothing when there is no suggestion', () => {
    const { container } = render(
      <ChatComposerGhostText textareaRef={taRef()} text="hello" suggestion="" />,
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders the suggestion after an invisible mirror of the draft', () => {
    render(
      <ChatComposerGhostText
        textareaRef={taRef()}
        text="hello"
        suggestion="world"
      />,
    );
    // The continuation is visible…
    expect(screen.getByText('world')).toBeTruthy();
    // …and the draft is mirrored (invisibly) so it starts at the caret.
    const mirror = screen.getByText('hello');
    expect(mirror.className).toContain('invisible');
  });
});
