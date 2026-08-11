import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

// Highlighting is async + pulls the heavy Shiki highlighter; stub it so the
// component's rendering logic is tested deterministically. The default resolves
// `null` (degrade to plain text); individual cases override with real tokens.
vi.mock('../lib/shiki', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../lib/shiki')>();
  return { ...actual, highlightToLines: vi.fn().mockResolvedValue(null) };
});

import { CodeBlock } from './code-block';
import { highlightToLines } from '../lib/shiki';

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

  it('shows a language header with a prettified label for a real language', () => {
    render(<CodeBlock code="const x = 1" language="ts" />);
    expect(screen.getByText('TypeScript')).toBeTruthy();
  });

  it('omits the header for a plain language', () => {
    const { container } = render(<CodeBlock code="hello" language="text" />);
    // No header strip; the body still renders, copy stays the floating button.
    expect(container.querySelector('.border-b')).toBeNull();
    expect(screen.getByText('hello')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Copy code' })).toBeTruthy();
  });

  it('paints highlighted token spans when the highlighter resolves lines', async () => {
    // jsdom's CSS parser drops `var()` colors, so assert with a parseable value;
    // the real `var(--shiki-token-*)` palette is covered by the lib spec.
    vi.mocked(highlightToLines).mockResolvedValueOnce([
      [
        { content: 'const', style: { color: 'rgb(1, 2, 3)' } },
        { content: ' x' },
      ],
    ]);
    render(<CodeBlock code="const x" language="ts" />);

    const keyword = await screen.findByText('const');
    expect(keyword.tagName).toBe('SPAN');
    expect(keyword.style.color).toBe('rgb(1, 2, 3)');
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
