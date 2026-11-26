import { describe, expect, it, vi } from 'vitest';
import type { IEditor } from '@zeroxsolutions/editor-core/document/core/index';
import { page, userEvent } from 'vitest/browser';
import '../../../../../../../test/nova-style.css';
import '../../../styles.css';
import { findElement, insertFromSlashMenu, mountDocumentEditor } from '../../../../../../../src/test/document-editor';
import { dropFiles, fileInput, heldUpload, pasteFiles } from '../../../../../../../src/test/uploads';
import { standardKit } from '../standard/index';
import { media } from './media';

describe('the media block in the Document Editor', () => {
  it('inserts a video from the slash menu and takes its link and caption', async () => {
    const editor = await mountDocumentEditor([standardKit(), media()]);

    await insertFromSlashMenu('Video');
    await userEvent.click(page.getByRole('textbox', { name: 'Video link' }));
    await userEvent.keyboard('https://cdn.test/hoi-an.mp4{Enter}');
    await findElement('video');
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

    expect((await findElement('audio')).getAttribute('src')).toBe('https://cdn.test/rain.mp3');
    expect(editor.getJSON().content?.find((node) => node.type === 'media')?.attrs).toMatchObject({ kind: 'audio' });
  });
});

describe('the media block with uploads', () => {
  const mediaOf = (editor: IEditor) => editor.getJSON().content?.find((node) => node.type === 'media');
  const mp4 = (): File => new File([new Uint8Array(8)], 'lanterns.mp4', { type: 'video/mp4' });
  const mp3 = (): File => new File([new Uint8Array(8)], 'rain.mp3', { type: 'audio/mpeg' });

  it('uploads a picked video into an empty video block', async () => {
    const { upload, calls } = heldUpload();
    const editor = await mountDocumentEditor([standardKit(), media({ upload })]);
    await insertFromSlashMenu('Video');

    await userEvent.upload(fileInput(), mp4());
    await vi.waitFor(() => expect(calls).toHaveLength(1));
    expect((await findElement('[data-slot=media-upload]')).textContent).toContain('lanterns.mp4');
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

  it('makes a pasted video a video block and a dropped sound an audio block', async () => {
    const { upload, calls } = heldUpload();
    const editor = await mountDocumentEditor([standardKit(), media({ upload })]);
    await userEvent.click(await findElement('.ProseMirror p'));

    pasteFiles(await findElement('.ProseMirror'), [mp4()]);
    await vi.waitFor(() => expect(calls).toHaveLength(1));
    dropFiles(await findElement('.ProseMirror p'), [mp3()]);
    await vi.waitFor(() => expect(calls).toHaveLength(2));

    const kinds = editor
      .getJSON()
      .content?.filter((node) => node.type === 'media')
      .map((node) => node.attrs?.kind);
    expect(kinds?.sort()).toEqual(['audio', 'video']);
  });
});
