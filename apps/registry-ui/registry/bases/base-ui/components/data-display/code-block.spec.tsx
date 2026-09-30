import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

// Highlighting is async + pulls the heavy Shiki highlighter; stub it so the
// component's rendering logic is tested deterministically. The default resolves
// `null` (degrade to plain text); individual cases override with real tokens.
vi.mock('../../lib/shiki', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../lib/shiki')>();
  return { ...actual, highlightToLines: vi.fn().mockResolvedValue(null) };
});

import { CodeBlock, CodeBlockCopy, CodeBlockLanguage } from './code-block';
import {
  CollapsibleCardActions,
  CollapsibleCardHeader,
  CollapsibleCardTitle,
  CollapsibleCardTrigger,
} from '../layout/collapsible-card';
import { highlightToLines } from '../../lib/shiki';

// Base UI ScrollArea measures its viewport in a `queueMicrotask` its layout
// effect schedules on mount and on each hidden-state change, outside of
// `render`'s own act() batch — awaiting a no-op act() settles it before the
// test's assertions run.
async function settle(): Promise<void> {
  await act(async () => {});
}

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
  it('renders the code string', async () => {
    render(<CodeBlock code={'{ "a": 1 }'} />);
    await settle();
    expect(screen.getByText('{ "a": 1 }')).toBeTruthy();
  });

  it('stamps the language as data-language', async () => {
    const { container } = render(<CodeBlock code="x" language="json" />);
    await settle();
    expect(container.querySelector('[data-language="json"]')).toBeTruthy();
  });

  it('renders no header of its own, whatever the language', async () => {
    const { container } = render(<CodeBlock code="const x = 1" language="ts" />);
    await settle();
    expect(container.querySelector('[data-slot="collapsible-card-header"]')).toBeNull();
    expect(screen.queryByText('TypeScript')).toBeNull();
    expect(screen.getByRole('button', { name: 'Copy code' })).toBeTruthy();
  });

  it('takes a composed header in place of the floating copy', async () => {
    const { container } = render(
      <CodeBlock code="const x = 1" language="ts">
        <CollapsibleCardHeader>
          <CollapsibleCardTitle>
            <CodeBlockLanguage />
          </CollapsibleCardTitle>
          <CollapsibleCardActions>
            <CodeBlockCopy />
            <CollapsibleCardTrigger />
          </CollapsibleCardActions>
        </CollapsibleCardHeader>
      </CodeBlock>,
    );
    await settle();
    expect(container.querySelector('[data-slot="code-block-language"]')?.textContent).toBe('TypeScript');
    expect(screen.getAllByRole('button', { name: 'Copy code' })).toHaveLength(1);
    expect(container.querySelector('[data-slot="code-block-copy"]')).toBeTruthy();
  });

  it('collapses the code from a composed trigger', async () => {
    render(
      <CodeBlock code="const x = 1" language="ts">
        <CollapsibleCardHeader>
          <CollapsibleCardTrigger />
        </CollapsibleCardHeader>
      </CodeBlock>,
    );
    await settle();
    fireEvent.click(screen.getByRole('button', { name: 'Toggle' }));
    expect(screen.queryByText('const x = 1')).toBeNull();
  });

  it('copies the root code from CodeBlockCopy', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });

    render(
      <CodeBlock code="payload" language="json">
        <CodeBlockCopy label="Copy payload" />
      </CodeBlock>,
    );
    await settle();
    fireEvent.click(screen.getByRole('button', { name: 'Copy payload' }));

    expect(writeText).toHaveBeenCalledWith('payload');
    await screen.findByRole('button', { name: 'Copied' });
  });

  it('labels a plain block as plain text', async () => {
    render(
      <CodeBlock code="hello">
        <CodeBlockLanguage />
      </CodeBlock>,
    );
    await settle();
    expect(screen.getByText('Plain text')).toBeTruthy();
  });

  it('paints highlighted token spans when the highlighter resolves lines', async () => {
    // jsdom's CSS parser drops `var()` colors, so assert with a parseable value;
    // the real `var(--shiki-token-*)` palette is covered by the lib spec.
    vi.mocked(highlightToLines).mockResolvedValueOnce([
      [{ content: 'const', style: { color: 'rgb(1, 2, 3)' } }, { content: ' x' }],
    ]);
    render(<CodeBlock code="const x" language="ts" />);

    const keyword = await screen.findByText('const');
    expect(keyword.tagName).toBe('SPAN');
    expect(keyword.style.color).toBe('rgb(1, 2, 3)');
  });

  it('paints lines it is given, and highlights nothing itself', async () => {
    vi.mocked(highlightToLines).mockClear();
    render(
      <CodeBlock
        code="const x"
        language="ts"
        lines={[[{ content: 'const', style: { color: 'rgb(4, 5, 6)' } }, { content: ' x' }]]}
      />,
    );
    await settle();

    const keyword = screen.getByText('const');
    expect(keyword.tagName).toBe('SPAN');
    expect(keyword.style.color).toBe('rgb(4, 5, 6)');
    expect(highlightToLines).not.toHaveBeenCalled();
  });

  it('shows the code plain when handed null lines', async () => {
    vi.mocked(highlightToLines).mockClear();
    const { container } = render(<CodeBlock code="const x" language="ts" lines={null} />);
    await settle();

    expect(container.querySelector('[data-slot="highlighted-code"]')?.textContent).toBe('const x');
    expect(container.querySelector('[data-slot="highlighted-code"] span')).toBeNull();
    expect(highlightToLines).not.toHaveBeenCalled();
  });

  it('marks its scroller viewport for a container to cap', async () => {
    const { container } = render(<CodeBlock code="x" />);
    await settle();

    expect(container.querySelector('[data-slot="code-block-viewport"] pre')).toBeTruthy();
  });

  it('copies the code and flips the label to Copied', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });

    render(<CodeBlock code="payload" />);
    await settle();
    fireEvent.click(screen.getByRole('button', { name: 'Copy code' }));

    expect(writeText).toHaveBeenCalledWith('payload');
    await waitFor(() => expect(screen.getByRole('button', { name: 'Copied' })).toBeTruthy());
  });

  it('no-ops when the clipboard API is unavailable', async () => {
    Object.assign(navigator, { clipboard: undefined });
    render(<CodeBlock code="payload" />);
    await settle();
    // Clicking must not throw, and the label stays "Copy code".
    fireEvent.click(screen.getByRole('button', { name: 'Copy code' }));
    expect(screen.getByRole('button', { name: 'Copy code' })).toBeTruthy();
  });
});
