import { render } from 'vitest-browser-react';
import { page, userEvent } from 'vitest/browser';
import { describe, expect, it, vi } from 'vitest';

import { MermaidToolbar } from './toolbar';

const FLOWCHART = 'flowchart TD\n  A[Start] --> B{OK?}';

async function pickTemplate(label: string): Promise<void> {
  await userEvent.click(page.getByRole('combobox', { name: 'Diagram type' }));
  await userEvent.click(page.getByRole('option', { name: label }));
}

describe('MermaidToolbar', () => {
  it('shows the type of the diagram its source holds', async () => {
    await render(<MermaidToolbar source={FLOWCHART} svg="" onPickTemplate={() => {}} />);
    await expect.element(page.getByRole('combobox', { name: 'Diagram type' })).toHaveTextContent('Flowchart');
  });

  it('applies a picked template at once over an empty source', async () => {
    const onPickTemplate = vi.fn();
    await render(<MermaidToolbar source="" svg="" onPickTemplate={onPickTemplate} />);
    await pickTemplate('Sequence');
    expect(onPickTemplate).toHaveBeenCalledWith(expect.stringContaining('sequenceDiagram'));
  });

  it('asks before a picked template replaces a source', async () => {
    const onPickTemplate = vi.fn();
    await render(<MermaidToolbar source={FLOWCHART} svg="" onPickTemplate={onPickTemplate} />);
    await pickTemplate('Sequence');
    await expect.element(page.getByRole('alertdialog')).toBeVisible();
    expect(onPickTemplate).not.toHaveBeenCalled();
    await userEvent.click(page.getByRole('button', { name: 'Replace' }));
    expect(onPickTemplate).toHaveBeenCalledWith(expect.stringContaining('sequenceDiagram'));
  });

  it('offers Export only once the diagram has drawn', async () => {
    const screen = await render(<MermaidToolbar source={FLOWCHART} svg="" onPickTemplate={() => {}} />);
    await expect.element(page.getByRole('button', { name: /export/i })).toBeDisabled();
    await screen.rerender(<MermaidToolbar source={FLOWCHART} svg="<svg></svg>" onPickTemplate={() => {}} />);
    await expect.element(page.getByRole('button', { name: /export/i })).toBeEnabled();
  });
});
