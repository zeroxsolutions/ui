import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { page, userEvent } from 'vitest/browser';
import type { DocJSON, EditorFeature, IEditor } from '@zeroxsolutions/editor-core/document/core/index';
import { collectUiContributions } from '@zeroxsolutions/editor-core/document/ui/index';
import '../../../../../../../test/nova-style.css';
import '../../../styles.css';
import { Editor } from '../../react/editor';
import { SlashMenu } from '../../ui/slash-menu';
import { callout } from '../callout/index';
import { columns } from '../columns/index';
import { standardKit } from '../standard/index';
import { button } from './button';

const features: EditorFeature[] = [standardKit(), button(), columns(), callout()];
const contributions = collectUiContributions(features);

const empty: DocJSON = { type: 'doc', content: [{ type: 'paragraph' }] };

function Host({
  onReady,
  content = empty,
  className = 'p-12',
}: {
  onReady(editor: IEditor): void;
  content?: DocJSON;
  className?: string;
}) {
  const [editor, setEditor] = useState<IEditor | null>(null);
  return (
    <div className={`style-nova ${className}`}>
      <Editor
        features={features}
        content={content}
        onReady={(ready) => {
          setEditor(ready);
          onReady(ready);
        }}
      />
      {editor && <SlashMenu editor={editor} items={contributions.slash} />}
    </div>
  );
}

async function mount(content?: DocJSON, className?: string): Promise<IEditor> {
  let mounted: IEditor | null = null;
  await render(<Host content={content} className={className} onReady={(editor) => (mounted = editor)} />);
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

describe('the button in the Document Editor', () => {
  it('inserts from the slash menu, and stores the label typed and the link set in its popover', async () => {
    const editor = await mount();
    await insertFromSlash('Button');

    await userEvent.fill(page.getByRole('textbox', { name: 'Button label' }), 'Book now');
    await userEvent.click(page.getByRole('button', { name: 'Link' }));
    await userEvent.fill(page.getByRole('textbox', { name: 'Link' }), 'https://x.test/book');
    await userEvent.click(page.getByRole('textbox', { name: 'Button label' }));

    await vi.waitFor(() =>
      expect(editor.getJSON().content?.find((node) => node.type === 'button')?.attrs).toMatchObject({
        label: 'Book now',
        href: 'https://x.test/book',
      }),
    );
  });

  it('keeps its Link control inside a callout as narrow as a phone column', async () => {
    await mount(
      {
        type: 'doc',
        content: [
          {
            type: 'callout',
            content: [
              { type: 'paragraph', content: [{ type: 'text', text: 'Write a sentence or two here.' }] },
              { type: 'button', attrs: { label: 'Learn more', href: '' } },
            ],
          },
        ],
      },
      'w-64 p-4',
    );

    const link = page.getByRole('button', { name: 'Link' });
    await expect.element(link).toBeVisible();
    const box = document.querySelector('[data-type=callout]')!.getBoundingClientRect();
    const control = link.element().getBoundingClientRect();
    expect(control.right).toBeLessThanOrEqual(box.right);
    expect(control.left).toBeGreaterThanOrEqual(box.left);
  });
});
