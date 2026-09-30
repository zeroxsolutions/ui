import { cleanup, render, screen } from '@testing-library/react';
import type { Root } from 'fumadocs-core/page-tree';
import { afterEach, describe, expect, it } from 'vitest';

import { DocsPager } from './docs-pager';

const tree: Root = {
  name: 'Docs',
  children: [
    { type: 'page', name: 'Introduction', url: '/docs' },
    { type: 'page', name: 'Installation', url: '/docs/installation' },
    {
      type: 'folder',
      name: 'Components',
      children: [{ type: 'page', name: 'Button', url: '/docs/components/button' }],
    },
  ],
};

afterEach(cleanup);

describe('DocsPager', () => {
  it('links back to the page before and on to the page after, across a folder', () => {
    render(<DocsPager tree={tree} url="/docs/installation" />);

    expect(screen.getByRole('link', { name: 'Previous: Introduction' }).getAttribute('href')).toBe('/docs');
    expect(screen.getByRole('link', { name: 'Next: Button' }).getAttribute('href')).toBe('/docs/components/button');
  });

  it('links only forward from the first page, and only back from the last', () => {
    const { rerender } = render(<DocsPager tree={tree} url="/docs" />);

    expect(screen.queryByRole('link', { name: /^Previous/ })).toBeNull();
    expect(screen.getByRole('link', { name: 'Next: Installation' }).getAttribute('href')).toBe('/docs/installation');

    rerender(<DocsPager tree={tree} url="/docs/components/button" />);

    expect(screen.getByRole('link', { name: 'Previous: Installation' }).getAttribute('href')).toBe(
      '/docs/installation',
    );
    expect(screen.queryByRole('link', { name: /^Next/ })).toBeNull();
  });
});
