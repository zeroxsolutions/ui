import { describe, expect, it, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { z } from 'zod';
import { defineFeature, type DocJSON, type IEditor } from '@zeroxsolutions/editor-core/document/core/index';
import { findElement, mountDocumentEditor } from '../../../../../../src/test/document-editor';
import { standardKit } from '../features/standard/index';
import { DEFAULT_UPLOAD_MESSAGES, type EditorUpload } from './upload';
import { uploadsExtension, uploadStoreOf, type UploadRequest, type UploadStore } from './upload-store';

/** An upload the spec answers by hand: each call waits until the spec resolves or rejects it. */
function heldUpload() {
  const calls: {
    file: File;
    signal: AbortSignal;
    progress(fraction: number): void;
    answer(url: string): void;
    fail(): void;
  }[] = [];
  const upload: EditorUpload = (file, { signal, onProgress }) =>
    new Promise((resolve, reject) => {
      calls.push({
        file,
        signal,
        progress: onProgress,
        answer: (url) => resolve({ url }),
        fail: () => reject(new Error('offline')),
      });
    });
  return { upload, calls };
}

const picture = defineFeature({
  id: 'picture',
  nodes: [{ name: 'picture', group: 'block', atom: true, attrs: z.object({ src: z.string().default('') }) }],
  advanced: { engineExtensions: [uploadsExtension('picture', null)] },
});

const doc: DocJSON = {
  type: 'doc',
  content: [
    { type: 'paragraph', content: [{ type: 'text', text: 'Before' }] },
    { type: 'picture', attrs: { src: 'https://cdn.test/old.png' } },
  ],
};
const PICTURE_AT = 8;

function requestOf(upload: EditorUpload, extra: Partial<UploadRequest> = {}): UploadRequest {
  return {
    upload,
    accept: 'image/*',
    limits: {},
    messages: DEFAULT_UPLOAD_MESSAGES,
    preview: true,
    land: (_attrs, url) => ({ src: url }),
    ...extra,
  };
}

const png = (bytes = 4): File => new File([new Uint8Array(bytes)], 'cat.png', { type: 'image/png' });
const srcOf = (editor: IEditor): unknown =>
  editor.getJSON().content?.find((node) => node.type === 'picture')?.attrs?.src;

async function mount(): Promise<{ editor: IEditor; store: UploadStore }> {
  const editor = await mountDocumentEditor([standardKit(), picture], doc);
  const store = uploadStoreOf(editor);
  if (!store) throw new Error('the editor has no upload store');
  return { editor, store };
}

describe('the upload store', () => {
  it('refuses a file of a type the block does not take, or over the cap, without calling the host', async () => {
    const { store } = await mount();
    const { upload, calls } = heldUpload();
    const pdf = new File(['%PDF'], 'plan.pdf', { type: 'application/pdf' });

    expect(store.start(PICTURE_AT, 'src', pdf, requestOf(upload))).toBe(DEFAULT_UPLOAD_MESSAGES.notAccepted);
    expect(store.start(PICTURE_AT, 'src', png(), requestOf(upload, { limits: { accept: 'image/jpeg' } }))).toBe(
      DEFAULT_UPLOAD_MESSAGES.notAccepted,
    );
    expect(store.start(PICTURE_AT, 'src', png(2048), requestOf(upload, { limits: { maxBytes: 1024 } }))).toBe(
      'The file is larger than 1 KB',
    );
    expect(calls).toHaveLength(0);
    expect(store.entries()).toEqual([]);
  });

  it('keeps the file outside the document while it uploads, and stores only the answered address', async () => {
    const { editor, store } = await mount();
    const { upload, calls } = heldUpload();
    const changes: string[] = [];
    editor.onChange(() => changes.push(JSON.stringify(editor.getJSON())));

    expect(store.start(PICTURE_AT, 'src', png(), requestOf(upload))).toBeNull();
    calls[0].progress(0.5);

    await vi.waitFor(() => expect(store.find(PICTURE_AT, 'src')).toMatchObject({ phase: 'uploading', progress: 0.5 }));
    expect(store.find(PICTURE_AT, 'src')?.preview).toMatch(/^blob:/);
    expect(srcOf(editor)).toBe('https://cdn.test/old.png');

    calls[0].answer('https://cdn.test/cat.png');

    await vi.waitFor(() => expect(srcOf(editor)).toBe('https://cdn.test/cat.png'));
    expect(store.entries()).toEqual([]);
    expect(changes.join()).not.toMatch(/blob:|data:/);
  });

  it('lands the address in an undo step of its own, apart from the typing just before it', async () => {
    const { editor, store } = await mount();
    const { upload, calls } = heldUpload();
    store.start(PICTURE_AT, 'src', png(), requestOf(upload));
    await userEvent.click(await findElement('.ProseMirror p', 'Before'));
    await userEvent.keyboard('{Home}Now ');
    calls[0].answer('https://cdn.test/cat.png');
    await vi.waitFor(() => expect(srcOf(editor)).toBe('https://cdn.test/cat.png'));
    expect(editor.getText()).toContain('Now Before');

    await userEvent.keyboard('{ControlOrMeta>}z{/ControlOrMeta}');

    await vi.waitFor(() => expect(srcOf(editor)).toBe('https://cdn.test/old.png'));
    expect(editor.getText()).toContain('Now Before');
  });

  it('aborts on cancel and leaves the block as it was', async () => {
    const { editor, store } = await mount();
    const { upload, calls } = heldUpload();
    store.start(PICTURE_AT, 'src', png(), requestOf(upload));

    store.cancel(store.entries()[0].id);
    calls[0].answer('https://cdn.test/late.png');

    expect(calls[0].signal.aborted).toBe(true);
    expect(store.entries()).toEqual([]);
    await expect.poll(() => calls[0].signal.aborted).toBe(true);
    expect(srcOf(editor)).toBe('https://cdn.test/old.png');
  });

  it('aborts when the block is deleted', async () => {
    const { editor, store } = await mount();
    const { upload, calls } = heldUpload();
    store.start(PICTURE_AT, 'src', png(), requestOf(upload));

    editor.setContent({ type: 'doc', content: [{ type: 'paragraph' }] });

    await vi.waitFor(() => expect(calls[0].signal.aborted).toBe(true));
    expect(store.entries()).toEqual([]);
  });

  it('follows its block when text is written before it', async () => {
    const { editor, store } = await mount();
    const { upload, calls } = heldUpload();
    store.start(PICTURE_AT, 'src', png(), requestOf(upload));

    await userEvent.click(await findElement('.ProseMirror p', 'Before'));
    await userEvent.keyboard('{Home}Now ');
    calls[0].answer('https://cdn.test/cat.png');

    await vi.waitFor(() => expect(srcOf(editor)).toBe('https://cdn.test/cat.png'));
    expect(calls[0].signal.aborted).toBe(false);
  });

  it('aborts when the editor is destroyed', async () => {
    const { editor, store } = await mount();
    const { upload, calls } = heldUpload();
    store.start(PICTURE_AT, 'src', png(), requestOf(upload));

    editor.destroy();

    expect(calls[0].signal.aborted).toBe(true);
  });

  it('says a failed upload failed, and tries again on retry', async () => {
    const { editor, store } = await mount();
    const { upload, calls } = heldUpload();
    store.start(PICTURE_AT, 'src', png(), requestOf(upload));

    calls[0].fail();
    await vi.waitFor(() =>
      expect(store.find(PICTURE_AT, 'src')).toMatchObject({
        phase: 'failed',
        message: DEFAULT_UPLOAD_MESSAGES.failed,
        retryable: true,
      }),
    );
    store.retry(store.entries()[0].id);
    calls[1].answer('https://cdn.test/cat.png');

    await vi.waitFor(() => expect(srcOf(editor)).toBe('https://cdn.test/cat.png'));
  });

  it('refuses an answered address that is not a web one, or one the block finds wrong', async () => {
    const { editor, store } = await mount();
    const { upload, calls } = heldUpload();
    store.start(PICTURE_AT, 'src', png(), requestOf(upload));
    calls[0].answer('blob:https://app.test/1234');
    await vi.waitFor(() =>
      expect(store.find(PICTURE_AT, 'src')).toMatchObject({
        phase: 'failed',
        message: DEFAULT_UPLOAD_MESSAGES.addressRefused,
        retryable: false,
      }),
    );

    store.start(PICTURE_AT, 'src', png(), requestOf(upload, { problems: () => ['Use https://'] }));
    calls[1].answer('http://cdn.test/cat.png');

    await vi.waitFor(() =>
      expect(store.find(PICTURE_AT, 'src')).toMatchObject({ phase: 'failed', message: 'Use https://' }),
    );
    expect(srcOf(editor)).toBe('https://cdn.test/old.png');
  });
});
