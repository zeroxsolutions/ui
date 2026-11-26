import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { page, userEvent } from 'vitest/browser';
import type { IEditor } from '@zeroxsolutions/editor-core/document/core/index';
import { collectUiContributions } from '@zeroxsolutions/editor-core/document/ui/index';
import {
  emailProfile,
  fromEmailBlocks,
  toEmailBlocks,
  type EditorEmailBlock,
} from '@zeroxsolutions/editor-core/profiles/index';
import '../../../../../../test/nova-style.css';
import '../../styles.css';
import { Editor } from '../../document/react/editor';
import { BubbleMenu } from '../../document/ui/bubble-menu';
import { emailKit, emailUi } from './email-kit';

const profile = emailProfile({ variables: [] });

function block(overrides: Partial<EditorEmailBlock> & Pick<EditorEmailBlock, 'type'>): EditorEmailBlock {
  return { id: null, key: '', attributes: {}, content: {}, ...overrides };
}

const paragraph = (text: string) => block({ type: 'paragraph', content: { text } });

function Harness({ blocks, onReady }: { blocks: EditorEmailBlock[]; onReady(editor: IEditor): void }) {
  const [features] = useState(() => emailKit(profile));
  const [ui] = useState(() => emailUi(collectUiContributions(features), profile));
  const [editor, setEditor] = useState<IEditor | null>(null);
  const [root, setRoot] = useState<HTMLDivElement | null>(null);
  return (
    <div ref={setRoot} className="style-nova p-12">
      <Editor
        features={features}
        content={fromEmailBlocks(blocks)}
        onReady={(ready) => {
          setEditor(ready);
          onReady(ready);
        }}
      />
      {editor && <BubbleMenu editor={editor} items={ui.bubble} container={root} />}
    </div>
  );
}

async function mount(blocks: EditorEmailBlock[]): Promise<IEditor> {
  let ready: IEditor | null = null;
  await render(<Harness blocks={blocks} onReady={(editor) => (ready = editor)} />);
  return vi.waitFor(() => {
    if (!ready || !document.querySelector('[contenteditable=true]')) throw new Error('the editor is not ready');
    return ready;
  });
}

function find(selector: string, text: string): HTMLElement {
  const found = [...document.querySelectorAll<HTMLElement>(selector)].find((element) =>
    element.textContent?.includes(text),
  );
  if (!found) throw new Error(`nothing matches ${selector} holding "${text}"`);
  return found;
}

/** Selects the line holding `text` and waits for the bubble over it. */
async function select(selector: string, text: string): Promise<void> {
  await userEvent.tripleClick(await vi.waitFor(() => find(selector, text)));
  await vi.waitFor(() => expect(document.querySelector('[data-slot=bubble-menu]')).not.toBeNull());
}

/** Picks the swatch `name` of `group` in the colour menu, opening the menu where it is closed. */
async function pickColor(group: 'Text color' | 'Background', name: string): Promise<void> {
  const menu = page.getByRole('dialog', { name: 'Text color' });
  if (menu.elements().length === 0) await userEvent.click(page.getByRole('button', { name: 'Text color' }));
  await userEvent.click(menu.getByRole('group', { name: group }).getByRole('button', { name }));
}

const exported = (editor: IEditor) => toEmailBlocks(editor.getJSON(), [], { kinds: profile.kinds });

describe('text styling in the email editor', () => {
  it('aligns a line from the bubble, offering no justify, which the email cannot draw', async () => {
    const editor = await mount([paragraph('Hi there')]);
    await select('[contenteditable=true] p', 'Hi there');

    const group = page.getByRole('group', { name: 'Text alignment' });
    await expect.element(group.getByRole('button', { name: 'Align center' })).toBeVisible();
    expect(group.getByRole('button', { name: 'Justify' }).elements()).toHaveLength(0);
    await userEvent.click(group.getByRole('button', { name: 'Align right' }));

    await vi.waitFor(() => expect(exported(editor)[0]?.attributes.align).toBe('right'));
  });

  it('carries a colour as inline markup', async () => {
    const editor = await mount([paragraph('Hi there')]);
    await select('[contenteditable=true] p', 'Hi there');

    await pickColor('Text color', 'Red');
    await pickColor('Background', 'Amber');

    await vi.waitFor(() =>
      expect(exported(editor)[0]?.content.text).toBe('{bg=amber}{color=red}Hi there{/color}{/bg}'),
    );
    expect(JSON.stringify(editor.getJSON())).not.toMatch(/#[0-9a-f]{3,8}/i);
  });

  it('turns a line into Lead and Small text from the block menu, and back to a paragraph', async () => {
    const editor = await mount([paragraph('Hi there'), paragraph('After')]);
    const choose = async (title: string) => {
      await expect.element(page.getByRole('menu')).not.toBeInTheDocument();
      await userEvent.hover(await vi.waitFor(() => find('[contenteditable=true] p', 'Hi there')));
      await userEvent.click(page.getByRole('button', { name: 'Block handle' }));
      await userEvent.click(page.getByRole('menuitem', { name: 'Turn into' }));
      await userEvent.click(page.getByRole('menuitemradio', { name: title, exact: true }));
    };

    await choose('Lead');
    await vi.waitFor(() => expect(exported(editor)[0]?.attributes.size).toBe('lead'));

    await choose('Small text');
    await vi.waitFor(() => expect(exported(editor)[0]?.attributes.size).toBe('small'));

    await choose('Text');
    await vi.waitFor(() => expect(exported(editor)[0]?.attributes.size).toBeUndefined());
    expect(exported(editor)[0]?.content.text).toBe('Hi there');
  });

  it("colours a hero's text, which the hero stores as inline markup", async () => {
    const editor = await mount([
      block({
        id: 'h1',
        key: 'h1',
        type: 'hero',
        content: {
          image: 'https://cdn.example.test/hero.png',
          alt: 'The bay',
          heading: 'Welcome',
          text: 'Your stay starts tomorrow.',
          buttonLabel: 'Go',
          buttonHref: 'https://example.test/trip',
        },
      }),
    ]);
    await select('[data-slot=card-text]', 'Your stay starts');

    await pickColor('Text color', 'Teal');

    await vi.waitFor(() => expect(String(exported(editor)[0]?.content.text)).toContain('{color=teal}'));
  });
});
