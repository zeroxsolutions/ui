import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

// Highlighting is async + pulls the heavy Shiki highlighter; stub it so the
// component's rendering logic is tested deterministically. The default resolves
// `null` (degrade to plain text); individual cases override with real tokens.
vi.mock('../../lib/shiki', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../lib/shiki')>();
  return { ...actual, highlightToLines: vi.fn().mockResolvedValue(null) };
});

import {
  CodeBlock,
  CodeBlockActions,
  CodeBlockCode,
  CodeBlockContent,
  CodeBlockCopy,
  CodeBlockLanguage,
  CodeBlockLineNumbers,
  type CodeBlockProps,
} from './code-block';
import type { ReactNode } from 'react';

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

/** A block whose content is the code alone, with `children` composed before it. */
function Block({ children, ...props }: Omit<CodeBlockProps, 'children'> & { children?: ReactNode }): ReactNode {
  return (
    <CodeBlock {...props}>
      {children}
      <CodeBlockContent>
        <CodeBlockCode />
      </CodeBlockContent>
    </CodeBlock>
  );
}

describe('CodeBlock', () => {
  it('renders the code string', async () => {
    render(<Block code={'{ "a": 1 }'} />);
    await settle();
    expect(screen.getByText('{ "a": 1 }')).toBeTruthy();
  });

  it('stamps the language as data-language', async () => {
    const { container } = render(<Block code="x" language="json" />);
    await settle();
    expect(container.querySelector('[data-language="json"]')).toBeTruthy();
  });

  it('renders only what is composed: no header and no copy of its own', async () => {
    render(<Block code="const x = 1" language="ts" />);
    await settle();
    expect(screen.queryByText('TypeScript')).toBeNull();
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('shows a composed header above the code', async () => {
    render(
      <Block code="const x = 1" language="ts">
        <CollapsibleCardHeader>
          <CollapsibleCardTitle>
            <CodeBlockLanguage />
          </CollapsibleCardTitle>
          <CollapsibleCardActions>
            <CodeBlockCopy />
            <CollapsibleCardTrigger />
          </CollapsibleCardActions>
        </CollapsibleCardHeader>
      </Block>,
    );
    await settle();
    expect(screen.getByText('TypeScript')).toBeTruthy();
    expect(screen.getAllByRole('button', { name: 'Copy code' })).toHaveLength(1);
  });

  it('collapses the code from a composed trigger', async () => {
    render(
      <Block code="const x = 1" language="ts">
        <CollapsibleCardHeader>
          <CollapsibleCardTrigger />
        </CollapsibleCardHeader>
      </Block>,
    );
    await settle();
    fireEvent.click(screen.getByRole('button', { name: 'Toggle' }));
    expect(screen.queryByText('const x = 1')).toBeNull();
  });

  it('copies the root code from CodeBlockCopy', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });

    render(
      <Block code="payload" language="json">
        <CodeBlockCopy label="Copy payload" />
      </Block>,
    );
    await settle();
    fireEvent.click(screen.getByRole('button', { name: 'Copy payload' }));

    expect(writeText).toHaveBeenCalledWith('payload');
    await screen.findByRole('button', { name: 'Copied' });
  });

  it('labels a plain block as plain text', async () => {
    render(
      <Block code="hello">
        <CodeBlockLanguage />
      </Block>,
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
    render(<Block code="const x" language="ts" />);

    const keyword = await screen.findByText('const');
    expect(keyword.tagName).toBe('SPAN');
    expect(keyword.style.color).toBe('rgb(1, 2, 3)');
  });

  it('paints lines it is given, and highlights nothing itself', async () => {
    vi.mocked(highlightToLines).mockClear();
    render(
      <Block
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
    const { container } = render(<Block code="const x" language="ts" lines={null} />);
    await settle();

    expect(container.querySelector('code')?.textContent).toBe('const x');
    expect(container.querySelector('code span')).toBeNull();
    expect(highlightToLines).not.toHaveBeenCalled();
  });

  it('numbers each line in a gutter hidden from assistive technology, apart from the code', async () => {
    const { container } = render(
      <CodeBlock code={'a\nb\nc'}>
        <CodeBlockContent>
          <CodeBlockLineNumbers />
          <CodeBlockCode />
        </CodeBlockContent>
      </CodeBlock>,
    );
    await settle();

    const pre = container.querySelector('pre');
    expect(pre?.textContent).toBe('1\n2\n3a\nb\nc');
    expect(pre?.querySelector(':scope > [aria-hidden="true"]')?.textContent).toBe('1\n2\n3');
    expect(pre?.querySelector('code')?.textContent).toBe('a\nb\nc');
  });

  it('draws no gutter unless one is composed', async () => {
    const { container } = render(<Block code={'a\nb'} />);
    await settle();

    expect(container.querySelector('pre')?.textContent).toBe('a\nb');
  });

  it('copies the code from a floating action and flips the label to Copied', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });

    render(
      <Block code="payload">
        <CodeBlockActions>
          <CodeBlockCopy variant="secondary" />
        </CodeBlockActions>
      </Block>,
    );
    await settle();
    fireEvent.click(screen.getByRole('button', { name: 'Copy code' }));

    expect(writeText).toHaveBeenCalledWith('payload');
    await waitFor(() => expect(screen.getByRole('button', { name: 'Copied' })).toBeTruthy());
  });

  it('no-ops when the clipboard API is unavailable', async () => {
    Object.assign(navigator, { clipboard: undefined });
    render(
      <Block code="payload">
        <CodeBlockCopy />
      </Block>,
    );
    await settle();
    // Clicking must not throw, and the label stays "Copy code".
    fireEvent.click(screen.getByRole('button', { name: 'Copy code' }));
    expect(screen.getByRole('button', { name: 'Copy code' })).toBeTruthy();
  });

  it('throws when a part sits outside a CodeBlock', () => {
    expect(() => render(<CodeBlockCode />)).toThrow(/inside a CodeBlock/);
  });
});
