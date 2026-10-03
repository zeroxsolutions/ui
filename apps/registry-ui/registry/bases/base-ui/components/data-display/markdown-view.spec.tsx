import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeAll, describe, expect, it } from 'vitest';

import { MarkdownView } from './markdown-view';

// A fenced block's CodeBlock renders upstream ScrollArea, which measures
// its viewport in a `queueMicrotask` its layout effect schedules on mount,
// outside of `render`'s own act() batch; awaiting a no-op act() settles it
// before the test's assertions run.
async function settle(): Promise<void> {
  await act(async () => {});
}

beforeAll(() => {
  // A fenced block renders CodeBlock, which measures via a ResizeObserver
  // and queries Element.getAnimations, both absent in jsdom.
  globalThis.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
  Element.prototype.getAnimations ??= () => [];
});

afterEach(() => {
  cleanup();
});

describe('MarkdownView', () => {
  it('renders headings, strong emphasis, and links', () => {
    render(<MarkdownView>{'# Title\n\nHello **world** and [link](https://x.test)'}</MarkdownView>);
    expect(screen.getByRole('heading', { level: 1, name: 'Title' })).toBeTruthy();
    expect(screen.getByText('world').tagName).toBe('STRONG');
    expect(screen.getByRole('link', { name: 'link' }).getAttribute('href')).toBe('https://x.test');
  });

  it('renders GFM tables', async () => {
    render(<MarkdownView>{'| A | B |\n| - | - |\n| 1 | 2 |'}</MarkdownView>);
    await settle();
    expect(screen.getByRole('table')).toBeTruthy();
    expect(screen.getAllByRole('columnheader').map((cell) => cell.textContent)).toEqual(['A', 'B']);
  });

  it('does not render raw embedded HTML as markup (safe for untrusted content)', () => {
    const { container } = render(<MarkdownView>{'<script>alert(1)</script>\n\nsafe'}</MarkdownView>);
    expect(container.querySelector('script')).toBeNull();
    expect(screen.getByText('safe')).toBeTruthy();
  });

  describe('fenced code', () => {
    it('renders fenced code as an interactive CodeBlock (copy button)', async () => {
      render(<MarkdownView>{'```json\n{ "a": 1 }\n```'}</MarkdownView>);
      await settle();
      expect(screen.getByRole('button', { name: 'Copy code' })).toBeTruthy();
      expect(screen.getByText('{ "a": 1 }')).toBeTruthy();
    });

    it('heads a fenced block that names a language with that language', async () => {
      render(<MarkdownView>{'```json\n{ "a": 1 }\n```'}</MarkdownView>);
      await settle();
      expect(screen.getByText('JSON')).toBeTruthy();
    });

    it('leaves a fenced block with no language headerless', async () => {
      render(<MarkdownView>{'```\nline one\nline two\n```'}</MarkdownView>);
      await settle();
      expect(screen.queryByText('Plain text')).toBeNull();
      expect(screen.getByRole('button', { name: 'Copy code' })).toBeTruthy();
    });

    it('keeps inline code as a plain chip (no copy button)', () => {
      render(<MarkdownView>{'use `npm` here'}</MarkdownView>);
      expect(screen.queryByRole('button', { name: 'Copy code' })).toBeNull();
      expect(screen.getByText('npm').tagName).toBe('CODE');
    });
  });

  it('draws each GFM task item as a read-only checkbox in its state', async () => {
    render(<MarkdownView>{'- [x] Ship the parser\n- [ ] Document the API'}</MarkdownView>);
    await settle();
    const [done, open] = screen.getAllByRole('checkbox');
    expect(done.getAttribute('aria-checked')).toBe('true');
    expect(open.getAttribute('aria-checked')).toBe('false');
    expect(open.getAttribute('aria-readonly')).toBe('true');

    fireEvent.click(open);
    expect(open.getAttribute('aria-checked')).toBe('false');
  });

  it('leaves a plain bullet a bullet beside task items', async () => {
    render(<MarkdownView>{'- [x] Ship the parser\n- Plain note'}</MarkdownView>);
    await settle();
    expect(screen.getAllByRole('checkbox')).toHaveLength(1);
    expect(screen.getByText('Plain note').closest('li')?.getAttribute('data-slot')).toBeNull();
  });

  it('names each task checkbox by its own task text', async () => {
    render(<MarkdownView>{'- [x] Ship the parser\n- [ ] Document the API\n- Plain note'}</MarkdownView>);
    await settle();
    expect(screen.getByRole('checkbox', { name: 'Ship the parser' })).toBeTruthy();
    expect(screen.getByRole('checkbox', { name: 'Document the API' })).toBeTruthy();
  });
});
