import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { userEvent } from 'vitest/browser';
import type { IEditor } from '@zeroxsolutions/editor-core/document/core/index';
import { referenceToken, type TriggerOption } from '@zeroxsolutions/editor-core/composer/index';

import { TriggerMenu } from './trigger-menu';

type Caret = { top: number; bottom: number; left: number; right: number };

/**
 * An editor with the caret after a bare `@`, so the menu opens on every option. `caretRect` answers each read
 * in turn and then keeps its last answer.
 */
function mentionEditor(...carets: Caret[]): IEditor {
  let read = 0;
  return {
    status: 'ready',
    run: vi.fn(() => true),
    isEditable: () => true,
    isFocused: () => true,
    onChange: () => () => {},
    onSelectionUpdate: () => () => {},
    caretRect: () => carets[Math.min(read++, carets.length - 1)],
    triggerQuery: () => ({ from: 1, to: 2, query: '' }),
    getJSON: () => ({ type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: '@' }] }] }),
    getSelection: () => ({ from: 2, to: 2, empty: true }),
    setSlashDecoration: () => {},
    focus: () => {},
  } as unknown as IEditor;
}

/** More people than the menu's height holds. */
const people: TriggerOption[] = Array.from({ length: 16 }, (_, at) => ({ id: `person-${at}`, label: `Person ${at}` }));

const mention = referenceToken('mention', '@', {
  nodeName: 'mention',
  source: () => people,
  insert: () => {},
  readRef: (attrs) => ({ id: String(attrs.id ?? '') }),
});

describe('TriggerMenu with more options than it holds', () => {
  it('keeps its left edge when its list scrolls after the trigger highlight moved the caret', async () => {
    // The first read comes before the highlight around the `@` is painted; every later read after it.
    const editor = mentionEditor(
      { top: 10, bottom: 30, left: 20, right: 80 },
      { top: 10, bottom: 30, left: 24, right: 84 },
    );
    render(<TriggerMenu editor={editor} token={mention} />);
    const popup = await vi.waitFor(() => {
      const found = document.querySelector('[data-slot=trigger-menu]');
      if (!found?.querySelector('[data-slot=item]')) throw new Error('the menu is not open');
      return found;
    });
    const viewport = popup.querySelector('[data-slot=scroll-area-viewport]')!;
    await vi.waitFor(() => expect(popup.getBoundingClientRect().left).toBeGreaterThan(0));
    const opened = popup.getBoundingClientRect().left;

    await userEvent.keyboard('{ArrowUp}');
    await vi.waitFor(() => expect(viewport.scrollTop).toBeGreaterThan(0));
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));

    expect(popup.getBoundingClientRect().left).toBe(opened);
  });
});
