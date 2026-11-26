import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-react';
import { page, userEvent } from 'vitest/browser';
import { MATH_TEMPLATES } from '@zeroxsolutions/editor-core/math/core/index';
import '../../../../../../test/nova-style.css';
import { Button } from '@/registry/bases/base-ui/ui/button';
import { MathPalette } from './palette';

describe('MathPalette', () => {
  it('names each template by its whole source in its title', async () => {
    await render(
      <div className="style-nova">
        <MathPalette onInsert={() => {}} trigger={<Button>Symbols</Button>} />
      </div>,
    );
    await userEvent.click(page.getByRole('button', { name: 'Symbols' }));
    await expect.element(page.getByText('Templates')).toBeVisible();

    for (const { latex } of MATH_TEMPLATES) {
      await expect.element(page.getByTitle(latex, { exact: true })).toBeInTheDocument();
    }
  });
});
