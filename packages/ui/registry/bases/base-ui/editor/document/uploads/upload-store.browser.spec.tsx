import { describe, expect, it, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { z } from 'zod';
import { Extension, type Editor } from '@zeroxsolutions/editor-core/document/advanced';
import { defineFeature, type DocJSON, type IEditor } from '@zeroxsolutions/editor-core/document/core/index';
import { findElement, mountDocumentEditor } from '../../../../../../src/test/document-editor';
import { standardKit } from '../features/standard/index';
import { heldUpload } from '../../../../../../src/test/uploads';
import { DEFAULT_UPLOAD_MESSAGES, type EditorUpload } from './upload';
import { uploadsExtension, uploadStoreOf, type UploadRequest, type UploadStore } from './upload-store';

// The engine behind the editor a spec mounted, so a spec can make the change a drag or a paste makes.
let engine: Editor | null = null;

const picture = defineFeature({
  id: 'picture',
  nodes: [
    {
      name: 'picture',
      group: 'block',
      atom: true,
      attrs: z.object({ src: z.string().default(''), alt: z.string().default('') }),
    },
  ],
  advanced: {
    engineExtensions: [
      uploadsExtension('picture', null),
      Extension.create({
        name: 'pictureSpecEngine',
        onBeforeCreate() {
          engine = this.editor;
        },
      }),
    ],
  },
});

function engineOf(): Editor {
  if (!engine) throw new Error('no editor is mounted');
  return engine;
}

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

  it('keeps an upload whose block is dragged elsewhere, and lands it in the moved block', async () => {
    const { editor, store } = await mount();
    const { upload, calls } = heldUpload();
    store.start(PICTURE_AT, 'src', png(), requestOf(upload));

    // A drag deletes the block and inserts the same node where it drops, in one transaction.
    const current = engineOf();
    const node = current.state.doc.nodeAt(PICTURE_AT)!;
    const tr = current.state.tr.delete(PICTURE_AT, PICTURE_AT + node.nodeSize).insert(0, node);
    current.view.dispatch(tr.setMeta('uiEvent', 'drop'));
    calls[0].answer('https://cdn.test/cat.png');

    await vi.waitFor(() =>
      expect(editor.getJSON().content?.[0]).toMatchObject({ attrs: { src: 'https://cdn.test/cat.png' } }),
    );
    expect(calls[0].signal.aborted).toBe(false);
  });

  it('drops an upload whose block a paste replaces, leaving the pasted block as it came', async () => {
    const { editor, store } = await mount();
    const { upload, calls } = heldUpload();
    store.start(PICTURE_AT, 'src', png(), requestOf(upload));

    const current = engineOf();
    const pasted = current.schema.nodes.picture.create({ src: 'https://cdn.test/pasted.png' });
    current.view.dispatch(current.state.tr.replaceWith(PICTURE_AT, PICTURE_AT + 1, pasted).setMeta('uiEvent', 'paste'));
    calls[0].answer('https://cdn.test/cat.png');

    await vi.waitFor(() => expect(calls[0].signal.aborted).toBe(true));
    expect(srcOf(editor)).toBe('https://cdn.test/pasted.png');
    expect(store.entries()).toEqual([]);
  });

  it('keeps an upload while the author changes its block in place', async () => {
    const { editor, store } = await mount();
    const { upload, calls } = heldUpload();
    store.start(PICTURE_AT, 'src', png(), requestOf(upload));

    const current = engineOf();
    current.view.dispatch(
      current.state.tr.setNodeMarkup(PICTURE_AT, undefined, { src: 'https://cdn.test/old.png', alt: 'Bay' }),
    );
    calls[0].answer('https://cdn.test/cat.png');

    await vi.waitFor(() => expect(srcOf(editor)).toBe('https://cdn.test/cat.png'));
  });

  it('reads an endless progress as full and a progress that is no number as none', async () => {
    const { store } = await mount();
    const { upload, calls } = heldUpload();
    store.start(PICTURE_AT, 'src', png(), requestOf(upload));

    calls[0].progress(Infinity);
    await vi.waitFor(() => expect(store.find(PICTURE_AT, 'src')).toMatchObject({ progress: 1 }));
    calls[0].progress(Number.NaN);
    await vi.waitFor(() => expect(store.find(PICTURE_AT, 'src')).toMatchObject({ progress: 0 }));
  });

  it('stops a failed run, so its late progress does not reach the retry', async () => {
    const { store } = await mount();
    const { upload, calls } = heldUpload();
    store.start(PICTURE_AT, 'src', png(), requestOf(upload));
    calls[0].fail();
    await vi.waitFor(() => expect(store.find(PICTURE_AT, 'src')).toMatchObject({ phase: 'failed' }));

    store.retry(store.entries()[0].id);
    calls[0].progress(0.9);

    expect(calls[0].signal.aborted).toBe(true);
    await vi.waitFor(() => expect(store.find(PICTURE_AT, 'src')).toMatchObject({ phase: 'uploading', progress: null }));
  });
});
