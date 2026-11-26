import { render } from 'vitest-browser-react';
import { page, userEvent } from 'vitest/browser';
import { describe, expect, it, vi } from 'vitest';
import type { DocJSON, IEditor } from '@zeroxsolutions/editor-core/document/core/index';
import { mountDocumentEditor } from '../../../../../../../src/test/document-editor';
import { Viewer } from '../../react/viewer';
import { standardKit } from '../standard/index';
import { mermaid } from './mermaid';

const features = [standardKit(), mermaid()];
const docOf = (source: string): DocJSON => ({
  type: 'doc',
  content: [{ type: 'mermaid', attrs: { source } }, { type: 'paragraph' }],
});
const sourceOf = (editor: IEditor) => editor.getJSON().content?.[0]?.attrs?.source;
/** The source pane on the block's Edit tab; the document around it is a textbox too. */
const sourcePane = () => page.getByTestId('code-mirror-pane').getByRole('textbox');
const FLOWCHART = 'graph TD;\n  Start-->Finish;';

describe('a mermaid block in the Document Editor', () => {
  it('shows an existing diagram as a picture under its type, and its source on the Edit tab', async () => {
    await mountDocumentEditor(features, docOf(FLOWCHART));
    await expect.element(page.getByText('Flowchart')).toBeVisible();
    await expect.element(page.getByRole('toolbar', { name: 'Zoom controls' })).toBeVisible();
    await expect.element(page.getByText('Finish')).toBeInTheDocument();
    expect(sourcePane().query()).toBeNull();
    await userEvent.click(page.getByRole('tab', { name: 'Edit' }));
    await expect.element(sourcePane()).toHaveTextContent('Start-->Finish');
  });

  it('opens an empty block on its source, and writes what is typed there to its source', async () => {
    const editor = await mountDocumentEditor(features, docOf(''));
    await userEvent.click(sourcePane());
    await userEvent.keyboard('graph LR');
    await vi.waitFor(() => expect(sourceOf(editor)).toBe('graph LR'));
  });

  it('copies its source from its copy button', async () => {
    await mountDocumentEditor(features, docOf(FLOWCHART));
    await userEvent.click(page.getByRole('button', { name: 'Copy source' }));
    await expect.element(page.getByRole('button', { name: 'Copied' })).toBeVisible();
    await expect.poll(() => navigator.clipboard.readText()).toBe(FLOWCHART);
  });
});

describe('a mermaid block in the Viewer', () => {
  it('shows its source, with nothing to edit it', async () => {
    await render(<Viewer doc={docOf(FLOWCHART)} features={features} />);
    await expect.element(page.getByTestId('code-card')).toHaveTextContent('Start-->Finish');
    expect(page.getByRole('tab', { name: 'Edit' }).query()).toBeNull();
    expect(page.getByRole('textbox').query()).toBeNull();
  });
});
