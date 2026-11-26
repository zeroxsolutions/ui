import type { TableOfContents } from 'fumadocs-core/toc';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-react';

import { DocsToc } from './docs-toc';

const toc: TableOfContents = [
  { title: 'Installation', url: '#installation', depth: 2 },
  { title: 'Usage', url: '#usage', depth: 2 },
];

/** A page of two headings `gap` apart, ending `tail` after the second, with its TOC held in view beside them. */
function Page({ gap, tail }: { gap: string; tail: string }): ReactNode {
  return (
    <>
      <div style={{ position: 'fixed', top: 0, right: 0, width: 200 }}>
        <DocsToc toc={toc} />
      </div>
      <div style={{ height: '30vh' }} />
      <h2 id="installation">Installation</h2>
      <div style={{ height: gap }} />
      <h2 id="usage">Usage</h2>
      <div style={{ height: tail }} />
    </>
  );
}

const link = (name: string) => page.getByRole('link', { name });

afterEach(() => {
  window.history.replaceState(null, '', window.location.pathname);
  window.scrollTo(0, 0);
});

describe('DocsToc', () => {
  it('marks the heading in view, and moves the mark as the reader follows a link to another', async () => {
    await render(<Page gap="150vh" tail="150vh" />);

    await expect.element(link('Installation')).toHaveAttribute('aria-current', 'location');
    await expect.element(link('Usage')).not.toHaveAttribute('aria-current');

    await userEvent.click(link('Usage'));

    await expect.element(link('Usage')).toHaveAttribute('aria-current', 'location');
    await expect.element(link('Installation')).not.toHaveAttribute('aria-current');
  });

  it('marks the heading a link landed on, when the page ends before it can reach the top', async () => {
    // Too short to scroll the second heading to the top, so both headings stay in view after the jump.
    await render(<Page gap="40vh" tail="40vh" />);
    await expect.element(link('Installation')).toHaveAttribute('aria-current', 'location');

    await userEvent.click(link('Usage'));

    await expect.element(link('Usage')).toHaveAttribute('aria-current', 'location');
    await expect.element(link('Installation')).not.toHaveAttribute('aria-current');
  });

  it('titles its list of headings On this page', async () => {
    await render(<DocsToc toc={toc} />);

    await expect.element(page.getByText('On this page')).toBeVisible();
    await expect.element(link('Installation')).toBeVisible();
  });

  it('renders nothing for a page without headings', async () => {
    const { container } = await render(<DocsToc toc={[]} />);

    expect(container.childElementCount).toBe(0);
  });
});
