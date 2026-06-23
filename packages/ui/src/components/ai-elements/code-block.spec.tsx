import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

import { CodeBlock } from './code-block';

beforeAll(() => {
  // Base UI ScrollArea measures its viewport with a ResizeObserver and queries
  // Element.getAnimations — both absent in jsdom.
  globalThis.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
  Element.prototype.getAnimations ??= () => [];
});

afterEach(cleanup);

describe('CodeBlock', () => {
  it('renders the code string', () => {
    render(<CodeBlock code={'{ "a": 1 }'} />);
    expect(screen.getByText('{ "a": 1 }')).toBeTruthy();
  });

  it('stamps the language as data-language', () => {
    const { container } = render(<CodeBlock code="x" language="json" />);
    expect(container.querySelector('[data-language="json"]')).toBeTruthy();
  });

  it('copies the code and flips the label to Copied', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });

    render(<CodeBlock code="payload" />);
    fireEvent.click(screen.getByRole('button', { name: 'Copy code' }));

    expect(writeText).toHaveBeenCalledWith('payload');
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Copied' })).toBeTruthy(),
    );
  });

  it('no-ops when the clipboard API is unavailable', () => {
    Object.assign(navigator, { clipboard: undefined });
    render(<CodeBlock code="payload" />);
    // Clicking must not throw, and the label stays "Copy code".
    fireEvent.click(screen.getByRole('button', { name: 'Copy code' }));
    expect(screen.getByRole('button', { name: 'Copy code' })).toBeTruthy();
  });
});
