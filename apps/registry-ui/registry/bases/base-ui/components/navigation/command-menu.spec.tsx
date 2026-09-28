import { cleanup, fireEvent, render, renderHook, screen } from '@testing-library/react';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

import { CommandMenu, CommandMenuItem } from './command-menu';
import { CommandInput, CommandList } from '@/registry/bases/base-ui/ui/command';
import { useCommandShortcut } from '../../hooks/use-command-shortcut';

beforeAll(() => {
  Element.prototype.scrollIntoView = vi.fn();
  // Base UI's dialog positioning needs ResizeObserver, absent in jsdom.
  globalThis.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
});

afterEach(() => {
  cleanup();
});

describe('CommandMenu', () => {
  it('reports the chosen value and closes on select', () => {
    const onValueChange = vi.fn();
    const onOpenChange = vi.fn();
    render(
      <CommandMenu open onOpenChange={onOpenChange} onValueChange={onValueChange}>
        <CommandInput placeholder="Jump to file…" />
        <CommandList>
          <CommandMenuItem value="SKILL.md">SKILL.md</CommandMenuItem>
          <CommandMenuItem value="scripts/run.py">run.py</CommandMenuItem>
        </CommandList>
      </CommandMenu>,
    );

    fireEvent.click(screen.getByText('run.py'));
    expect(onValueChange).toHaveBeenCalledWith('scripts/run.py');
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});

describe('useCommandShortcut', () => {
  it('fires on the mod+key chord, not on the bare key', () => {
    const onTrigger = vi.fn();
    renderHook(() => useCommandShortcut({ key: 'k', onTrigger }));

    fireEvent.keyDown(document.body, { key: 'k' });
    expect(onTrigger).not.toHaveBeenCalled();

    fireEvent.keyDown(document.body, { key: 'k', metaKey: true });
    expect(onTrigger).toHaveBeenCalledTimes(1);
  });

  it('stops firing once disabled', () => {
    const onTrigger = vi.fn();
    const { rerender } = renderHook(({ enabled }) => useCommandShortcut({ key: 'k', onTrigger, enabled }), {
      initialProps: { enabled: true },
    });

    fireEvent.keyDown(document.body, { key: 'k', ctrlKey: true });
    expect(onTrigger).toHaveBeenCalledTimes(1);

    rerender({ enabled: false });
    fireEvent.keyDown(document.body, { key: 'k', ctrlKey: true });
    expect(onTrigger).toHaveBeenCalledTimes(1);
  });
});
