import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-react';
import { page, userEvent } from 'vitest/browser';
import { MATH_TEMPLATES } from '@zeroxsolutions/editor-core/math/core/templates';
import '../../../../../../test/nova-style.css';
import { Button } from '@/registry/bases/base-ui/ui/button';
import { MathPalette } from './palette';

describe('MathPalette', () => {
  // A long template (a matrix, a cases block) wrapped onto a second line beside its name, so a row read
  // as two entries; each row keeps one line, and the source it cuts short is still read in full.
  it('keeps every entry on one line, its whole source in its title', async () => {
    await render(
      <div className="style-nova">
        <MathPalette onInsert={() => {}} trigger={<Button>Symbols</Button>} />
      </div>,
    );
    await userEvent.click(page.getByRole('button', { name: 'Symbols' }));
    await expect.element(page.getByText('Templates')).toBeVisible();

    const rows = [...document.querySelectorAll('[data-slot=command-item]')];
    expect(rows.length).toBeGreaterThan(MATH_TEMPLATES.length);
    const wrapped = rows
      .map((row) => {
        const shortcut = row.querySelector('[data-slot=command-shortcut]') as HTMLElement | null;
        const line = shortcut ? parseFloat(getComputedStyle(shortcut).lineHeight) : 0;
        return { text: row.textContent, shortcut, line };
      })
      .filter(({ shortcut, line }) => shortcut && shortcut.getBoundingClientRect().height > line * 1.5)
      .map(({ text }) => text);
    expect(wrapped).toEqual([]);

    for (const { latex } of MATH_TEMPLATES) {
      expect(document.querySelector(`[data-slot=command-shortcut][title="${CSS.escape(latex)}"]`)).not.toBeNull();
    }
  });
});
