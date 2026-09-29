import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeAll, describe, expect, it } from 'vitest';

import { MarkdownView } from './markdown-view';

beforeAll(() => {
  // The codeBlocks variant renders CodeBlock, which measures via a ResizeObserver
  // and queries Element.getAnimations — both absent in jsdom.
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

  it('renders GFM tables', () => {
    render(<MarkdownView>{'| A | B |\n| - | - |\n| 1 | 2 |'}</MarkdownView>);
    expect(screen.getByRole('table')).toBeTruthy();
    expect(screen.getAllByRole('columnheader').map((cell) => cell.textContent)).toEqual(['A', 'B']);
  });

  it('does not render raw embedded HTML as markup (safe for untrusted content)', () => {
    const { container } = render(<MarkdownView>{'<script>alert(1)</script>\n\nsafe'}</MarkdownView>);
    expect(container.querySelector('script')).toBeNull();
    expect(screen.getByText('safe')).toBeTruthy();
  });

  describe('codeBlocks variant', () => {
    it('renders fenced code as an interactive CodeBlock (copy button)', () => {
      render(<MarkdownView codeBlocks>{'```json\n{ "a": 1 }\n```'}</MarkdownView>);
      expect(screen.getByRole('button', { name: 'Copy code' })).toBeTruthy();
      expect(screen.getByText('{ "a": 1 }')).toBeTruthy();
    });

    it('heads a fenced block that names a language with that language', () => {
      const { container } = render(<MarkdownView codeBlocks>{'```json\n{ "a": 1 }\n```'}</MarkdownView>);
      expect(screen.getByText('JSON')).toBeTruthy();
      expect(container.querySelector('[data-slot="collapsible-card-header"]')).toBeTruthy();
    });

    it('leaves a fenced block with no language headerless', () => {
      const { container } = render(<MarkdownView codeBlocks>{'```\nline one\nline two\n```'}</MarkdownView>);
      expect(container.querySelector('[data-slot="collapsible-card-header"]')).toBeNull();
      expect(screen.getByRole('button', { name: 'Copy code' })).toBeTruthy();
    });

    it('keeps inline code as a plain chip (no copy button)', () => {
      render(<MarkdownView codeBlocks>{'use `npm` here'}</MarkdownView>);
      expect(screen.queryByRole('button', { name: 'Copy code' })).toBeNull();
      expect(screen.getByText('npm').tagName).toBe('CODE');
    });

    it('renders a plain <pre> (no copy button) by default', () => {
      render(<MarkdownView>{'```\nplain\n```'}</MarkdownView>);
      expect(screen.queryByRole('button', { name: 'Copy code' })).toBeNull();
      expect(screen.getByText('plain')).toBeTruthy();
    });
  });
});
