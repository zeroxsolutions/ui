import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeAll, describe, expect, it } from 'vitest';

import {
  ReasoningCollapsible,
  ReasoningCollapsibleContent,
  ReasoningCollapsibleTrigger,
} from './reasoning-collapsible';

beforeAll(() => {
  // ReasoningCollapsibleContent renders MarkdownView (codeBlocks), whose CodeBlock measures
  // via a ResizeObserver and queries Element.getAnimations — absent in jsdom.
  globalThis.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
  Element.prototype.getAnimations ??= () => [];
});

afterEach(cleanup);

describe('ReasoningCollapsible', () => {
  it('shows the streaming label while streaming', () => {
    render(
      <ReasoningCollapsible streaming>
        <ReasoningCollapsibleTrigger />
        <ReasoningCollapsibleContent>{'thinking out loud'}</ReasoningCollapsibleContent>
      </ReasoningCollapsible>,
    );
    expect(screen.getByText('Thinking…')).toBeTruthy();
  });

  it('lets ReasoningCollapsibleTrigger children override the computed label', () => {
    render(
      <ReasoningCollapsible streaming>
        <ReasoningCollapsibleTrigger>Razonando…</ReasoningCollapsibleTrigger>
        <ReasoningCollapsibleContent>{'thinking out loud'}</ReasoningCollapsibleContent>
      </ReasoningCollapsible>,
    );
    expect(screen.getByText('Razonando…')).toBeTruthy();
    expect(screen.queryByText('Thinking…')).toBeNull();
  });

  it('renders the content markdown when open', () => {
    render(
      <ReasoningCollapsible defaultOpen>
        <ReasoningCollapsibleTrigger />
        <ReasoningCollapsibleContent>{'**bold** thought'}</ReasoningCollapsibleContent>
      </ReasoningCollapsible>,
    );
    expect(screen.getByText('bold').tagName).toBe('STRONG');
  });

  it('throws when a part is used outside <ReasoningCollapsible>', () => {
    expect(() => render(<ReasoningCollapsibleTrigger />)).toThrow(/must be used within <ReasoningCollapsible>/);
  });
});
