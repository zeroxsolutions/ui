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
        <CommandInput placeholder="Jump to file..." />
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

  it('runs an item onSelect as well as reporting the value', () => {
    const onValueChange = vi.fn();
    const onSelect = vi.fn();
    render(
      <CommandMenu open onValueChange={onValueChange}>
        <CommandList>
          <CommandMenuItem value="SKILL.md" onSelect={onSelect}>
            SKILL.md
          </CommandMenuItem>
        </CommandList>
      </CommandMenu>,
    );

    fireEvent.click(screen.getByText('SKILL.md'));
    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onValueChange).toHaveBeenCalledWith('SKILL.md');
  });

  it('marks the palette and its items with their slots', () => {
    render(
      <CommandMenu open>
        <CommandList>
          <CommandMenuItem value="SKILL.md">SKILL.md</CommandMenuItem>
        </CommandList>
      </CommandMenu>,
    );

    expect(document.querySelector('[data-slot="command-menu"]')).toBeTruthy();
    expect(screen.getByText('SKILL.md').closest('[data-slot="command-menu-item"]')).toBeTruthy();
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

  it('leaves the key to a focused field when asked, and fires elsewhere', () => {
    const onTrigger = vi.fn();
    renderHook(() => useCommandShortcut({ key: '/', mod: false, ignoreEditable: true, onTrigger }));
    const input = document.createElement('input');
    document.body.append(input);

    fireEvent.keyDown(input, { key: '/' });
    expect(onTrigger).not.toHaveBeenCalled();

    fireEvent.keyDown(document.body, { key: '/' });
    expect(onTrigger).toHaveBeenCalledTimes(1);
    input.remove();
  });
});
