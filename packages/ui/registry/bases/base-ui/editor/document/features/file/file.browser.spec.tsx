import { afterEach, describe, expect, it, vi } from 'vitest';
import type { DocJSON, IEditor } from '@zeroxsolutions/editor-core/document/core/index';
import { page, userEvent } from 'vitest/browser';
import '../../../../../../../test/nova-style.css';
import '../../../styles.css';
import { expectViewerMatches, layoutFrame, storedLayout } from '../../../../../../../test/block-layout';
import { findElement, insertFromSlashMenu, mountDocumentEditor } from '../../../../../../../src/test/document-editor';
import { dropFiles, fileInput, heldUpload, pasteFiles, pngFile } from '../../../../../../../src/test/uploads';
import { image } from '../image/index';
import { standardKit } from '../standard/index';
import { file } from './file';

describe('the file block in the Document Editor', () => {
  it('is inserted from the slash menu and named after the file its link reaches', async () => {
    const editor = await mountDocumentEditor([standardKit(), file()]);

    await insertFromSlashMenu('File');
    await userEvent.click(page.getByRole('textbox', { name: 'File link' }));
    await userEvent.keyboard('https://files.test/docs/trip%20plan.pdf{Enter}');

    expect((await findElement('[data-slot=file-name]')).textContent).toBe('trip plan.pdf');
    expect(editor.getJSON().content?.find((node) => node.type === 'file')?.attrs).toMatchObject({
      href: 'https://files.test/docs/trip%20plan.pdf',
      name: 'trip plan.pdf',
    });
  });
});

describe('the file block with uploads', () => {
  const pdf = (): File => new File([new Uint8Array(1536)], 'plan.pdf', { type: 'application/pdf' });
  const fileOf = (editor: IEditor) => editor.getJSON().content?.find((node) => node.type === 'file');

  it('takes a link only when the host gives no upload', async () => {
    await mountDocumentEditor([standardKit(), file()]);
    await insertFromSlashMenu('File');

    await expect.element(page.getByRole('textbox', { name: 'File link' })).toBeVisible();
    expect(document.querySelector('[data-slot=upload-tabs]')).toBeNull();
  });

  it('uploads a picked file, drawn by its name and size until the address lands with them', async () => {
    const { upload, calls } = heldUpload();
    const editor = await mountDocumentEditor([standardKit(), file({ upload })]);
    await insertFromSlashMenu('File');

    await userEvent.upload(fileInput(), pdf());
    await vi.waitFor(() => expect(calls).toHaveLength(1));

    expect((await findElement('[data-slot=file-upload] [data-slot=file-name]')).textContent).toBe('plan.pdf');
    expect((await findElement('[data-slot=file-upload] [data-slot=file-size]')).textContent).toBe('1.5 KB');
    await expect.element(page.getByRole('progressbar', { name: 'Uploading plan.pdf' })).toBeVisible();
    calls[0].answer('https://files.test/u/7/plan.pdf');

    await vi.waitFor(() =>
      expect(fileOf(editor)?.attrs).toMatchObject({
        href: 'https://files.test/u/7/plan.pdf',
        name: 'plan.pdf',
        size: 1536,
      }),
    );
  });

  it('makes a pasted file a file block, and a pasted image an image block where the image uploads', async () => {
    const { upload, calls } = heldUpload();
    const editor = await mountDocumentEditor([standardKit(), file({ upload }), image({ upload })]);
    await userEvent.click(await findElement('.ProseMirror p'));

    pasteFiles(await findElement('.ProseMirror'), [pdf(), pngFile()]);

    await vi.waitFor(() => expect(calls.map((call) => call.file.name)).toEqual(['plan.pdf', 'cat.png']));
    expect(editor.getJSON().content?.map((node) => node.type)).toEqual(expect.arrayContaining(['file', 'image']));
    expect(JSON.stringify(editor.getJSON())).not.toMatch(/blob:/);
  });

  it('makes a dropped file a file block', async () => {
    const { upload, calls } = heldUpload();
    const editor = await mountDocumentEditor([standardKit(), file({ upload })], {
      type: 'doc',
      content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Notes' }] }],
    });

    dropFiles(await findElement('.ProseMirror p', 'Notes'), [pdf()]);

    await vi.waitFor(() => expect(calls).toHaveLength(1));
    expect(fileOf(editor)).toBeDefined();
  });
});

describe('the file block layout', () => {
  const features = [standardKit(), file()];
  const laidOut = (layout: Record<string, unknown>): DocJSON => ({
    type: 'doc',
    content: [
      { type: 'paragraph', content: [{ type: 'text', text: 'Trip' }] },
      { type: 'file', attrs: { href: 'https://cdn.test/menu.pdf', name: 'menu.pdf', ...layout } },
      // A block the document ends on would take a trailing line on the first press, under the press.
      { type: 'paragraph', content: [{ type: 'text', text: 'After' }] },
    ],
  });

  afterEach(async () => {
    await page.viewport(414, 896);
  });

  it('align sets data-align in the Editor and the Viewer', async () => {
    await page.viewport(900, 700);
    const editor = await mountDocumentEditor(features, laidOut({}));
    await userEvent.click(layoutFrame(), { position: { x: 4, y: 4 } });
    await expect.element(page.getByRole('toolbar', { name: 'Block layout' })).toBeVisible();

    await userEvent.click(page.getByRole('button', { name: 'Align center' }));

    await vi.waitFor(() => expect(storedLayout(editor, 1).align).toBe('center'));
    const drawn = layoutFrame().getBoundingClientRect();
    const line = (layoutFrame().parentElement as HTMLElement).getBoundingClientRect();
    expect(Math.abs(drawn.left - line.left - (line.right - drawn.right))).toBeLessThan(2);
    await expectViewerMatches(editor, features);
  });

  it('no resize handle and no full width toggle is drawn', async () => {
    await mountDocumentEditor(features, laidOut({}));
    await userEvent.click(layoutFrame(), { position: { x: 4, y: 4 } });
    await expect.element(page.getByRole('toolbar', { name: 'Block layout' })).toBeVisible();

    expect(document.querySelector('[data-slot=resize-handle]')).toBeNull();
    expect(document.querySelector('[data-slot=block-toolbar] [aria-label="Full width"]')).toBeNull();
  });
});
