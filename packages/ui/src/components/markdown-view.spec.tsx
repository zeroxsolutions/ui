import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { MarkdownView } from './markdown-view';

afterEach(() => {
  cleanup();
});

describe('MarkdownView', () => {
  it('renders headings, strong emphasis, and links', () => {
    render(
      <MarkdownView>
        {'# Title\n\nHello **world** and [link](https://x.test)'}
      </MarkdownView>,
    );
    expect(
      screen.getByRole('heading', { level: 1, name: 'Title' }),
    ).toBeTruthy();
    expect(screen.getByText('world').tagName).toBe('STRONG');
    expect(
      screen.getByRole('link', { name: 'link' }).getAttribute('href'),
    ).toBe('https://x.test');
  });

  it('renders GFM tables', () => {
    render(<MarkdownView>{'| A | B |\n| - | - |\n| 1 | 2 |'}</MarkdownView>);
    expect(screen.getByRole('table')).toBeTruthy();
    expect(
      screen.getAllByRole('columnheader').map((cell) => cell.textContent),
    ).toEqual(['A', 'B']);
  });

  it('does not render raw embedded HTML as markup (safe for untrusted content)', () => {
    const { container } = render(
      <MarkdownView>{'<script>alert(1)</script>\n\nsafe'}</MarkdownView>,
    );
    expect(container.querySelector('script')).toBeNull();
    expect(screen.getByText('safe')).toBeTruthy();
  });
});
