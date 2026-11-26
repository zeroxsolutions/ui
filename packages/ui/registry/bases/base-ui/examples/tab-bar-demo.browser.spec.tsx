import { describe, expect, it } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-react';

import { TabBarDemo } from './tab-bar-demo';

describe('TabBarDemo', () => {
  it('moves the current page to the destination clicked', async () => {
    await render(<TabBarDemo />);
    const bar = page.getByRole('navigation', { name: 'Main' });
    const home = bar.getByRole('link', { name: 'Home' });
    const search = bar.getByRole('link', { name: 'Search' });
    await expect.element(home).toHaveAttribute('aria-current', 'page');

    await userEvent.click(search);

    await expect.element(search).toHaveAttribute('aria-current', 'page');
    await expect.element(home).not.toHaveAttribute('aria-current');
  });
});
