import { afterEach, describe, expect, it, vi } from 'vitest';
import type { DocJSON, IEditor } from '@zeroxsolutions/editor-core/document/core/index';
import { page, userEvent } from 'vitest/browser';
import '../../../../../../../test/nova-style.css';
import '../../../styles.css';
import {
  dragEndHandle,
  expectViewerMatches,
  layoutFrame,
  lineWidth,
  storedLayout,
} from '../../../../../../../test/block-layout';
import { insertFromSlashMenu, mountDocumentEditor } from '../../../../../../../src/test/document-editor';
import { dropFiles, fileInput, firePastedFiles, heldUpload } from '../../../../../../../src/test/uploads';
import { standardKit } from '../standard/index';
import { media } from './media';

describe('the media block in the Document Editor', () => {
  it('inserts a video from the slash menu and takes its link and caption', async () => {
    const editor = await mountDocumentEditor([standardKit(), media()]);

    await insertFromSlashMenu('Video');
    await userEvent.click(page.getByRole('textbox', { name: 'Video link' }));
    await userEvent.keyboard('https://cdn.test/hoi-an.mp4{Enter}');
    await expect.element(page.getByTestId('media')).toHaveAttribute('data-kind', 'video');
    await userEvent.click(page.getByRole('textbox', { name: 'Add a caption' }));
    await userEvent.keyboard('Lanterns');

    await expect
      .poll(() => editor.getJSON().content?.find((node) => node.type === 'media')?.attrs)
      .toMatchObject({ src: 'https://cdn.test/hoi-an.mp4', kind: 'video', caption: 'Lanterns' });
  });

  it('inserts an audio player from the slash menu', async () => {
    const editor = await mountDocumentEditor([standardKit(), media()]);

    await insertFromSlashMenu('Audio');
    await userEvent.click(page.getByRole('textbox', { name: 'Audio link' }));
    await userEvent.keyboard('https://cdn.test/rain.mp3{Enter}');

    await expect.element(page.getByTestId('media')).toHaveAttribute('data-kind', 'audio');
    expect(editor.getJSON().content?.find((node) => node.type === 'media')?.attrs).toMatchObject({
      kind: 'audio',
      src: 'https://cdn.test/rain.mp3',
    });
  });
});

describe('the media block with uploads', () => {
  const notes: DocJSON = { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Notes' }] }] };
  const mediaOf = (editor: IEditor) => editor.getJSON().content?.find((node) => node.type === 'media');
  const mp4 = (): File => new File([new Uint8Array(8)], 'lanterns.mp4', { type: 'video/mp4' });
  const mp3 = (): File => new File([new Uint8Array(8)], 'rain.mp3', { type: 'audio/mpeg' });

  it('uploads a picked video into an empty video block', async () => {
    const { upload, calls } = heldUpload();
    const editor = await mountDocumentEditor([standardKit(), media({ upload })]);
    await insertFromSlashMenu('Video');

    await userEvent.upload(fileInput(), mp4());
    await vi.waitFor(() => expect(calls).toHaveLength(1));
    await expect.element(page.getByTestId('media-upload')).toHaveTextContent('lanterns.mp4');
    calls[0].answer('https://cdn.test/lanterns.mp4');

    await vi.waitFor(() => expect(mediaOf(editor)?.attrs).toMatchObject({ src: 'https://cdn.test/lanterns.mp4' }));
  });

  it('refuses a sound in a video block', async () => {
    const { upload, calls } = heldUpload();
    await mountDocumentEditor([standardKit(), media({ upload })]);
    await insertFromSlashMenu('Video');

    await userEvent.upload(fileInput(), mp3());

    await expect.element(page.getByText('This kind of file is not taken here')).toBeVisible();
    expect(calls).toHaveLength(0);
  });

  it('makes a pasted video a video block, fired by script as the clipboard cannot carry a video', async () => {
    const { upload, calls } = heldUpload();
    const editor = await mountDocumentEditor([standardKit(), media({ upload })], notes);
    await userEvent.click(page.getByText('Notes'));

    firePastedFiles(document.activeElement!, [mp4()]);

    await vi.waitFor(() => expect(calls).toHaveLength(1));
    expect(mediaOf(editor)?.attrs?.kind).toBe('video');
  });

  it('makes a dropped sound an audio block', async () => {
    const { upload, calls } = heldUpload();
    const editor = await mountDocumentEditor([standardKit(), media({ upload })], notes);

    await dropFiles(page.getByText('Notes').element(), ['rain.mp3']);

    await vi.waitFor(() => expect(calls.map((call) => call.file.name)).toEqual(['rain.mp3']));
    expect(mediaOf(editor)?.attrs?.kind).toBe('audio');
  });
});

describe('the media block layout', () => {
  const features = [standardKit(), media()];
  const laidOut = (layout: Record<string, unknown>): DocJSON => ({
    type: 'doc',
    content: [
      { type: 'paragraph', content: [{ type: 'text', text: 'Trip' }] },
      { type: 'media', attrs: { src: 'https://cdn.test/hoi-an.mp4', kind: 'video', ...layout } },
      // A block the document ends on would take a trailing line on the first press, under the press.
      { type: 'paragraph', content: [{ type: 'text', text: 'After' }] },
    ],
  });
  /** Selects the block, or puts the caret in it, and waits for its layout toolbar. */
  async function select(): Promise<void> {
    await userEvent.click(layoutFrame(), { position: { x: 4, y: 4 } });
    await expect.element(page.getByRole('toolbar', { name: 'Block layout' })).toBeVisible();
  }

  afterEach(async () => {
    await page.viewport(414, 896);
  });

  it('align from the block toolbar sets data-align and survives the Viewer', async () => {
    await page.viewport(900, 700);
    const editor = await mountDocumentEditor(features, laidOut({ width: 0.5 }));
    await select();

    await userEvent.click(page.getByRole('button', { name: 'Align right' }));

    await vi.waitFor(() => expect(storedLayout(editor, 1)).toEqual({ align: 'end', width: 0.5 }));
    await expectViewerMatches(editor, features);
  });

  it('dragging the right handle to half the column stores 0.5 in one undo step', async () => {
    await page.viewport(900, 700);
    const editor = await mountDocumentEditor(features, laidOut({}));
    await select();

    await dragEndHandle(-lineWidth() / 2);

    await vi.waitFor(() => expect(storedLayout(editor, 1).width).toBe(0.5));
    await userEvent.click(page.getByText('Trip'));
    await userEvent.keyboard('{ControlOrMeta>}z{/ControlOrMeta}');
    await vi.waitFor(() => expect(storedLayout(editor, 1).width).toBeNull());
  });

  it('Full width from the block toolbar stores the full width', async () => {
    await page.viewport(900, 700);
    const editor = await mountDocumentEditor(features, laidOut({ width: 0.5 }));
    await select();

    await userEvent.click(page.getByRole('button', { name: 'Full width' }));

    await vi.waitFor(() => expect(storedLayout(editor, 1).width).toBe('full'));
  });
});
