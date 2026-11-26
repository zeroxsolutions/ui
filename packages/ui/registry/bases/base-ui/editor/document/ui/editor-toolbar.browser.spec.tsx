import { useState, type ReactNode } from 'react';
import { describe, expect, it, onTestFinished, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { cdp, page, userEvent } from 'vitest/browser';
import type { DocJSON, IEditor, ToolbarItem } from '@zeroxsolutions/editor-core/document/core/index';
import { collectUiContributions } from '@zeroxsolutions/editor-core/document/ui/index';
import '../../../../../../test/nova-style.css';
import { standardKit } from '../features/index';
import { Editor } from '../react/editor';
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

/** The Document Editor with its toolbar, as a host draws it. */
function ToolbarHarness({ toolbar = items }: { toolbar?: ToolbarItem[] }): ReactNode {
  const [ready, setReady] = useState<IEditor | null>(null);
  return (
    <div className="style-nova">
      {ready && <EditorToolbar editor={ready} items={toolbar} />}
      <Editor features={[standardKit()]} content={notes} onReady={setReady} />
    </div>
  );
}

const notes: DocJSON = { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Notes' }] }] };

/** Runs as a reader whose system asks for motion, which the icons read as they mount, until the returned undo. */
async function askForMotion(): Promise<() => Promise<void>> {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  // Motion reads the setting from this same query, on the change event the emulation raises.
  const changed = new Promise((done) => reduced.addEventListener('change', done, { once: true }));
  await cdp().send('Emulation.setEmulatedMedia', {
    features: [{ name: 'prefers-reduced-motion', value: 'no-preference' }],
  });
  await changed;
  return async () => {
    await cdp().send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
  };
}

/**
 * Reads what `icon` draws. Motion leaves `transform: none` on a drawing it has animated back to rest,
 * which draws as no transform at all. `atRest` reads the drawing once it stays the same for a few
 * frames, since motion plays out frame by frame.
 */
function readIcon(icon: Element): { drawn: () => string; atRest: () => Promise<string> } {
  const drawn = () => icon.innerHTML.replaceAll(' style="transform: none;"', '');
  const frame = () => new Promise((done) => requestAnimationFrame(done));
  const atRest = () =>
    vi.waitFor(
      async () => {
        const seen = drawn();
        for (let i = 0; i < 5; i++) await frame();
        expect(drawn()).toBe(seen);
        return seen;
      },
      { timeout: 10_000 },
    );
  return { drawn, atRest };
}

describe('EditorToolbar over the Document Editor', () => {
  it('bolds the selection from its Bold control, and presses Bold, not Italic, over bold text', async () => {
    await render(<ToolbarHarness />);
    await userEvent.tripleClick(page.getByText('Notes'));

    await userEvent.click(page.getByRole('button', { name: 'Bold' }));

    await expect.element(page.getByRole('button', { name: 'Bold' })).toHaveAttribute('aria-pressed', 'true');
    await expect.element(page.getByRole('button', { name: 'Italic' })).toHaveAttribute('aria-pressed', 'false');
    await expect.element(page.getByText('Notes')).toHaveProperty('tagName', 'STRONG');
  });

  it('draws an element a feature passes as its icon', async () => {
    const plain: ToolbarItem[] = [
      { id: 'plain', title: 'Plain', icon: <svg role="img" aria-label="Plain mark" />, command: 'focus' },
    ];
    await render(<ToolbarHarness toolbar={plain} />);

    await expect.element(page.getByRole('img', { name: 'Plain mark' })).toBeInTheDocument();
  });

  it("moves a control's icon while the pointer or the focus is on it, and draws it still once both leave", async () => {
    onTestFinished(await askForMotion());
    await render(<ToolbarHarness />);
    const bold = page.getByRole('button', { name: 'Bold' });
    await expect.element(bold).toBeVisible();
    const icon = readIcon(bold.element().querySelector('svg')!.parentElement!);
    // An earlier case leaves the pointer where Bold now draws, so the icon starts out hovered.
    await userEvent.unhover(bold);
    const still = await icon.atRest();

    await userEvent.hover(bold);
    await vi.waitFor(() => expect(icon.drawn()).not.toBe(still));
    await userEvent.unhover(bold);
    // The icon plays its motion out before it is still, frame by frame, which a loaded runner stretches.
    await vi.waitFor(() => expect(icon.drawn()).toBe(still), { timeout: 10_000 });

    await userEvent.click(page.getByText('Notes'));
    await userEvent.tab({ shift: true });
    await expect.element(bold).toHaveFocus();
    await vi.waitFor(() => expect(icon.drawn()).not.toBe(still));
  });
});
