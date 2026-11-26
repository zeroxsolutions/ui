import { useState, type ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { userEvent } from 'vitest/browser';
import type { DocJSON, EditorFeature, IEditor } from '@zeroxsolutions/editor-core/document/core/index';
import { collectUiContributions } from '@zeroxsolutions/editor-core/document/ui/index';
import '../../../../../../test/nova-style.css';
import '../../styles.css';
import { findElement } from '../../../../../../src/test/document-editor';
import { heldUpload, pasteFiles, pngFile } from '../../../../../../src/test/uploads';
import { image } from '../features/image/image';
import { standardKit } from '../features/standard/index';
import { Editor } from '../react/editor';
import { BubbleMenu } from './bubble-menu';

const notes: DocJSON = {
  type: 'doc',
  content: [
    { type: 'paragraph', content: [{ type: 'text', text: 'Notes for the bay' }] },
    { type: 'image', attrs: { src: 'https://cdn.test/old.png', alt: 'Bay' } },
    { type: 'paragraph', content: [{ type: 'text', text: 'Trip' }] },
  ],
};

function Harness({ features, onReady }: { features: EditorFeature[]; onReady(editor: IEditor): void }): ReactNode {
  const [editor, setEditor] = useState<IEditor | null>(null);
  const [bubble] = useState(() => collectUiContributions(features).bubble);
  return (
    <div className="style-nova" style={{ padding: '80px' }}>
      <Editor
        features={features}
        content={notes}
        onReady={(ready) => {
          setEditor(ready);
          onReady(ready);
        }}
      />
      {editor && <BubbleMenu editor={editor} items={bubble} />}
    </div>
  );
}

async function mount(features: EditorFeature[]): Promise<IEditor> {
  let ready: IEditor | null = null;
  await render(<Harness features={features} onReady={(editor) => (ready = editor)} />);
  return vi.waitFor(() => {
    if (ready === null || document.querySelector('.ProseMirror') === null) throw new Error('the editor is not mounted');
    return ready;
  });
}

const bubble = (): Element | null => document.querySelector('[data-slot=bubble-menu]');

/** Selects the words of the paragraph holding "Notes" and waits for the bubble over them. */
async function selectNotes(): Promise<void> {
  await userEvent.tripleClick(await findElement('.ProseMirror p', 'Notes'));
  await vi.waitFor(() => expect(bubble()).not.toBeNull());
}

describe('the bubble menu', () => {
  it('hides once a pasted file puts a block in place of the selected text', async () => {
    const { upload, calls } = heldUpload();
    await mount([standardKit(), image({ upload })]);
    await selectNotes();

    pasteFiles(await findElement('.ProseMirror'), [pngFile()]);

    await vi.waitFor(() => expect(calls).toHaveLength(1));
    await vi.waitFor(() => expect(bubble()).toBeNull());
  });

  it('hides once a command puts a block in place of the selected text', async () => {
    const editor = await mount([standardKit(), image()]);
    await selectNotes();

    editor.run('insertImage', { src: 'https://cdn.test/cat.png' });

    await vi.waitFor(() => expect(document.querySelector('.ProseMirror img')).not.toBeNull());
    await vi.waitFor(() => expect(bubble()).toBeNull());
  });
});
