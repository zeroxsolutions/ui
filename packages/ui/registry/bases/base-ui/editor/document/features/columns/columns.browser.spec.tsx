import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { userEvent } from 'vitest/browser';
import type { DocJSON, EditorFeature, IEditor } from '@zeroxsolutions/editor-core/document/core/index';
import { collectUiContributions } from '@zeroxsolutions/editor-core/document/ui/index';
import '../../../../../../../test/nova-style.css';
import '../../../styles.css';
import { Editor } from '../../react/editor';
import { SlashMenu } from '../../ui/slash-menu';
import { standardKit } from '../standard/index';
import { button } from '../button/index';
import { columns } from './columns';

const features: EditorFeature[] = [standardKit(), button(), columns()];
const contributions = collectUiContributions(features);

const empty: DocJSON = { type: 'doc', content: [{ type: 'paragraph' }] };

function Host({ onReady }: { onReady(editor: IEditor): void }) {
  const [editor, setEditor] = useState<IEditor | null>(null);
  return (
    <div className="style-nova p-12">
      <Editor
        features={features}
        content={empty}
        onReady={(ready) => {
          setEditor(ready);
          onReady(ready);
        }}
      />
      {editor && <SlashMenu editor={editor} items={contributions.slash} />}
    </div>
  );
}

async function mount(): Promise<IEditor> {
  let mounted: IEditor | null = null;
  await render(<Host onReady={(editor) => (mounted = editor)} />);
  return vi.waitFor(() => {
    if (!mounted) throw new Error('the editor is not ready');
    return mounted;
  });
}

async function insertFromSlash(title: string): Promise<void> {
  await userEvent.click(await vi.waitFor(() => document.querySelector<HTMLElement>('.ProseMirror p')!));
  await userEvent.keyboard('/');
  await userEvent.click(
    await vi.waitFor(() => {
      const found = [...document.querySelectorAll<HTMLElement>('[data-slot=slash-menu] [data-slot=item]')].find(
        (item) => item.textContent?.startsWith(title),
      );
      if (!found) throw new Error(`the slash menu offers no ${title}`);
      return found;
    }),
  );
}

describe('the columns in the Document Editor', () => {
  it('inserts two equal columns from the slash menu, each holding a line to type in', async () => {
    const editor = await mount();
    await insertFromSlash('Columns');

    await vi.waitFor(() => {
      const inserted = editor.getJSON().content?.find((node) => node.type === 'columns');
      expect(inserted?.attrs?.ratio).toEqual([1, 1]);
      expect(inserted?.content?.map((column) => column.content?.[0]?.type)).toEqual(['paragraph', 'paragraph']);
    });
    expect(document.querySelectorAll('[data-slot=column]')).toHaveLength(2);
  });
});
