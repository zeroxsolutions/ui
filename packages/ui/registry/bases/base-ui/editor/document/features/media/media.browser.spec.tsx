import { describe, expect, it } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import '../../../../../../../test/nova-style.css';
import '../../../styles.css';
import { findElement, insertFromSlashMenu, mountDocumentEditor } from '../../blocks/block-feature.testing';
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
