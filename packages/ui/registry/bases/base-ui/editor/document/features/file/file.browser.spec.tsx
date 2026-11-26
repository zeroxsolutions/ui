import { afterEach, describe, expect, it, vi } from 'vitest';
import type { DocJSON, IEditor } from '@zeroxsolutions/editor-core/document/core/index';
import { page, userEvent } from 'vitest/browser';
import '../../../../../../../test/nova-style.css';
import '../../../styles.css';
import { expectViewerMatches, layoutFrame, storedLayout } from '../../../../../../../test/block-layout';
import { insertFromSlashMenu, mountDocumentEditor } from '../../../../../../../src/test/document-editor';
import { dropFiles, fileInput, firePastedFiles, heldUpload, pngFile } from '../../../../../../../src/test/uploads';
import { image } from '../image/index';
import { standardKit } from '../standard/index';
import { file } from './file';

describe('the file block in the Document Editor', () => {
  it('is inserted from the slash menu and named after the file its link reaches', async () => {
    const editor = await mountDocumentEditor([standardKit(), file()]);

    await insertFromSlashMenu('File');
    await userEvent.click(page.getByRole('textbox', { name: 'File link' }));
    await userEvent.keyboard('https://files.test/docs/trip%20plan.pdf{Enter}');

    await expect.element(page.getByTestId('file-name')).toHaveTextContent('trip plan.pdf');
    expect(editor.getJSON().content?.find((node) => node.type === 'file')?.attrs).toMatchObject({
      href: 'https://files.test/docs/trip%20plan.pdf',
      name: 'trip plan.pdf',
    });
  });
});

describe('the file block with uploads', () => {
  const pdf = (): File => new File([new Uint8Array(1536)], 'plan.pdf', { type: 'application/pdf' });
  const notes: DocJSON = { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Notes' }] }] };
  const fileOf = (editor: IEditor) => editor.getJSON().content?.find((node) => node.type === 'file');

  it('takes a link only when the host gives no upload', async () => {
    await mountDocumentEditor([standardKit(), file()]);
    await insertFromSlashMenu('File');

    await expect.element(page.getByRole('textbox', { name: 'File link' })).toBeVisible();
    expect(page.getByTestId('upload-tabs').query()).toBeNull();
  });

  it('uploads a picked file, drawn by its name and size until the address lands with them', async () => {
    const { upload, calls } = heldUpload();
    const editor = await mountDocumentEditor([standardKit(), file({ upload })]);
    await insertFromSlashMenu('File');

    await userEvent.upload(fileInput(), pdf());
    await vi.waitFor(() => expect(calls).toHaveLength(1));

    const uploading = page.getByTestId('file-upload');
    await expect.element(uploading.getByTestId('file-name')).toHaveTextContent('plan.pdf');
    await expect.element(uploading.getByTestId('file-size')).toHaveTextContent('1.5 KB');
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

  it('makes a pasted file a file block, and a pasted image an image block where the image uploads, fired by script as the clipboard cannot carry a PDF', async () => {
    const { upload, calls } = heldUpload();
    const editor = await mountDocumentEditor([standardKit(), file({ upload }), image({ upload })], notes);
    await userEvent.click(page.getByText('Notes'));

    firePastedFiles(document.activeElement!, [pdf(), pngFile()]);

    await vi.waitFor(() => expect(calls.map((call) => call.file.name)).toEqual(['plan.pdf', 'cat.png']));
    expect(editor.getJSON().content?.map((node) => node.type)).toEqual(expect.arrayContaining(['file', 'image']));
    expect(JSON.stringify(editor.getJSON())).not.toMatch(/blob:/);
  });

  it('makes a dropped file a file block', async () => {
    const { upload, calls } = heldUpload();
    const editor = await mountDocumentEditor([standardKit(), file({ upload })], notes);

    await dropFiles(page.getByText('Notes').element(), ['plan.pdf']);

    await vi.waitFor(() => expect(calls.map((call) => call.file.name)).toEqual(['plan.pdf']));
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
    await expectViewerMatches(editor, features);
  });

  it('no resize handle and no full width toggle is drawn', async () => {
    await mountDocumentEditor(features, laidOut({}));
    await userEvent.click(layoutFrame(), { position: { x: 4, y: 4 } });
    await expect.element(page.getByRole('toolbar', { name: 'Block layout' })).toBeVisible();

    expect(page.getByTestId('resize-handle').query()).toBeNull();
    expect(
      page.getByRole('toolbar', { name: 'Block layout' }).getByRole('button', { name: 'Full width' }).query(),
    ).toBeNull();
  });
});
