import { render } from 'vitest-browser-react';
import { page, userEvent } from 'vitest/browser';
import { describe, expect, it, vi } from 'vitest';

import { CodeEditor, CodeEditorContent, useCodeEditor } from './code-editor';
import type { RoutedFile } from './file-content-router';

const FILES: RoutedFile[] = [
  { path: 'README.md', view: 'markdown', text: '# Readme' },
  { path: 'GUIDE.md', view: 'markdown', text: '# Guide' },
];

/** A control a host draws inside the editor that opens the guide through the editor's context. */
function OpenGuide() {
  const { setActivePath } = useCodeEditor();
  return (
    <button type="button" onClick={() => setActivePath('GUIDE.md')}>
      open guide
    </button>
  );
}

describe('CodeEditor', () => {
  it('shows the file a control inside it opens, when it holds its own active file', async () => {
    await render(
      <CodeEditor files={FILES} defaultValue="README.md">
        <OpenGuide />
        <CodeEditorContent />
      </CodeEditor>,
    );
    await expect.element(page.getByRole('heading', { name: 'Readme' })).toBeVisible();
    await userEvent.click(page.getByRole('button', { name: 'open guide' }));
    await expect.element(page.getByRole('heading', { name: 'Guide' })).toBeVisible();
  });

  it('reports the file a control opens to a host that holds the active file', async () => {
    const onValueChange = vi.fn();
    await render(
      <CodeEditor files={FILES} value="README.md" onValueChange={onValueChange}>
        <OpenGuide />
        <CodeEditorContent />
      </CodeEditor>,
    );
    await userEvent.click(page.getByRole('button', { name: 'open guide' }));
    expect(onValueChange).toHaveBeenCalledWith('GUIDE.md');
    await expect.element(page.getByRole('heading', { name: 'Readme' })).toBeVisible();
  });
});
