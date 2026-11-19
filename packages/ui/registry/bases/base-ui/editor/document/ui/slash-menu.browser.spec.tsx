import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { userEvent } from 'vitest/browser';
import type { IEditor, SlashItem } from '@zeroxsolutions/editor-core/document/core/index';

import { SlashMenu } from './slash-menu';

/** An editor with the caret after a bare `/`, so the menu opens on every item. */
function slashEditor(): IEditor {
  return {
    status: 'ready',
    run: vi.fn(() => true),
    isEditable: () => true,
    isFocused: () => true,
    onChange: () => () => {},
    onSelectionUpdate: () => () => {},
    caretRect: () => ({ top: 10, bottom: 30, left: 20, right: 80 }),
    triggerQuery: () => ({ from: 1, to: 2, query: '' }),
    setSlashDecoration: () => {},
    focus: () => {},
  } as unknown as IEditor;
}

/** More items than the menu's height holds. */
const items: SlashItem[] = Array.from({ length: 16 }, (_, at) => ({
  id: `item-${at}`,
  title: `Item ${at}`,
  description: 'A block',
  group: 'Basic',
  command: 'insert',
}));

function box(element: Element): { top: number; bottom: number } {
  const { top, bottom } = element.getBoundingClientRect();
  return { top, bottom };
}

describe('SlashMenu with more items than it holds', () => {
  it('scrolls its list inside the popup instead of spilling past it', async () => {
    render(<SlashMenu editor={slashEditor()} items={items} />);
    const popup = await vi.waitFor(() => {
      const found = document.querySelector('[data-slot=slash-menu]');
      if (!found) throw new Error('the menu is not open');
      return found;
    });
    const viewport = popup.querySelector('[data-slot=scroll-area-viewport]')!;

    expect(viewport.scrollHeight).toBeGreaterThan(viewport.clientHeight);
    expect(box(viewport).bottom).toBeLessThanOrEqual(box(popup).bottom + 1);
  });

  it('keeps the option the keys move to in view', async () => {
    render(<SlashMenu editor={slashEditor()} items={items} />);
    const popup = await vi.waitFor(() => {
      const found = document.querySelector('[data-slot=slash-menu]');
      if (!found) throw new Error('the menu is not open');
      return found;
    });
    const viewport = popup.querySelector('[data-slot=scroll-area-viewport]')!;

    await userEvent.keyboard('{ArrowUp}');

    const highlighted = popup.querySelector('[data-highlighted]')!;
    expect(highlighted.textContent).toContain('Item 15');
    await vi.waitFor(() => {
      expect(box(highlighted).bottom).toBeLessThanOrEqual(box(viewport).bottom + 1);
      expect(box(highlighted).top).toBeGreaterThanOrEqual(box(viewport).top - 1);
    });
  });

  it('keeps the option the keys move to under a cursor that has not moved', async () => {
    // A cursor left where the popup opens, as an earlier spec or the reader's hand leaves it.
    const rest = document.createElement('div');
    rest.style.cssText = 'position:fixed;left:20px;top:200px;width:288px;height:40px;';
    document.body.append(rest);
    await userEvent.hover(rest);
    rest.remove();
    render(<SlashMenu editor={slashEditor()} items={items} />);
    const popup = await vi.waitFor(() => {
      const found = document.querySelector('[data-slot=slash-menu]');
      if (!found) throw new Error('the menu is not open');
      return found;
    });
    const viewport = popup.querySelector('[data-slot=scroll-area-viewport]')!;

    await userEvent.keyboard('{ArrowUp}');
    // The list scrolls under the cursor, and the browser answers on a later frame.
    await vi.waitFor(() => expect(viewport.scrollTop).toBeGreaterThan(0));
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));

    expect(popup.querySelector('[data-highlighted]')!.textContent).toContain('Item 15');
  });

  it('highlights the option the pointer moves onto', async () => {
    render(<SlashMenu editor={slashEditor()} items={items} />);
    const popup = await vi.waitFor(() => {
      const found = document.querySelector('[data-slot=slash-menu]');
      if (!found) throw new Error('the menu is not open');
      return found;
    });
    const third = Array.from(popup.querySelectorAll('[data-slot=item-title]')).find(
      (title) => title.textContent === 'Item 2',
    )!;

    await userEvent.hover(third);

    await vi.waitFor(() => expect(popup.querySelector('[data-highlighted]')!.textContent).toContain('Item 2'));
  });
});
