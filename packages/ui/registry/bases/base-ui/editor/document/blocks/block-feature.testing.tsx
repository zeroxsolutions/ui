import { useState, type ReactNode } from 'react';
import { render } from 'vitest-browser-react';
import { userEvent } from 'vitest/browser';
import { vi } from 'vitest';
import type { DocJSON, EditorFeature, IEditor } from '@zeroxsolutions/editor-core/document/core/index';
import { collectUiContributions } from '@zeroxsolutions/editor-core/document/ui/index';
import { Editor } from '../react/editor';
import { SlashMenu } from '../ui/slash-menu';

/** The Document Editor with its slash menu, as a host draws it. */
function DocumentEditorHarness({
  features,
  content,
  onReady,
}: {
  features: EditorFeature[];
  content?: DocJSON;
  onReady(editor: IEditor): void;
}): ReactNode {
  const [editor, setEditor] = useState<IEditor | null>(null);
  const [slash] = useState(() => collectUiContributions(features).slash);
  return (
    <div className="style-nova" style={{ padding: '0 80px' }}>
      <Editor
        features={features}
        content={content}
        onReady={(ready) => {
          setEditor(ready);
          onReady(ready);
        }}
      />
      {editor && <SlashMenu editor={editor} items={slash} />}
    </div>
  );
}

/** Mounts the Document Editor holding `features` and answers its facade once it is ready. */
export async function mountDocumentEditor(features: EditorFeature[], content?: DocJSON): Promise<IEditor> {
  let ready: IEditor | null = null;
  await render(<DocumentEditorHarness features={features} content={content} onReady={(editor) => (ready = editor)} />);
  return vi.waitFor(() => {
    if (ready === null || document.querySelector('.ProseMirror') === null) throw new Error('the editor is not mounted');
    return ready;
  });
}

/** The first element `selector` finds whose text holds `text`, waited for. */
export function findElement(selector: string, text = ''): Promise<HTMLElement> {
  return vi.waitFor(() => {
    const found = [...document.querySelectorAll<HTMLElement>(selector)].find((element) =>
      (element.textContent ?? '').includes(text),
    );
    if (!found) throw new Error(`no ${selector} holding "${text}"`);
    return found;
  });
}

/** Types `/` at the end of the document's last paragraph and picks the slash item titled `title`. */
export async function insertFromSlashMenu(title: string): Promise<void> {
  await userEvent.click(await findElement('.ProseMirror p'));
  await userEvent.keyboard('{End}/');
  await userEvent.click(await findElement('[data-slot=slash-menu] [data-slot=item]', title));
}
