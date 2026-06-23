import {
  cleanup,
  fireEvent,
  render,
  renderHook,
  screen,
} from '@testing-library/react';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

import { CommandSwitcher, CommandSwitcherItem } from './command-switcher';
import { CommandInput, CommandList } from './ui/command';
import { useCommandShortcut } from '../hooks/use-command-shortcut';

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

describe('CommandSwitcher', () => {
  it('reports the chosen value and closes on select', () => {
    const onValueChange = vi.fn();
    const onOpenChange = vi.fn();
    render(
      <CommandSwitcher
        open
        onOpenChange={onOpenChange}
        onValueChange={onValueChange}
      >
        <CommandInput placeholder="Jump to file…" />
        <CommandList>
          <CommandSwitcherItem value="SKILL.md">SKILL.md</CommandSwitcherItem>
          <CommandSwitcherItem value="scripts/run.py">
            run.py
          </CommandSwitcherItem>
        </CommandList>
      </CommandSwitcher>,
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
    const { rerender } = renderHook(
      ({ enabled }) => useCommandShortcut({ key: 'k', onTrigger, enabled }),
      { initialProps: { enabled: true } },
    );

    fireEvent.keyDown(document.body, { key: 'k', ctrlKey: true });
    expect(onTrigger).toHaveBeenCalledTimes(1);

    rerender({ enabled: false });
    fireEvent.keyDown(document.body, { key: 'k', ctrlKey: true });
    expect(onTrigger).toHaveBeenCalledTimes(1);
  });
});
