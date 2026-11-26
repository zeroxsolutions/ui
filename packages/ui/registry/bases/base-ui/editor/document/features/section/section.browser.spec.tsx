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
import { callout } from '../callout/index';
import { columns } from '../columns/index';
import { image } from '../image/index';
import { standardKit } from '../standard/index';
import { table } from '../table/index';
import { toggle } from '../toggle/index';
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

const features: EditorFeature[] = [
  standardKit(),
  columns(),
  callout(),
  toggle(),
  table(),
  image(),
  section({ messages: words }),
];
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

function Host({
  content,
  onReady,
  drawn = features,
}: {
  content: DocJSON;
  onReady(editor: IEditor): void;
  drawn?: EditorFeature[];
}) {
  const [editor, setEditor] = useState<IEditor | null>(null);
  return (
    <div className="style-nova p-12">
      <Editor
        features={drawn}
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

async function mount(
  content: DocJSON = { type: 'doc', content: [{ type: 'paragraph' }] },
  drawn = features,
): Promise<IEditor> {
  let mounted: IEditor | null = null;
  await render(<Host content={content} drawn={drawn} onReady={(editor) => (mounted = editor)} />);
  return vi.waitFor(() => {
    if (!mounted) throw new Error('the editor is not ready');
    return mounted;
  });
}

/** The line of the document reading `text`. */
const holding = (text: string): HTMLElement => page.getByText(text, { exact: true }).element() as HTMLElement;

async function openSlash(at: HTMLElement): Promise<void> {
  await userEvent.click(at);
  await userEvent.keyboard('{End}/');
  await expect.element(slashItems().first()).toBeVisible();
}

const slashItems = () => page.getByTestId('slash-menu').getByTestId('item');
const slashTitles = () =>
  slashItems()
    .elements()
    .map((item) => item.textContent ?? '');

/** Whether any section of `nodes` sits below the top of the document. */
function nestedSection(nodes: readonly NodeJSON[], inside = false): boolean {
  return nodes.some((node) => (node.type === 'section' && inside) || nestedSection(node.content ?? [], true));
}

/** The blocks that hold blocks, each holding `content`, by the name a reader gives them. */
const holders: Record<string, (content: NodeJSON[]) => NodeJSON> = {
  callout: (content) => ({ type: 'callout', attrs: { variant: 'info' }, content }),
  toggle: (content) => ({ type: 'toggle', attrs: { open: true }, content: [line('summary'), ...content] }),
  quote: (content) => ({ type: 'blockquote', content }),
  'list item': (content) => ({ type: 'bulletList', content: [{ type: 'listItem', content }] }),
  'table cell': (content) => ({
    type: 'table',
    content: [{ type: 'tableRow', content: [{ type: 'tableCell', content }] }],
  }),
};

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

afterEach(async () => {
  await page.viewport(414, 896);
});

describe('the section in the Document Editor', () => {
  it('inserts from the slash menu holding an empty line the caret types into', async () => {
    const editor = await mount();
    await openSlash(await vi.waitFor(() => document.querySelector<HTMLElement>('.ProseMirror p')!));
    await userEvent.click(slashItems().filter({ hasText: /^Section/ }));

    await vi.waitFor(() => expect(editor.getJSON().content?.[0]).toMatchObject({ type: 'section' }));
    await userEvent.keyboard('inside');
    await vi.waitFor(() =>
      expect(editor.getJSON().content?.[0]).toMatchObject({
        type: 'section',
        content: [{ type: 'paragraph', content: [{ text: 'inside' }] }],
      }),
    );
  });

  it('sets its background, padding and width from three menus, named from words, each one undo step', async () => {
    const editor = await mount({
      type: 'doc',
      content: [sectionOf(line('inside')), line('after')],
    });
    await userEvent.click(page.getByText('inside'));
    await expect.element(toolbar()).toBeVisible();

    await userEvent.click(toolbar().getByRole('button', { name: 'Fond' }));
    const swatches = page.getByRole('dialog', { name: 'Fond' });
    await expect
      .element(swatches.getByRole('button', { name: 'Aucun', exact: true }))
      .toHaveAttribute('aria-pressed', 'true');
    await userEvent.click(swatches.getByRole('button', { name: 'Sarcelle' }));
    await expect.element(swatches).not.toBeInTheDocument();

    await userEvent.click(toolbar().getByRole('button', { name: 'Marge interne' }));
    await expect.element(page.getByRole('menuitemradio', { name: 'Moyenne' })).toHaveAttribute('aria-checked', 'true');
    await userEvent.click(page.getByRole('menuitemradio', { name: 'Grande' }));
    await userEvent.click(toolbar().getByRole('button', { name: 'Largeur' }));
    await userEvent.click(page.getByRole('menuitemradio', { name: 'Large', exact: true }));
    await vi.waitFor(() =>
      expect(sectionAttrs(editor)).toMatchObject({
        background: 'teal',
        padding: 'large',
        width: 'wide',
      }),
    );

    // A menu closed by a pick gives the focus back to the text, so the undo key reaches the editor.
    await vi.waitFor(() => expect(editor.isFocused()).toBe(true));
    await userEvent.keyboard('{ControlOrMeta>}z{/ControlOrMeta}');
    await vi.waitFor(() => expect(sectionAttrs(editor)?.width ?? null).toBeNull());
    expect(sectionAttrs(editor)).toMatchObject({
      background: 'teal',
      padding: 'large',
    });

    // The section's defaults are stored as no value at all.
    await userEvent.click(toolbar().getByRole('button', { name: 'Fond' }));
    await expect.element(page.getByRole('button', { name: 'Sarcelle' })).toHaveAttribute('aria-pressed', 'true');
    await userEvent.click(page.getByRole('button', { name: 'Aucun', exact: true }));
    await vi.waitFor(() => expect(sectionAttrs(editor)?.background ?? null).toBeNull());
  });

  it('opens each menu from the keyboard, Escape closing it back to its control, then to the text', async () => {
    const editor = await mount({
      type: 'doc',
      content: [sectionOf(line('inside')), line('after')],
    });
    await userEvent.click(page.getByText('inside'));
    await expect.element(toolbar()).toBeVisible();
    const focused = () => document.activeElement?.getAttribute('aria-label') ?? document.activeElement?.textContent;

    await userEvent.keyboard('{Alt>}{F10}{/Alt}');
    await vi.waitFor(() => expect(focused()).toBe('Fond'));
    await userEvent.keyboard('{ArrowRight}');
    await vi.waitFor(() => expect(focused()).toBe('Marge interne'));
    await userEvent.keyboard('{Enter}');
    await expect.element(page.getByRole('menu', { name: 'Marge interne' })).toBeVisible();
    await userEvent.keyboard('{Escape}');
    await expect.element(page.getByRole('menu', { name: 'Marge interne' })).not.toBeInTheDocument();
    await vi.waitFor(() => expect(focused()).toBe('Marge interne'));

    // A pick by a key keeps the focus in the toolbar.
    await userEvent.keyboard('{ArrowLeft}{Enter}');
    await vi.waitFor(() => expect(document.activeElement?.getAttribute('aria-pressed')).toBe('true'));
    await userEvent.keyboard('{ArrowRight}{Enter}');
    await vi.waitFor(() => expect(sectionAttrs(editor)?.background).toBe('muted'));
    await vi.waitFor(() => expect(focused()).toBe('Fond'));

    await userEvent.keyboard('{Escape}');
    await vi.waitFor(() => expect(editor.isFocused()).toBe(true));
    await expect.element(toolbar()).toBeVisible();
  });

  it('draws no toolbar on a section the host keeps from changing', async () => {
    const editor = await mount({ type: 'doc', content: [sectionOf(line('inside')), line('after')] }, [
      standardKit(),
      section({ messages: words, changeable: () => false }),
    ]);
    await userEvent.click(page.getByText('inside'));

    await vi.waitFor(() => expect(editor.isFocused()).toBe(true));
    expect(page.getByRole('toolbar').query()).toBeNull();
  });

  it("shows only the innermost block's toolbar, and Alt+F10 steps out to the section's and around", async () => {
    const editor = await mount({
      type: 'doc',
      content: [sectionOf(lanes([line('left')], [line('right')])), line('after')],
    });
    const columnsToolbar = page.getByRole('toolbar', { name: DEFAULT_LAYOUT_WORDS.toolbar });
    const drawnToolbars = () => page.getByRole('toolbar').elements().length;
    const holdsFocus = (bar: typeof columnsToolbar) => bar.element().contains(document.activeElement);
    await userEvent.click(holding('left'));
    await expect.element(columnsToolbar).toBeVisible();
    await vi.waitFor(() => expect(drawnToolbars()).toBe(1));

    await userEvent.keyboard('{Alt>}{F10}{/Alt}');
    await vi.waitFor(() => expect(holdsFocus(columnsToolbar)).toBe(true));

    await userEvent.keyboard('{Alt>}{F10}{/Alt}');
    await vi.waitFor(() => expect(holdsFocus(toolbar())).toBe(true));
    await vi.waitFor(() => expect(drawnToolbars()).toBe(1));

    await userEvent.keyboard('{Alt>}{F10}{/Alt}');
    await vi.waitFor(() => expect(holdsFocus(columnsToolbar)).toBe(true));

    await userEvent.keyboard('{Escape}');
    await vi.waitFor(() => expect(editor.isFocused()).toBe(true));
    await expect.element(columnsToolbar).toBeVisible();
    expect(drawnToolbars()).toBe(1);
  });

  it('takes a block dragged into it, and gives one dragged out', async () => {
    await page.viewport(1200, 800);
    const editor = await mount({
      type: 'doc',
      content: [line('outside'), sectionOf(line('first'), line('second')), line('after')],
    });
    await userEvent.dragAndDrop(await gripBeside(holding('outside')), holding('second'), {
      steps: 10,
    });
    await vi.waitFor(() => expect(sectionTexts(editor)).toContain('outside'));

    // A later block of the section, as the grip addresses the section itself beside its first line.
    await userEvent.dragAndDrop(await gripBeside(holding('second')), holding('after'), {
      steps: 10,
    });
    await vi.waitFor(() => expect(sectionTexts(editor)).not.toContain('second'));
    expect(editor.getText()).toContain('second');
  });

  it('draws in the Viewer the background, padding and width the Editor draws', async () => {
    const doc: DocJSON = {
      type: 'doc',
      content: [{ ...sectionOf(line('inside')), attrs: { background: 'teal', padding: 'small', width: 'wide' } }],
    };
    const viewed = await render(<Viewer doc={doc} features={features} />);
    const drawn = { 'data-background': 'teal', 'data-padding': 'small', 'data-width': 'wide' };
    for (const [name, value] of Object.entries(drawn)) {
      await expect.element(viewed.getByTestId('section')).toHaveAttribute(name, value);
    }
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

  it.each(Object.keys(holders))('offers no section in a %s, nor takes one pasted there', async (name) => {
    const editor = await mount({
      type: 'doc',
      content: [holders[name]!([line('inner'), { type: 'paragraph' }]), line('after')],
    });
    await openSlash(document.querySelector<HTMLElement>('.ProseMirror p:empty, .ProseMirror p:has(br:only-child)')!);
    expect(slashTitles().some((title) => title.startsWith('Section'))).toBe(false);
    expect(slashTitles().length).toBeGreaterThan(0);
    await userEvent.keyboard('{Escape}');
    await copyHtml('<div data-type="section" data-background="red"><p>copied</p></div>');
    await userEvent.click(holding('inner'));
    await userEvent.keyboard('{End}');
    await userEvent.paste();
    await vi.waitFor(() => expect(editor.getText()).toContain('copied'));
    expect(nestedSection(editor.getJSON().content ?? [])).toBe(false);
  });

  it('takes its own HTML export back on a paste, its tokens kept', async () => {
    const editor = await mount({ type: 'doc', content: [line('top')] });
    // A line before it, so the copy takes the whole section rather than the text inside it.
    await copyHtml(
      '<p>before</p><section data-section data-background="teal" data-padding="large"><p>copied</p></section>',
    );
    await userEvent.click(holding('top'));
    await userEvent.keyboard('{End}');
    await userEvent.paste();

    await vi.waitFor(() => expect(sectionAttrs(editor)).toMatchObject({ background: 'teal', padding: 'large' }));
    expect(sectionTexts(editor)).toEqual(['copied']);
  });

  it('keeps a section out of a section and a lane when one is pasted there', async () => {
    const editor = await mount({
      type: 'doc',
      content: [sectionOf(line('inside')), lanes([line('left')], [line('right')])],
    });
    await copyHtml('<div data-type="section" data-background="red"><p>copied</p></div>');
    // The section first: a lane's caret opens the columns' toolbar above the lanes, over the section's last line.
    for (const text of ['inside', 'left']) {
      await userEvent.click(holding(text));
      await userEvent.keyboard('{End}');
      await userEvent.paste();
    }
    await vi.waitFor(() => expect(editor.getText().match(/copied/g)).toHaveLength(2));
    expect(nestedSection(editor.getJSON().content ?? [])).toBe(false);
  });
});
