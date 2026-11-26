import { useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { page, userEvent } from 'vitest/browser';
import type { DocJSON, EditorFeature, IEditor, NodeJSON } from '@zeroxsolutions/editor-core/document/core/index';
import { collectUiContributions } from '@zeroxsolutions/editor-core/document/ui/index';
import '../../../../../../../test/nova-style.css';
import '../../../styles.css';
import { DEFAULT_LAYOUT_WORDS, type LayoutWords } from '../../layout/layout-words';
import { Editor } from '../../react/editor';
import { Viewer } from '../../react/viewer';
import { SlashMenu } from '../../ui/slash-menu';
import { columns } from '../columns/index';
import { standardKit } from '../standard/index';
import { section } from './section';

/** Words of another catalogue, so a name drawn from the English would show. */
const words: LayoutWords = {
  ...DEFAULT_LAYOUT_WORDS,
  toolbar: 'Mise en page',
  sectionBackground: 'Fond',
  noBackground: 'Aucun',
  colors: { ...DEFAULT_LAYOUT_WORDS.colors, teal: 'Sarcelle' },
  sectionPadding: 'Marge interne',
  spaces: { none: 'Aucune', small: 'Petite', medium: 'Moyenne', large: 'Grande' },
  sectionWidth: 'Largeur',
  sectionWidths: { content: 'Contenu', wide: 'Large', full: 'Pleine' },
};

const features: EditorFeature[] = [standardKit(), columns(), section({ messages: words })];
const contributions = collectUiContributions(features);

const line = (text: string): NodeJSON => ({ type: 'paragraph', content: [{ type: 'text', text }] });
const sectionOf = (...content: NodeJSON[]): NodeJSON => ({ type: 'section', content });
const lanes = (left: NodeJSON[], right: NodeJSON[]): NodeJSON => ({
  type: 'columns',
  attrs: { ratio: [1, 1] },
  content: [
    { type: 'column', content: left },
    { type: 'column', content: right },
  ],
});

function Host({ content, onReady }: { content: DocJSON; onReady(editor: IEditor): void }) {
  const [editor, setEditor] = useState<IEditor | null>(null);
  return (
    // Room above the editor, where the section's toolbar opens.
    <div className="style-nova p-12 pt-40">
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

async function mount(content: DocJSON = { type: 'doc', content: [{ type: 'paragraph' }] }): Promise<IEditor> {
  let mounted: IEditor | null = null;
  await render(<Host content={content} onReady={(editor) => (mounted = editor)} />);
  return vi.waitFor(() => {
    if (!mounted) throw new Error('the editor is not ready');
    return mounted;
  });
}

function holding(selector: string, text: string): HTMLElement {
  const found = [...document.querySelectorAll<HTMLElement>(selector)].find((element) => element.textContent === text);
  if (!found) throw new Error(`no ${selector} holds ${text}`);
  return found;
}

async function openSlash(at: HTMLElement): Promise<void> {
  await userEvent.click(at);
  await userEvent.keyboard('{End}/');
  await vi.waitFor(() => {
    if (!document.querySelector('[data-slot=slash-menu] [data-slot=item]'))
      throw new Error('the slash menu is not open');
  });
}

const slashTitles = () =>
  [...document.querySelectorAll<HTMLElement>('[data-slot=slash-menu] [data-slot=item]')].map(
    (item) => item.textContent ?? '',
  );

/** Whether any section of `doc` sits in a section or in a lane. */
function nestedSection(nodes: readonly NodeJSON[], inside = false): boolean {
  return nodes.some(
    (node) =>
      (node.type === 'section' && inside) ||
      nestedSection(node.content ?? [], inside || node.type === 'section' || node.type === 'column'),
  );
}

/** Puts `html` on the clipboard as a reader does: selects it in an editable element and copies. */
async function copyHtml(html: string): Promise<void> {
  const source = document.createElement('div');
  source.contentEditable = 'true';
  source.innerHTML = html;
  document.body.append(source);
  await userEvent.click(source);
  await userEvent.keyboard('{ControlOrMeta>}a{/ControlOrMeta}');
  await userEvent.copy();
  source.remove();
}

/** Points at the left of `element`'s first line, as an author reaching for its grip does, and waits for the grip. */
async function gripBeside(element: HTMLElement): Promise<HTMLElement> {
  await userEvent.hover(element, { position: { x: 4, y: 4 } });
  return vi.waitFor(() => {
    const handle = document.querySelector<HTMLElement>('.drag-handle');
    const top = handle?.getBoundingClientRect().top ?? -1;
    const rect = element.getBoundingClientRect();
    if (!handle || handle.classList.contains('hide') || top < rect.top - 12 || top > rect.bottom) {
      throw new Error('the grip is not beside the element');
    }
    return handle;
  });
}

const sectionTexts = (editor: IEditor) =>
  (editor.getJSON().content?.find((node) => node.type === 'section')?.content ?? []).map(
    (node) => node.content?.[0]?.text,
  );

const toolbar = () => page.getByRole('toolbar', { name: 'Mise en page' });
const sectionAttrs = (editor: IEditor) => editor.getJSON().content?.find((node) => node.type === 'section')?.attrs;
const drawnSection = () => document.querySelector<HTMLElement>('.ProseMirror [data-slot=section]')!;

afterEach(async () => {
  await page.viewport(414, 896);
});

describe('the section in the Document Editor', () => {
  it('inserts from the slash menu holding an empty line the caret types into', async () => {
    const editor = await mount();
    await openSlash(await vi.waitFor(() => document.querySelector<HTMLElement>('.ProseMirror p')!));
    await userEvent.click(
      [...document.querySelectorAll<HTMLElement>('[data-slot=slash-menu] [data-slot=item]')].find((item) =>
        item.textContent?.startsWith('Section'),
      )!,
    );

    await vi.waitFor(() => expect(editor.getJSON().content?.[0]).toMatchObject({ type: 'section' }));
    await userEvent.keyboard('inside');
    await vi.waitFor(() =>
      expect(editor.getJSON().content?.[0]).toMatchObject({
        type: 'section',
        content: [{ type: 'paragraph', content: [{ text: 'inside' }] }],
      }),
    );
  });

  it('sets its background, padding and width from its toolbar, named from words, each one undo step', async () => {
    const editor = await mount({ type: 'doc', content: [sectionOf(line('inside')), line('after')] });
    await userEvent.click(page.getByText('inside'));
    await expect.element(toolbar()).toBeVisible();

    await userEvent.click(toolbar().getByRole('button', { name: 'Sarcelle' }));
    await userEvent.click(toolbar().getByRole('button', { name: 'Grande' }));
    await userEvent.click(toolbar().getByRole('button', { name: 'Large', exact: true }));
    await vi.waitFor(() =>
      expect(sectionAttrs(editor)).toMatchObject({ background: 'teal', padding: 'large', width: 'wide' }),
    );
    await expect.element(toolbar().getByRole('group', { name: 'Fond' })).toBeVisible();
    await expect.element(toolbar().getByRole('group', { name: 'Marge interne' })).toBeVisible();
    await expect.element(toolbar().getByRole('group', { name: 'Largeur' })).toBeVisible();
    expect(drawnSection().dataset).toMatchObject({ background: 'teal', padding: 'large', width: 'wide' });

    // The toolbar keeps the focus in the text, so the undo key reaches the editor.
    await userEvent.keyboard('{ControlOrMeta>}z{/ControlOrMeta}');
    await vi.waitFor(() => expect(sectionAttrs(editor)?.width ?? null).toBeNull());
    expect(sectionAttrs(editor)).toMatchObject({ background: 'teal', padding: 'large' });

    // The section's defaults are stored as no value at all.
    await userEvent.click(toolbar().getByRole('button', { name: 'Aucun', exact: true }));
    await vi.waitFor(() => expect(sectionAttrs(editor)?.background ?? null).toBeNull());
  });

  it('takes a block dragged into it, and gives one dragged out', async () => {
    await page.viewport(1200, 800);
    const editor = await mount({
      type: 'doc',
      content: [line('outside'), sectionOf(line('first'), line('second')), line('after')],
    });
    await userEvent.dragAndDrop(
      await gripBeside(holding('.ProseMirror p', 'outside')),
      holding('.ProseMirror p', 'second'),
      {
        steps: 10,
      },
    );
    await vi.waitFor(() => expect(sectionTexts(editor)).toContain('outside'));

    // A later block of the section, as the grip addresses the section itself beside its first line.
    await userEvent.dragAndDrop(
      await gripBeside(holding('.ProseMirror p', 'second')),
      holding('.ProseMirror p', 'after'),
      {
        steps: 10,
      },
    );
    await vi.waitFor(() => expect(sectionTexts(editor)).not.toContain('second'));
    expect(editor.getText()).toContain('second');
  });

  it('draws the same in the Viewer, its background from the theme in light and dark', async () => {
    const doc: DocJSON = {
      type: 'doc',
      content: [{ ...sectionOf(line('inside')), attrs: { background: 'teal', padding: 'small', width: 'wide' } }],
    };
    await render(
      <div className="style-nova">
        <div data-testid="light">
          <Viewer doc={doc} features={features} />
        </div>
        <div data-testid="dark" className="dark">
          <Viewer doc={doc} features={features} />
        </div>
      </div>,
    );
    await mount(doc);
    const viewed = (id: string) =>
      document.querySelector<HTMLElement>(`[data-testid=${id}] [data-slot=section]`) as HTMLElement;
    expect(viewed('light').dataset).toMatchObject({ ...drawnSection().dataset });
    const light = getComputedStyle(viewed('light')).backgroundColor;
    const dark = getComputedStyle(viewed('dark')).backgroundColor;
    expect(light).not.toBe('rgba(0, 0, 0, 0)');
    expect(dark).not.toBe(light);
    expect(getComputedStyle(drawnSection()).backgroundColor).toBe(light);
    expect(getComputedStyle(viewed('light')).paddingTop).toBe(getComputedStyle(drawnSection()).paddingTop);
  });

  it('offers no section in a lane or in a section', async () => {
    await mount({
      type: 'doc',
      content: [lanes([{ type: 'paragraph' }], [line('right')]), sectionOf({ type: 'paragraph' })],
    });
    for (const holder of ['column', 'section']) {
      await openSlash(
        document.querySelector<HTMLElement>(
          `.ProseMirror [data-slot=${holder}] p:empty, .ProseMirror [data-slot=${holder}] p:has(br:only-child)`,
        )!,
      );
      expect(slashTitles().some((title) => title.startsWith('Section'))).toBe(false);
      expect(slashTitles().length).toBeGreaterThan(0);
      await userEvent.keyboard('{Escape}');
    }
  });

  it('keeps a section out of a section and a lane when one is pasted there', async () => {
    const editor = await mount({
      type: 'doc',
      content: [sectionOf(line('inside')), lanes([line('left')], [line('right')])],
    });
    await copyHtml('<div data-type="section" data-background="red"><p>copied</p></div>');
    // The section first: a lane's caret opens the columns' toolbar above the lanes, over the section's last line.
    for (const text of ['inside', 'left']) {
      await userEvent.click(holding('.ProseMirror p', text));
      await userEvent.keyboard('{End}');
      await userEvent.paste();
    }
    await vi.waitFor(() => expect(editor.getText().match(/copied/g)).toHaveLength(2));
    expect(nestedSection(editor.getJSON().content ?? [])).toBe(false);
  });
});
