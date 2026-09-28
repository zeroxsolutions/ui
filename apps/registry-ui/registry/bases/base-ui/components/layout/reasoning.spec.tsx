import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeAll, describe, expect, it } from 'vitest';

import { Reasoning, ReasoningContent, ReasoningTrigger } from './reasoning';

beforeAll(() => {
  // ReasoningContent renders MarkdownView (codeBlocks), whose CodeBlock measures
  // via a ResizeObserver and queries Element.getAnimations — absent in jsdom.
  globalThis.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
  Element.prototype.getAnimations ??= () => [];
});

afterEach(cleanup);

describe('Reasoning', () => {
  it('shows the streaming label while streaming', () => {
    render(
      <Reasoning streaming>
        <ReasoningTrigger />
        <ReasoningContent>{'thinking out loud'}</ReasoningContent>
      </Reasoning>,
    );
    expect(screen.getByText('Thinking…')).toBeTruthy();
  });

  it('lets ReasoningTrigger children override the computed label', () => {
    render(
      <Reasoning streaming>
        <ReasoningTrigger>Razonando…</ReasoningTrigger>
        <ReasoningContent>{'thinking out loud'}</ReasoningContent>
      </Reasoning>,
    );
    expect(screen.getByText('Razonando…')).toBeTruthy();
    expect(screen.queryByText('Thinking…')).toBeNull();
  });

  it('renders the content markdown when open', () => {
    render(
      <Reasoning defaultOpen>
        <ReasoningTrigger />
        <ReasoningContent>{'**bold** thought'}</ReasoningContent>
      </Reasoning>,
    );
    expect(screen.getByText('bold').tagName).toBe('STRONG');
  });

  it('throws when a part is used outside <Reasoning>', () => {
    expect(() => render(<ReasoningTrigger />)).toThrow(/must be used within <Reasoning>/);
  });
});
