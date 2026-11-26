import { afterEach, describe, expect, it, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { Extension, Plugin } from '@zeroxsolutions/editor-core/document/advanced';
import { defineFeature, type DocJSON, type IEditor } from '@zeroxsolutions/editor-core/document/core/index';
import { createCodecRegistry, serialize } from '@zeroxsolutions/editor-core/document/serialize/index';
import '../../../../../../../test/nova-style.css';
import '../../../styles.css';
import { mountDocumentEditor } from '../../../../../../../src/test/document-editor';
import {
  dragEndHandle,
  layoutFrame,
  lineWidth,
  selectBlock,
  storedLayout,
  viewerFrame,
} from '../../../../../../../test/block-layout';
import { dropFiles, fileInput, heldUpload, pasteImage, pngFile } from '../../../../../../../src/test/uploads';
import { standardKit } from '../standard/index';
import { image, type ImageOptions } from './image';

const withImage: DocJSON = {
  type: 'doc',
  content: [
    { type: 'paragraph', content: [{ type: 'text', text: 'Trip' }] },
    { type: 'image', attrs: { src: 'https://cdn.test/old.png', alt: 'Bay' } },
  ],
};

const notes: DocJSON = {
  type: 'doc',
  content: [
    { type: 'paragraph', content: [{ type: 'text', text: 'Trip' }] },
    { type: 'paragraph', content: [{ type: 'text', text: 'Notes' }] },
  ],
};

const imagesOf = (editor: IEditor): unknown[] =>
  editor.getJSON().content?.filter((node) => node.type === 'image') ?? [];

const srcOf = (editor: IEditor): unknown => editor.getJSON().content?.find((node) => node.type === 'image')?.attrs?.src;

/** What the editor hands out: its JSON and its HTML export, where no local address may ever appear. */
function handedOut(editor: IEditor, options: ImageOptions): string {
  const registry = createCodecRegistry([standardKit(), image(options)]);
  return JSON.stringify(editor.getJSON()) + serialize(editor.getJSON(), 'html', registry);
}

/** An editor that refuses every paste, as a locked email refuses a new block. */
const refusesPastes = defineFeature({
  id: 'refusesPastes',
  advanced: {
    engineExtensions: [
      Extension.create({
        name: 'refusesPastes',
        addProseMirrorPlugins: () => [new Plugin({ filterTransaction: (tr) => tr.getMeta('uiEvent') !== 'paste' })],
      }),
    ],
  },
});

async function openEdit(): Promise<void> {
  await userEvent.click(page.getByRole('button', { name: 'Edit' }));
}

/** Opens the image's popover on its Upload tab; an image with an address opens on Link. */
async function openUpload(): Promise<void> {
  await openEdit();
  await userEvent.click(page.getByRole('tab', { name: 'Upload' }));
}

const empty: DocJSON = { type: 'doc', content: [{ type: 'image', attrs: { src: '' } }] };

const overlap = (a: DOMRect, b: DOMRect): boolean =>
  a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;

describe('the image block', () => {
  it("names its controls and an empty image in the host's words", async () => {
    const { upload } = heldUpload();
    await mountDocumentEditor(
      [
        standardKit(),
        image({
          upload,
          words: { edit: 'Bearbeiten', address: 'Bildadresse', alt: 'Alternativtext', empty: 'Leeres Bild' },
        }),
      ],
      empty,
    );

    await expect.element(page.getByText('Leeres Bild')).toBeVisible();
    await userEvent.click(page.getByRole('button', { name: 'Bearbeiten' }));
    await userEvent.click(page.getByRole('tab', { name: 'Link' }));
    await expect.element(page.getByRole('textbox', { name: 'Bildadresse' })).toBeVisible();
    await expect.element(page.getByRole('textbox', { name: 'Alternativtext' })).toBeVisible();
    await expect.element(page.getByRole('textbox', { name: 'Caption' })).toBeVisible();
  });

  it('draws an empty image where its Edit button does not cover it', async () => {
    await mountDocumentEditor([standardKit(), image()], empty);

    const label = page.getByText('Empty image');
    const edit = page.getByRole('button', { name: 'Edit' });
    await expect.element(label).toBeVisible();
    await expect.element(edit).toBeVisible();
    expect(overlap(label.element().getBoundingClientRect(), edit.element().getBoundingClientRect())).toBe(false);
  });
});

describe('the image block with uploads', () => {
  it('takes an address only when the host gives no upload', async () => {
    await mountDocumentEditor([standardKit(), image()], withImage);
    await openEdit();

    await expect.element(page.getByRole('textbox', { name: 'Image address' })).toBeVisible();
    expect(page.getByTestId('upload-tabs').query()).toBeNull();
  });

  it('reaches its tabs and its file picker from the keyboard', async () => {
    const { upload } = heldUpload();
    await mountDocumentEditor([standardKit(), image({ upload })], withImage);
    await openEdit();

    await userEvent.click(page.getByRole('tab', { name: 'Link' }));
    await userEvent.keyboard('{ArrowLeft}');
    await expect.element(page.getByRole('tab', { name: 'Upload' })).toHaveAttribute('aria-selected', 'true');
    const picked = vi.fn((event: Event) => event.preventDefault());
    fileInput().element().addEventListener('click', picked);
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
    await expect
      .element(page.getByTestId('image').getByRole('img'))
      .toHaveAttribute('src', expect.stringMatching(/^blob:/));
    expect(handedOut(editor, options)).not.toMatch(/blob:|data:/);

    calls[0].answer('https://cdn.test/cat.png');

    await vi.waitFor(() => expect(srcOf(editor)).toBe('https://cdn.test/cat.png'));
    expect(handedOut(editor, options)).not.toMatch(/blob:|data:/);
    await expect.element(page.getByTestId('upload-status')).not.toBeInTheDocument();
  });

  it('goes back to the image it had on cancel, and aborts the upload', async () => {
    const { upload, calls } = heldUpload();
    const editor = await mountDocumentEditor([standardKit(), image({ upload })], withImage);
    await openUpload();
    await userEvent.upload(fileInput(), pngFile());

    await userEvent.click(page.getByRole('button', { name: 'Cancel upload' }));

    expect(calls[0].signal.aborted).toBe(true);
    await expect.element(page.getByTestId('image').getByRole('img')).toHaveAttribute('src', 'https://cdn.test/old.png');
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
    const editor = await mountDocumentEditor([standardKit(), image({ upload })], notes);
    await userEvent.click(page.getByText('Notes'));

    await pasteImage();

    await vi.waitFor(() => expect(calls).toHaveLength(1));
    expect(editor.getJSON().content?.filter((node) => node.type === 'image')).toHaveLength(1);
    expect(JSON.stringify(editor.getJSON())).not.toMatch(/blob:/);
    calls[0].answer('https://cdn.test/cat.png');
    await vi.waitFor(() => expect(srcOf(editor)).toBe('https://cdn.test/cat.png'));
  });

  it('pastes the copied text rather than the file when the clipboard holds both', async () => {
    const { upload, calls } = heldUpload();
    const editor = await mountDocumentEditor([standardKit(), image({ upload })], notes);
    await userEvent.click(page.getByText('Notes'));

    await pasteImage({ 'text/html': '<p>Copied words</p>', 'text/plain': 'Copied words' });

    await vi.waitFor(() => expect(editor.getText()).toContain('Copied words'));
    expect(calls).toHaveLength(0);
    expect(editor.getJSON().content?.filter((node) => node.type === 'image')).toHaveLength(0);
  });

  it('leaves a pasted file to the browser when the editor refuses its block', async () => {
    const { upload, calls } = heldUpload();
    await mountDocumentEditor([standardKit(), image({ upload }), refusesPastes], notes);
    await userEvent.click(page.getByText('Notes'));

    // Listened for on the window, the paste has passed every handler in the editor on its way out.
    const left = new Promise<boolean>((resolve) =>
      window.addEventListener('paste', (event) => resolve(!event.defaultPrevented), { once: true }),
    );
    await pasteImage();

    expect(await left).toBe(true);
    expect(calls).toHaveLength(0);
  });

  it('turns a dropped image file into an image block, and takes the block away again on cancel', async () => {
    const { upload, calls } = heldUpload();
    const editor = await mountDocumentEditor([standardKit(), image({ upload })], withImage);

    await dropFiles(page.getByText('Trip').element(), ['drop.png']);

    await vi.waitFor(() => expect(calls.map((call) => call.file.name)).toEqual(['drop.png']));
    expect(editor.getJSON().content?.filter((node) => node.type === 'image')).toHaveLength(2);
    await userEvent.click(page.getByRole('button', { name: 'Cancel upload' }));

    await vi.waitFor(() => expect(editor.getJSON().content?.filter((node) => node.type === 'image')).toHaveLength(1));
    expect(calls[0].signal.aborted).toBe(true);
  });

  it('puts back the text a pasted file replaced when its upload is cancelled', async () => {
    const { upload, calls } = heldUpload();
    const editor = await mountDocumentEditor([standardKit(), image({ upload })], notes);
    await userEvent.click(page.getByText('Notes'));
    await userEvent.keyboard('{ControlOrMeta>}a{/ControlOrMeta}');

    await pasteImage();
    await vi.waitFor(() => expect(calls).toHaveLength(1));
    expect(editor.getText()).not.toContain('Notes');
    await userEvent.click(page.getByRole('button', { name: 'Cancel upload' }));

    await vi.waitFor(() => expect(editor.getText()).toContain('Notes'));
    expect(editor.getText()).toContain('Trip');
    expect(imagesOf(editor)).toHaveLength(0);
    expect(calls[0].signal.aborted).toBe(true);
  });

  it('keeps what the author typed just before a pasted file whose upload is cancelled', async () => {
    const { upload, calls } = heldUpload();
    const editor = await mountDocumentEditor([standardKit(), image({ upload })], notes);
    await userEvent.click(page.getByText('Trip'));
    await userEvent.keyboard('{End} plans');

    await pasteImage();
    await vi.waitFor(() => expect(calls).toHaveLength(1));
    await userEvent.click(page.getByRole('button', { name: 'Cancel upload' }));

    await vi.waitFor(() => expect(imagesOf(editor)).toHaveLength(0));
    expect(editor.getText()).toContain('Trip plans');
  });

  it('puts back the text a pasted file replaced, and keeps what was written since, on cancel', async () => {
    const { upload, calls } = heldUpload();
    const editor = await mountDocumentEditor([standardKit(), image({ upload })], notes);
    await userEvent.dblClick(page.getByText('Notes'));

    await pasteImage();
    await vi.waitFor(() => expect(calls).toHaveLength(1));
    await userEvent.click(page.getByText('Trip'));
    await userEvent.keyboard('{End} plans');
    await userEvent.click(page.getByRole('button', { name: 'Cancel upload' }));

    await vi.waitFor(() => expect(imagesOf(editor)).toHaveLength(0));
    expect(editor.getText()).toContain('Trip plans');
    expect(editor.getText()).toContain('Notes');
  });

  it('shows its upload in a read-only editor without the controls, and lands it there', async () => {
    const { upload, calls } = heldUpload();
    const editor = await mountDocumentEditor([standardKit(), image({ upload })], withImage);
    await openUpload();
    await userEvent.upload(fileInput(), pngFile());
    await vi.waitFor(() => expect(calls).toHaveLength(1));

    editor.setEditable(false);

    await expect.element(page.getByText('Uploading cat.png')).toBeVisible();
    expect(page.getByTestId('upload-status').getByRole('button').query()).toBeNull();
    calls[0].fail();
    await expect.element(page.getByRole('alert')).toHaveTextContent('The upload failed');
    expect(page.getByTestId('upload-status').getByRole('button').query()).toBeNull();

    editor.setEditable(true);
    await userEvent.click(page.getByRole('button', { name: 'Retry' }));
    calls[1].answer('https://cdn.test/cat.png');
    await vi.waitFor(() => expect(srcOf(editor)).toBe('https://cdn.test/cat.png'));
  });

  it('keeps its open tab when the author clears the address', async () => {
    const { upload } = heldUpload();
    const errors = vi.spyOn(console, 'error');
    const editor = await mountDocumentEditor([standardKit(), image({ upload })], withImage);
    await openEdit();

    await userEvent.fill(page.getByRole('textbox', { name: 'Image address' }), '');
    await userEvent.click(page.getByRole('textbox', { name: 'Alt text' }));

    await vi.waitFor(() => expect(srcOf(editor)).toBe(''));
    await expect.element(page.getByRole('tab', { name: 'Link' })).toHaveAttribute('aria-selected', 'true');
    expect(errors.mock.calls.flat().join(' ')).not.toMatch(/default value/);
    errors.mockRestore();
  });

  it('ends its upload when the author types an address instead, which stays', async () => {
    const { upload, calls } = heldUpload();
    const editor = await mountDocumentEditor([standardKit(), image({ upload })], withImage);
    await openUpload();
    await userEvent.upload(fileInput(), pngFile());
    await vi.waitFor(() => expect(calls).toHaveLength(1));

    await openEdit();
    await userEvent.fill(page.getByRole('textbox', { name: 'Image address' }), 'https://cdn.test/typed.png');
    await userEvent.click(page.getByRole('textbox', { name: 'Alt text' }));
    calls[0].answer('https://cdn.test/cat.png');

    await vi.waitFor(() => expect(calls[0].signal.aborted).toBe(true));
    expect(srcOf(editor)).toBe('https://cdn.test/typed.png');
  });
});

describe('the image block layout', () => {
  /** A one-pixel image, drawn at whatever width the layout gives it. */
  const PIXEL = 'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==';
  const features = [standardKit(), image()];
  const sized = (attrs: Record<string, unknown>): DocJSON => ({
    type: 'doc',
    content: [
      { type: 'paragraph', content: [{ type: 'text', text: 'Trip' }] },
      { type: 'image', attrs: { src: PIXEL, alt: 'Bay', ...attrs } },
    ],
  });

  afterEach(async () => {
    await page.viewport(414, 896);
  });

  it('align from the block toolbar sets data-align and survives the Viewer', async () => {
    await page.viewport(900, 700);
    const editor = await mountDocumentEditor(features, sized({ width: 0.5 }));
    await selectBlock();

    await userEvent.click(page.getByRole('button', { name: 'Align center' }));

    await vi.waitFor(() => expect(storedLayout(editor, 1)).toEqual({ align: 'center', width: 0.5 }));
    const edited = layoutFrame();
    const viewed = await viewerFrame(editor.getJSON(), features, lineWidth());
    expect(viewed.getAttribute('data-align')).toBe('center');
    expect(edited.getAttribute('data-align')).toBe('center');
    expect(viewed.getAttribute('data-width')).toBe(edited.getAttribute('data-width'));
  });

  it('draws no layout toolbar and no width handle on an image the host keeps from changing', async () => {
    await page.viewport(900, 700);
    const editor = await mountDocumentEditor(
      [standardKit(), image({ changeable: () => false })],
      sized({ width: 0.5 }),
    );
    await userEvent.click(layoutFrame(), { position: { x: 4, y: 4 } });

    await vi.waitFor(() => expect(editor.getSelection().isNode).toBe(true));
    expect(page.getByRole('toolbar', { name: 'Block layout' }).query()).toBeNull();
    expect(page.getByTestId('resize-handle').query()).toBeNull();
  });

  it('dragging the right handle to half the column stores 0.5 in one undo step', async () => {
    await page.viewport(900, 700);
    const editor = await mountDocumentEditor(features, sized({ width: 1 }));
    await selectBlock();

    await dragEndHandle(-lineWidth() / 2);

    await vi.waitFor(() => expect(storedLayout(editor, 1).width).toBe(0.5));
    await userEvent.click(page.getByText('Trip'));
    await userEvent.keyboard('{ControlOrMeta>}z{/ControlOrMeta}');
    await vi.waitFor(() => expect(storedLayout(editor, 1).width).toBe(1));
  });

  it('Full width from the block toolbar stores the full width, and takes the handles away', async () => {
    await page.viewport(900, 700);
    const editor = await mountDocumentEditor(features, sized({ width: 0.5 }));
    await selectBlock();

    await userEvent.click(page.getByRole('button', { name: 'Full width' }));

    await vi.waitFor(() => expect(storedLayout(editor, 1).width).toBe('full'));
    await expect.element(page.getByTestId('resize-handle')).not.toBeInTheDocument();
  });

  it('a stored width 360 reads as half, the old width field is gone, and no pixel reaches the document', async () => {
    await page.viewport(900, 700);
    const editor = await mountDocumentEditor(features, sized({ width: 360 }));

    await vi.waitFor(() => expect(storedLayout(editor, 1).width).toBe(0.5));
    expect(JSON.stringify(editor.getJSON())).not.toMatch(/\d+px/);
    await openEdit();
    await expect.element(page.getByRole('textbox', { name: 'Alt text' })).toBeVisible();
    expect(page.getByRole('spinbutton').query()).toBeNull();
  });

  it('reads a stored width 360 as half in the Viewer too', async () => {
    const viewed = await viewerFrame(sized({ width: 360 }), features, 720);
    expect(viewed.getAttribute('data-width')).toBe('0.5');
  });
});
