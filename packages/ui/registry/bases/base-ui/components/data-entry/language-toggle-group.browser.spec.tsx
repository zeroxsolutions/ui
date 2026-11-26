import { describe, expect, it, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-react';

import { ToggleGroupItem } from '@/registry/bases/base-ui/ui/toggle-group';

import { LanguageToggleGroup } from './language-toggle-group';

function renderGroup(onValueChange = vi.fn()) {
  return render(
    <LanguageToggleGroup value="en" onValueChange={onValueChange} aria-label="Language">
      <ToggleGroupItem value="en">English</ToggleGroupItem>
      <ToggleGroupItem value="vi">Tiếng Việt</ToggleGroupItem>
    </LanguageToggleGroup>,
  );
}

describe('LanguageToggleGroup', () => {
  it('presses the item carrying the current value', async () => {
    await renderGroup();
    await expect.element(page.getByRole('button', { name: 'English' })).toHaveAttribute('aria-pressed', 'true');
    await expect.element(page.getByRole('button', { name: 'Tiếng Việt' })).toHaveAttribute('aria-pressed', 'false');
  });

  it('reports a newly pressed item as its value string', async () => {
    const onValueChange = vi.fn();
    await renderGroup(onValueChange);
    await userEvent.click(page.getByRole('button', { name: 'Tiếng Việt' }));
    expect(onValueChange).toHaveBeenCalledWith('vi');
  });

  it('does not deselect: pressing the current item reports nothing', async () => {
    const onValueChange = vi.fn();
    await renderGroup(onValueChange);
    await userEvent.click(page.getByRole('button', { name: 'English' }));
    expect(onValueChange).not.toHaveBeenCalled();
    await expect.element(page.getByRole('button', { name: 'English' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('passes the group props through, so its aria-label names the group', async () => {
    await renderGroup();
    await expect.element(page.getByRole('group', { name: 'Language' })).toBeVisible();
  });
});
