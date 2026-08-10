import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

import { MermaidToolbar } from './toolbar.js';

// The switcher (Base UI Combobox) and the confirm dialog (Base UI AlertDialog)
// reach for layout/animation/pointer APIs jsdom does not ship.
beforeAll(() => {
  globalThis.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
  Element.prototype.scrollIntoView = vi.fn();
  Element.prototype.getAnimations ??= () => [];
  Element.prototype.hasPointerCapture ??= () => false;
  Element.prototype.setPointerCapture ??= () => {};
  Element.prototype.releasePointerCapture ??= () => {};
});

afterEach(cleanup);

const FLOWCHART = 'flowchart TD\n  A[Start] --> B{OK?}';

/** Open the type/template Combobox and click a template by its visible label. */
async function pickTemplate(label: string) {
  fireEvent.click(screen.getByRole('combobox', { name: 'Diagram type' }));
  const option = (await screen.findAllByText(label))[0].closest(
    '[data-slot="combobox-item"]',
  );
  expect(option).not.toBeNull();
  fireEvent.click(option!);
}

describe('MermaidToolbar', () => {
  it('shows the active diagram type in the Combobox switcher (not a fire-and-forget menu)', () => {
    render(<MermaidToolbar source={FLOWCHART} svg="" onPickTemplate={() => {}} />);
    const switcher = screen.getByRole('combobox', { name: 'Diagram type' });
    // The switcher DISPLAYS the current type — the whole point over a DropdownMenu.
    expect(switcher.textContent).toContain('Flowchart');
  });

  it('applies a template directly when the source is empty', async () => {
    const onPickTemplate = vi.fn();
    render(<MermaidToolbar source="" svg="" onPickTemplate={onPickTemplate} />);
    await pickTemplate('Sequence');
    expect(onPickTemplate).toHaveBeenCalledWith(
      expect.stringContaining('sequenceDiagram'),
    );
  });

  it('confirms before replacing a non-empty source', async () => {
    const onPickTemplate = vi.fn();
    render(<MermaidToolbar source={FLOWCHART} svg="" onPickTemplate={onPickTemplate} />);
    await pickTemplate('Sequence');
    // Not applied yet — the AlertDialog asks first.
    expect(onPickTemplate).not.toHaveBeenCalled();
    fireEvent.click(await screen.findByRole('button', { name: 'Replace' }));
    expect(onPickTemplate).toHaveBeenCalledWith(
      expect.stringContaining('sequenceDiagram'),
    );
  });

  it('gates Export on a rendered SVG', () => {
    const { rerender } = render(
      <MermaidToolbar source={FLOWCHART} svg="" onPickTemplate={() => {}} />,
    );
    const exportButton = () =>
      screen.getByRole('button', { name: /export/i }) as HTMLButtonElement;
    expect(exportButton().disabled).toBe(true);
    rerender(
      <MermaidToolbar source={FLOWCHART} svg="<svg></svg>" onPickTemplate={() => {}} />,
    );
    expect(exportButton().disabled).toBe(false);
  });
});
