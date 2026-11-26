import { describe, expect, it, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import type { DocJSON, IEditor } from '@zeroxsolutions/editor-core/document/core/index';
import { createCodecRegistry, serialize } from '@zeroxsolutions/editor-core/document/serialize/index';
import '../../../../../../../test/nova-style.css';
import '../../../styles.css';
import { findElement, mountDocumentEditor } from '../../../../../../../src/test/document-editor';
import { dropFiles, fileInput, heldUpload, pasteFiles, pngFile } from '../../../../../../../src/test/uploads';
import { standardKit } from '../standard/index';
import { image, type ImageOptions } from './image';

const withImage: DocJSON = {
  type: 'doc',
  content: [
    { type: 'paragraph', content: [{ type: 'text', text: 'Trip' }] },
    { type: 'image', attrs: { src: 'https://cdn.test/old.png', alt: 'Bay' } },
  ],
};

const srcOf = (editor: IEditor): unknown => editor.getJSON().content?.find((node) => node.type === 'image')?.attrs?.src;

/** What the editor hands out: its JSON and its HTML export, where no local address may ever appear. */
function handedOut(editor: IEditor, options: ImageOptions): string {
  const registry = createCodecRegistry([standardKit(), image(options)]);
  return JSON.stringify(editor.getJSON()) + serialize(editor.getJSON(), 'html', registry);
}

async function openEdit(): Promise<void> {
  await userEvent.click(page.getByRole('button', { name: 'Edit' }));
}

/** Opens the image's popover on its Upload tab; an image with an address opens on Link. */
async function openUpload(): Promise<void> {
  await openEdit();
  await userEvent.click(page.getByRole('tab', { name: 'Upload' }));
}

describe('the image block with uploads', () => {
  it('takes an address only when the host gives no upload', async () => {
    await mountDocumentEditor([standardKit(), image()], withImage);
    await openEdit();

    await expect.element(page.getByRole('textbox', { name: 'Image address' })).toBeVisible();
    expect(document.querySelector('[data-slot=upload-tabs]')).toBeNull();
  });

  it('reaches its tabs and its file picker from the keyboard', async () => {
    const { upload } = heldUpload();
    await mountDocumentEditor([standardKit(), image({ upload })], withImage);
    await openEdit();

    await userEvent.click(page.getByRole('tab', { name: 'Link' }));
    await userEvent.keyboard('{ArrowLeft}');
    await expect.element(page.getByRole('tab', { name: 'Upload' })).toHaveAttribute('aria-selected', 'true');
    const picked = vi.fn((event: Event) => event.preventDefault());
    (await findElement('[data-slot=upload-tabs-file-input]')).addEventListener('click', picked);
    await userEvent.keyboard('{Tab}');
    await expect.element(page.getByRole('button', { name: 'Choose a file' })).toHaveFocus();
    await userEvent.keyboard('{Enter}');

    expect(picked).toHaveBeenCalledOnce();
  });

  it('draws the picked file dimmed with its progress, and stores only the address the host answers', async () => {
    const { upload, calls } = heldUpload();
    const options = { upload };
    const editor = await mountDocumentEditor([standardKit(), image(options)], withImage);
    await openUpload();

    await userEvent.upload(fileInput(), pngFile());
    await vi.waitFor(() => expect(calls).toHaveLength(1));
    calls[0].progress(0.4);

    await expect
      .element(page.getByRole('progressbar', { name: 'Uploading cat.png' }))
      .toHaveAttribute('aria-valuenow', '40');
    expect((await findElement('[data-slot=image] img')).getAttribute('src')).toMatch(/^blob:/);
    expect(handedOut(editor, options)).not.toMatch(/blob:|data:/);

    calls[0].answer('https://cdn.test/cat.png');

    await vi.waitFor(() => expect(srcOf(editor)).toBe('https://cdn.test/cat.png'));
    expect(handedOut(editor, options)).not.toMatch(/blob:|data:/);
    expect(document.querySelector('[data-slot=upload-status]')).toBeNull();
  });

  it('goes back to the image it had on cancel, and aborts the upload', async () => {
    const { upload, calls } = heldUpload();
    const editor = await mountDocumentEditor([standardKit(), image({ upload })], withImage);
    await openUpload();
    await userEvent.upload(fileInput(), pngFile());

    await userEvent.click(page.getByRole('button', { name: 'Cancel upload' }));

    expect(calls[0].signal.aborted).toBe(true);
    expect((await findElement('[data-slot=image] img')).getAttribute('src')).toBe('https://cdn.test/old.png');
    expect(srcOf(editor)).toBe('https://cdn.test/old.png');
  });

  it('says a failed upload failed and tries again on retry', async () => {
    const { upload, calls } = heldUpload();
    const editor = await mountDocumentEditor([standardKit(), image({ upload })], withImage);
    await openUpload();
    await userEvent.upload(fileInput(), pngFile());
    await vi.waitFor(() => expect(calls).toHaveLength(1));

    calls[0].fail();
    await expect.element(page.getByRole('alert')).toHaveTextContent('The upload failed');
    await userEvent.click(page.getByRole('button', { name: 'Retry' }));
    await vi.waitFor(() => expect(calls).toHaveLength(2));
    calls[1].answer('https://cdn.test/cat.png');

    await vi.waitFor(() => expect(srcOf(editor)).toBe('https://cdn.test/cat.png'));
  });

  it("refuses a file over the host's cap in the tab, before it is sent", async () => {
    const { upload, calls } = heldUpload();
    await mountDocumentEditor([standardKit(), image({ upload, maxBytes: 1024 })], withImage);
    await openUpload();

    await userEvent.upload(fileInput(), pngFile('big.png', 4096));

    await expect.element(page.getByText('The file is larger than 1 KB')).toBeVisible();
    expect(calls).toHaveLength(0);
  });

  it('turns a pasted image file into an image block that uploads', async () => {
    const { upload, calls } = heldUpload();
    const editor = await mountDocumentEditor([standardKit(), image({ upload })]);
    await userEvent.click(await findElement('.ProseMirror p'));

    pasteFiles(await findElement('.ProseMirror'), [pngFile()]);

    await vi.waitFor(() => expect(calls).toHaveLength(1));
    expect(editor.getJSON().content?.filter((node) => node.type === 'image')).toHaveLength(1);
    expect(JSON.stringify(editor.getJSON())).not.toMatch(/blob:/);
    calls[0].answer('https://cdn.test/cat.png');
    await vi.waitFor(() => expect(srcOf(editor)).toBe('https://cdn.test/cat.png'));
  });

  it('turns a dropped image file into an image block, and takes the block away again on cancel', async () => {
    const { upload, calls } = heldUpload();
    const editor = await mountDocumentEditor([standardKit(), image({ upload })], withImage);

    dropFiles(await findElement('.ProseMirror p', 'Trip'), [pngFile('drop.png')]);

    await vi.waitFor(() => expect(calls.map((call) => call.file.name)).toEqual(['drop.png']));
    expect(editor.getJSON().content?.filter((node) => node.type === 'image')).toHaveLength(2);
    await userEvent.click(page.getByRole('button', { name: 'Cancel upload' }));

    await vi.waitFor(() => expect(editor.getJSON().content?.filter((node) => node.type === 'image')).toHaveLength(1));
    expect(calls[0].signal.aborted).toBe(true);
  });
});
