import { describe, expect, it, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import type { DocJSON } from '@zeroxsolutions/editor-core/document/core/index';
import '../../../../../../../test/nova-style.css';
import '../../../styles.css';
import { findElement, insertFromSlashMenu, mountDocumentEditor } from '../../../../../../../src/test/document-editor';
import { standardKit } from '../standard/index';
import { toggleHeading } from '../toggle-heading/index';
import { tableOfContents } from './table-of-contents';

const content: DocJSON = {
  type: 'doc',
  content: [
    { type: 'paragraph' },
    {
      type: 'toggleHeading',
      attrs: { open: true },
      content: [{ type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Day one' }] }],
    },
    { type: 'heading', attrs: { level: 3 }, content: [{ type: 'text', text: 'Night' }] },
  ],
};

describe('the table of contents in the Document Editor', () => {
  it('is inserted from the slash menu, follows the headings as they change and scrolls to one', async () => {
    const editor = await mountDocumentEditor([standardKit(), toggleHeading(), tableOfContents()], content);

    await userEvent.click(await findElement('.ProseMirror > p'));
    await userEvent.keyboard('/');
    await userEvent.click(await findElement('[data-slot=slash-menu] [data-slot=item]', 'Table of contents'));

    const nav = await findElement('nav[data-slot=table-of-contents]');
    expect([...nav.querySelectorAll('a')].map((link) => link.textContent)).toEqual(['Day one', 'Night']);

    await userEvent.click(await findElement('.ProseMirror h3', 'Night'));
    await userEvent.keyboard('{End} falls');
    await vi.waitFor(() =>
      expect([...nav.querySelectorAll('a')].map((link) => link.textContent)).toEqual(['Day one', 'Night falls']),
    );

    const night = await findElement('.ProseMirror h3', 'Night falls');
    const scrolled = vi.spyOn(night, 'scrollIntoView');
    await userEvent.click(page.getByRole('link', { name: 'Night falls' }));
    expect(scrolled).toHaveBeenCalledTimes(1);
    expect(editor.getJSON().content?.filter((node) => node.type === 'tableOfContents')).toHaveLength(1);
  });

  it('asks for a heading while the document has none', async () => {
    await mountDocumentEditor([standardKit(), tableOfContents()]);
    await insertFromSlashMenu('Table of contents');
    expect((await findElement('[data-slot=table-of-contents]')).textContent).toBe(
      'Add a heading and it is listed here.',
    );
  });
});
