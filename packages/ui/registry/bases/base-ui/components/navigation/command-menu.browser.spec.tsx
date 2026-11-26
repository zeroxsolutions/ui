import { useState, type ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-react';

import { CommandInput, CommandList } from '@/registry/bases/base-ui/ui/command';

import { useCommandShortcut, type UseCommandShortcutOptions } from '../../hooks/use-command-shortcut';
import { CommandMenu, CommandMenuItem } from './command-menu';

describe('CommandMenu', () => {
  it('reports the chosen value and closes on select', async () => {
    const onValueChange = vi.fn();
    function Palette(): ReactNode {
      const [open, setOpen] = useState(true);
      return (
        <CommandMenu open={open} onOpenChange={setOpen} onValueChange={onValueChange}>
          <CommandInput placeholder="Jump to file..." />
          <CommandList>
            <CommandMenuItem value="SKILL.md">SKILL.md</CommandMenuItem>
            <CommandMenuItem value="scripts/run.py">run.py</CommandMenuItem>
          </CommandList>
        </CommandMenu>
      );
    }
    await render(<Palette />);

    await userEvent.click(page.getByRole('option', { name: 'run.py' }));

    expect(onValueChange).toHaveBeenCalledWith('scripts/run.py');
    await expect.element(page.getByRole('dialog')).not.toBeInTheDocument();
  });

  it('runs an item onSelect as well as reporting the value', async () => {
    const onValueChange = vi.fn();
    const onSelect = vi.fn();
    await render(
      <CommandMenu open onValueChange={onValueChange}>
        <CommandList>
          <CommandMenuItem value="SKILL.md" onSelect={onSelect}>
            SKILL.md
          </CommandMenuItem>
        </CommandList>
      </CommandMenu>,
    );

    await userEvent.click(page.getByRole('option', { name: 'SKILL.md' }));

    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onValueChange).toHaveBeenCalledWith('SKILL.md');
  });

  it('names its dialog in sentence case', async () => {
    await render(
      <CommandMenu open>
        <CommandList>
          <CommandMenuItem value="SKILL.md">SKILL.md</CommandMenuItem>
        </CommandList>
      </CommandMenu>,
    );

    await expect.element(page.getByRole('dialog', { name: 'Command menu', exact: true })).toBeVisible();
  });

  it('takes the name its consumer gives it', async () => {
    await render(
      <CommandMenu open title="Jump to file">
        <CommandList>
          <CommandMenuItem value="SKILL.md">SKILL.md</CommandMenuItem>
        </CommandList>
      </CommandMenu>,
    );

    await expect.element(page.getByRole('dialog', { name: 'Jump to file' })).toBeVisible();
  });
});

/** A field and a palette the shortcut opens, as a consumer wires the two. */
function ShortcutPalette({
  chord,
  ...shortcut
}: Omit<UseCommandShortcutOptions, 'key' | 'onTrigger'> & { chord: string }): ReactNode {
  const [open, setOpen] = useState(false);
  useCommandShortcut({ ...shortcut, key: chord, onTrigger: () => setOpen(true) });
  return (
    <>
      <input aria-label="Name" />
      <CommandMenu open={open} onOpenChange={setOpen}>
        <CommandList>
          <CommandMenuItem value="SKILL.md">SKILL.md</CommandMenuItem>
        </CommandList>
      </CommandMenu>
    </>
  );
}

describe('useCommandShortcut', () => {
  it('opens on the mod+key chord, not on the bare key', async () => {
    await render(<ShortcutPalette chord="k" />);

    await userEvent.keyboard('k');
    await expect.element(page.getByRole('dialog')).not.toBeInTheDocument();

    await userEvent.keyboard('{Control>}k{/Control}');
    await expect.element(page.getByRole('dialog')).toBeVisible();
  });

  it('opens nothing once disabled', async () => {
    await render(<ShortcutPalette chord="k" enabled={false} />);

    await userEvent.keyboard('{Control>}k{/Control}');

    await expect.element(page.getByRole('dialog')).not.toBeInTheDocument();
  });

  it('leaves the key to a focused field when asked, and opens elsewhere', async () => {
    await render(<ShortcutPalette chord="/" mod={false} ignoreEditable />);
    const field = page.getByRole('textbox', { name: 'Name' });

    await userEvent.type(field, '/');
    await expect.element(field).toHaveValue('/');
    await expect.element(page.getByRole('dialog')).not.toBeInTheDocument();

    (document.activeElement as HTMLElement).blur();
    await userEvent.keyboard('/');
    await expect.element(page.getByRole('dialog')).toBeVisible();
  });
});
