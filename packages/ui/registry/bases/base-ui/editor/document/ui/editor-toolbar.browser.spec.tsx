import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-react';
import { page, userEvent } from 'vitest/browser';
import type { IEditor } from '@zeroxsolutions/editor-core/document/core/index';
import { collectUiContributions } from '@zeroxsolutions/editor-core/document/ui/index';
import '../../../../../../test/nova-style.css';
import { standardKit } from '../features/index';
import { EditorToolbar } from './editor-toolbar';

/** An editor with nothing active, whose commands do nothing: the toolbar's keys are under test, not its commands. */
const editor = {
  status: 'ready',
  isActive: () => false,
  run: () => true,
  can: () => true,
  onChange: () => () => {},
  onSelectionUpdate: () => () => {},
} as unknown as IEditor;

const items = collectUiContributions([standardKit()]).toolbar;

async function mount(disabled = false) {
  await render(
    <div className="style-nova">
      <button type="button">Before</button>
      <EditorToolbar
        editor={editor}
        items={items}
        disabled={disabled}
        end={
          <button type="button" disabled={disabled}>
            Pick
          </button>
        }
      />
      <button type="button">After</button>
    </div>,
  );
}

const focused = () => document.activeElement?.getAttribute('aria-label') ?? document.activeElement?.textContent;

describe('EditorToolbar', () => {
  it('is one Tab stop', async () => {
    await mount();
    await userEvent.click(page.getByRole('button', { name: 'Before' }));

    await userEvent.tab();
    expect(focused()).toBe(items[0].title);
    await userEvent.tab();
    expect(focused()).toBe('After');
  });

  it("moves between its controls, the end slot's included, with the arrow keys, Home and End", async () => {
    await mount();
    await userEvent.click(page.getByRole('button', { name: 'Before' }));
    await userEvent.tab();

    await userEvent.keyboard('{ArrowRight}');
    expect(focused()).toBe(items[1].title);
    await userEvent.keyboard('{End}');
    expect(focused()).toBe('Pick');
    await userEvent.keyboard('{ArrowRight}');
    expect(focused()).toBe(items[0].title);
    await userEvent.keyboard('{ArrowLeft}');
    expect(focused()).toBe('Pick');
    await userEvent.keyboard('{Home}');
    expect(focused()).toBe(items[0].title);
  });

  it('leaves a modified arrow, Home or End to the page', async () => {
    await mount();
    await userEvent.click(page.getByRole('button', { name: 'Before' }));
    await userEvent.tab();

    await userEvent.keyboard('{Shift>}{ArrowRight}{/Shift}{Control>}{End}{/Control}{Alt>}{ArrowRight}{/Alt}');
    expect(focused()).toBe(items[0].title);
  });

  it('comes back by Tab to the control focused last', async () => {
    await mount();
    await userEvent.click(page.getByRole('button', { name: 'Before' }));
    await userEvent.tab();
    await userEvent.keyboard('{End}');

    await userEvent.tab();
    await userEvent.tab({ shift: true });
    expect(focused()).toBe('Pick');
  });

  it('disables every item when disabled', async () => {
    await mount(true);

    for (const item of items)
      await expect.element(page.getByRole('button', { name: item.title, exact: true })).toBeDisabled();
  });
});
