import { render } from 'vitest-browser-react';
import { page, userEvent } from 'vitest/browser';
import { describe, expect, it, vi } from 'vitest';
import type { DocJSON, IEditor } from '@zeroxsolutions/editor-core/document/core/index';
import { mountDocumentEditor } from '../../../../../../../src/test/document-editor';
import { Viewer } from '../../react/viewer';
import { standardKit } from '../standard/index';
import { codeBlock } from './code-block';

const docOf = (language: string, code: string): DocJSON => ({
  type: 'doc',
  content: [{ type: 'codeBlock', attrs: { language, code } }, { type: 'paragraph' }],
});

const attrsOf = (editor: IEditor) => editor.getJSON().content?.[0]?.attrs;

describe('a code block in the Document Editor', () => {
  it('writes what is typed in its pane to its code', async () => {
    const editor = await mountDocumentEditor([standardKit(), codeBlock()], docOf('typescript', 'const a = 1'));
    await userEvent.click(page.getByText('const a = 1'));
    await userEvent.keyboard('{End};');
    await vi.waitFor(() => expect(attrsOf(editor)?.code).toBe('const a = 1;'));
  });

  it('writes the language picked from its picker to its language', async () => {
    const editor = await mountDocumentEditor([standardKit(), codeBlock()], docOf('text', 'x'));
    await userEvent.click(page.getByRole('combobox', { name: 'Language' }));
    await userEvent.click(page.getByRole('option', { name: 'Python' }));
    await vi.waitFor(() => expect(attrsOf(editor)?.language).toBe('python'));
  });

  it('draws no language picker when the profile turns it off, and keeps its settings', async () => {
    await mountDocumentEditor([standardKit(), codeBlock({ languagePicker: false })], docOf('text', 'x'));
    await expect.element(page.getByRole('button', { name: 'Code settings' })).toBeVisible();
    expect(page.getByRole('combobox', { name: 'Language' }).query()).toBeNull();
  });

  it('opens its settings menu with the tab size and soft wrap', async () => {
    await mountDocumentEditor([standardKit(), codeBlock()], docOf('typescript', 'x'));
    await userEvent.click(page.getByRole('button', { name: 'Code settings' }));
    await expect.element(page.getByRole('menuitemradio', { name: '4' })).toBeVisible();
    await expect.element(page.getByRole('menuitemcheckbox', { name: 'Soft wrap' })).toBeVisible();
  });

  it('copies its code from its copy button', async () => {
    await mountDocumentEditor([standardKit(), codeBlock()], docOf('typescript', 'payload'));
    await userEvent.click(page.getByRole('button', { name: 'Copy code' }));
    await expect.element(page.getByRole('button', { name: 'Copied' })).toBeVisible();
    await expect.poll(() => navigator.clipboard.readText()).toBe('payload');
  });
});

describe('a code block in the Viewer', () => {
  it('shows its code with nothing to edit it', async () => {
    await render(<Viewer doc={docOf('text', 'hello')} features={[standardKit(), codeBlock()]} />);
    await expect.element(page.getByText('hello')).toBeVisible();
    expect(page.getByRole('textbox').query()).toBeNull();
    expect(page.getByRole('combobox', { name: 'Language' }).query()).toBeNull();
  });
});
