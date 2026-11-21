import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { userEvent } from 'vitest/browser';
import type { EditorFeature, IEditor, NodeJSON } from '@zeroxsolutions/editor-core/document/core/index';
import { collectUiContributions } from '@zeroxsolutions/editor-core/document/ui/index';
import {
  emailProfile,
  fromEmailBlocks,
  MAIL_LAYOUT_KINDS,
  toEmailBlocks,
  type EditorEmailBlock,
  type EditorProfile,
  type VariableDeclaration,
} from '@zeroxsolutions/editor-core/profiles/index';
import '../../../../../../test/nova-style.css';
import '../../styles.css';
import { standardKit } from '../../document/features/standard/index';
import { Editor } from '../../document/react/editor';
import { BubbleMenu } from '../../document/ui/bubble-menu';
import { EditorToolbar } from '../../document/ui/editor-toolbar';
import { SlashMenu } from '../../document/ui/slash-menu';
import { BlockAttributesMenu } from './block-attributes-menu';
import { emailKit, type EmailKitOptions } from './email-kit';
import { LinkVariablePicker } from './url-variable-picker';

const declared: VariableDeclaration[] = [
  { name: 'name', type: 'string', label: 'Name' },
  { name: 'resetUrl', type: 'url', label: 'Reset link' },
  { name: 'expiresIn', type: 'duration' },
  { name: 'helpUrl', type: 'url', label: 'Help page' },
  { name: 'supportEmail', type: 'email', label: 'Support email' },
];

const fullProfile = emailProfile({ variables: declared });

function block(overrides: Partial<EditorEmailBlock> & Pick<EditorEmailBlock, 'type'>): EditorEmailBlock {
  return { id: null, key: '', attributes: {}, content: {}, ...overrides };
}

const paragraph = (text: string, id: string | null = null) =>
  block({ id, key: id ?? '', type: 'paragraph', content: { text } });

function EmailHarness({
  profile,
  blocks,
  options,
  onReady,
}: {
  profile: EditorProfile;
  blocks: EditorEmailBlock[];
  options?: EmailKitOptions;
  onReady(editor: IEditor): void;
}) {
  const [features] = useState(() => emailKit(profile, [], options));
  const [ui] = useState(() => collectUiContributions(features));
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
      {/* Below the text, so the bubble over a selection never covers them. */}
      {editor && <EditorToolbar editor={editor} items={ui.toolbar} />}
      {editor && <LinkVariablePicker editor={editor} declarations={declared} />}
      {editor && <SlashMenu editor={editor} items={ui.slash} />}
      {editor && <BubbleMenu editor={editor} items={ui.bubble} container={root} />}
      {editor && <BlockAttributesMenu editor={editor} />}
    </div>
  );
}

async function mount(
  blocks: EditorEmailBlock[],
  { profile = fullProfile, options }: { profile?: EditorProfile; options?: EmailKitOptions } = {},
): Promise<IEditor> {
  let ready: IEditor | null = null;
  await render(<EmailHarness profile={profile} blocks={blocks} options={options} onReady={(e) => (ready = e)} />);
  return vi.waitFor(() => {
    if (!ready) throw new Error('the editor is not ready');
    return ready;
  });
}

const exported = (editor: IEditor) => toEmailBlocks(editor.getJSON());

function find(selector: string, text?: string): HTMLElement {
  const found = [...document.querySelectorAll<HTMLElement>(selector)].find(
    (element) => text === undefined || element.textContent?.includes(text),
  );
  if (!found) throw new Error(`nothing matches ${selector}${text ? ` holding "${text}"` : ''}`);
  return found;
}

/** Puts the caret at the end of the text `text` the editor shows. */
async function caretAfter(text: string): Promise<void> {
  const element = await vi.waitFor(() => find('[contenteditable=true] p, [contenteditable=true] [data-slot]', text));
  await userEvent.click(element);
  await userEvent.keyboard('{End}');
}

/** Opens the block menu once the last one has closed, and returns it. */
async function openBlockMenu(): Promise<HTMLElement> {
  await vi.waitFor(() => expect(document.querySelector('[role=menu]')).toBeNull());
  const trigger = await vi.waitFor(() => find('[data-slot=email-block-menu] [aria-label="Block actions"]'));
  await userEvent.click(trigger);
  return vi.waitFor(() => find('[role=menu]'));
}

async function chooseInBlockMenu(title: string): Promise<void> {
  const menu = await openBlockMenu();
  const item = [...menu.querySelectorAll<HTMLElement>('[role=menuitemradio]')].find(
    (candidate) => candidate.textContent === title,
  );
  if (!item) throw new Error(`the block menu offers no "${title}"`);
  await userEvent.click(item);
}

async function pickOption(trigger: HTMLElement): Promise<HTMLElement[]> {
  await userEvent.click(trigger);
  return vi.waitFor(() => {
    const options = [...document.querySelectorAll<HTMLElement>('[data-slot=combobox-item]')];
    if (options.length === 0) throw new Error('the picker is not open');
    return options;
  });
}

const marksOf = (editor: IEditor): NodeJSON['marks'][] =>
  (editor.getJSON().content ?? []).flatMap((node) => (node.content ?? []).map((child) => child.marks));

describe('the email kit', () => {
  it('offers in the slash menu only the kinds a mail-layout region holds', async () => {
    await mount([paragraph('')], { profile: emailProfile({ allow: MAIL_LAYOUT_KINDS }) });
    await userEvent.click(find('[contenteditable=true]'));
    await userEvent.keyboard('/');

    const menu = await vi.waitFor(() => find('[data-slot=slash-menu]'));
    expect([...menu.querySelectorAll('[data-slot=item-title]')].map((title) => title.textContent)).toEqual([
      'Text',
      'List',
      'Callout',
      'Divider',
      'Columns',
    ]);
  });

  it("chooses a button's link from the url variables only", async () => {
    const editor = await mount([block({ type: 'button', content: { label: 'Reset', href: '{{resetUrl}}' } })]);
    const picker = await vi.waitFor(() => find('[data-slot=email-button] [data-slot=url-variable-picker]'));
    expect(picker.textContent).toContain('Reset link');

    const options = await pickOption(picker);
    expect(options.map((option) => option.textContent)).toEqual(['Reset link', 'Help page']);
    await userEvent.click(options[1]);

    await vi.waitFor(() => expect(exported(editor)[0].content).toEqual({ label: 'Reset', href: '{{helpUrl}}' }));
  });

  it('links text to a url variable through the same picker', async () => {
    const editor = await mount([paragraph('Open the page')]);
    await caretAfter('Open the page');
    await userEvent.keyboard('{Shift>}{ArrowLeft}{ArrowLeft}{ArrowLeft}{ArrowLeft}{/Shift}');

    const picker = find('[data-slot=url-variable-picker][aria-label=Link]');
    const options = await pickOption(picker);
    expect(options.map((option) => option.textContent)).toEqual(['Reset link', 'Help page']);
    await userEvent.click(options[0]);

    await vi.waitFor(() => expect(exported(editor)[0].content).toEqual({ text: 'Open the [page]({{resetUrl}})' }));
  });

  it('toggles bold from the bubble menu and Mod-B, and italic from Mod-I', async () => {
    const editor = await mount([paragraph('Hello world')]);
    await caretAfter('Hello world');
    await userEvent.keyboard('{Shift>}{ArrowLeft}{ArrowLeft}{ArrowLeft}{ArrowLeft}{ArrowLeft}{/Shift}');

    const bold = await vi.waitFor(() => find('[data-slot=bubble-menu] [aria-label=Bold]'));
    await userEvent.click(bold);
    await vi.waitFor(() => expect(exported(editor)[0].content).toEqual({ text: 'Hello **world**' }));

    await userEvent.keyboard('{ControlOrMeta>}i{/ControlOrMeta}');
    await vi.waitFor(() => expect(marksOf(editor)[1]).toEqual([{ type: 'bold' }, { type: 'italic' }]));

    await userEvent.keyboard('{ControlOrMeta>}b{/ControlOrMeta}');
    await vi.waitFor(() => expect(exported(editor)[0].content).toEqual({ text: 'Hello _world_' }));
  });

  it('keeps marks off a code block, an html block and a button label', async () => {
    const blocks = [
      block({ id: 'c', key: 'c', type: 'code', content: { code: 'abc' } }),
      block({ id: 'h', key: 'h', type: 'html', content: { html: '<b>x</b>' } }),
      block({ id: 'b', key: 'b', type: 'button', content: { label: 'Go', href: '{{resetUrl}}' } }),
    ];
    const editor = await mount(blocks);

    for (const slot of ['email-code', 'email-html']) {
      await userEvent.click(await vi.waitFor(() => find(`[data-slot=${slot}]`)));
      await userEvent.keyboard('{End}{Shift>}{Home}{/Shift}');
      expect(editor.can('toggleBold')).toBe(false);
      await userEvent.keyboard('{ControlOrMeta>}b{/ControlOrMeta}{ControlOrMeta>}i{/ControlOrMeta}');
    }
    await userEvent.click(find('[aria-label="Button label"]'));
    await userEvent.keyboard('{ControlOrMeta>}a{/ControlOrMeta}{ControlOrMeta>}b{/ControlOrMeta}');

    expect(exported(editor)).toEqual(blocks);
    expect(JSON.stringify(editor.getJSON())).not.toContain('"marks"');
  });

  it('sets align, space after and tone on a paragraph from the block menu', async () => {
    const editor = await mount([paragraph('Hi there', 'p')]);
    await caretAfter('Hi there');

    await chooseInBlockMenu('Center');
    await chooseInBlockMenu('Large');
    await chooseInBlockMenu('Muted');

    await vi.waitFor(() =>
      expect(exported(editor)[0].attributes).toEqual({ align: 'center', spaceAfter: 'large', tone: 'muted' }),
    );
    const shown = find('[contenteditable=true] p', 'Hi there');
    expect(getComputedStyle(shown).textAlign).toBe('center');
  });

  it("sets a button's width from the block menu", async () => {
    const editor = await mount([
      paragraph('Before'),
      block({ type: 'button', content: { label: 'Go', href: '{{resetUrl}}' } }),
    ]);
    await caretAfter('Before');
    await userEvent.keyboard('{ArrowDown}');

    await chooseInBlockMenu('Full width');

    await vi.waitFor(() => expect(exported(editor)[1].attributes).toEqual({ width: 'full' }));
  });

  it("adds and removes a lane by the columns' ratio, keeping each block's id", async () => {
    const editor = await mount([
      block({
        id: 'cols',
        key: 'cols',
        type: 'columns',
        attributes: { ratio: [1, 1], spaceAfter: 'large' },
        lanes: [[paragraph('left', 'l')], [paragraph('right', 'r')]],
      }),
    ]);
    await caretAfter('left');

    await chooseInBlockMenu('1 : 1 : 1');
    await vi.waitFor(() => expect(exported(editor)[0].lanes).toHaveLength(3));
    expect(exported(editor)[0].attributes).toEqual({ ratio: [1, 1, 1], spaceAfter: 'large' });

    await chooseInBlockMenu('2 : 1');
    await vi.waitFor(() => expect(exported(editor)[0].lanes).toHaveLength(2));
    const [columns] = exported(editor);
    expect(columns.attributes).toEqual({ ratio: [2, 1], spaceAfter: 'large' });
    expect(columns.lanes?.map((lane) => lane.map(({ id, content }) => [id, content]))).toEqual([
      [['l', { text: 'left' }]],
      [['r', { text: 'right' }]],
    ]);
  });

  it('keeps a columns block out of a lane', async () => {
    const editor = await mount([block({ type: 'columns', lanes: [[paragraph('left')], [paragraph('right')]] })]);
    await caretAfter('left');

    expect(editor.can('insertEmailBlock', { kind: 'columns' })).toBe(false);
    expect(editor.run('insertEmailBlock', { kind: 'columns' })).toBe(false);
    editor.run('insertContent', {
      content: { type: 'emailColumns', content: [{ type: 'emailLane', content: [{ type: 'paragraph' }] }] },
    });

    const lanes = editor.getJSON().content?.flatMap((node) => node.content ?? []) ?? [];
    expect(lanes.filter((lane) => lane.type === 'emailLane').length).toBeGreaterThan(0);
    for (const lane of lanes) {
      expect((lane.content ?? []).map((child) => child.type)).not.toContain('emailColumns');
    }
  });

  it('keeps a list item out of the top level', async () => {
    const editor = await mount([paragraph('Lines')]);
    await caretAfter('Lines');

    editor.run('insertContent', { content: { type: 'emailListItem', content: [{ type: 'text', text: 'one' }] } });

    const types = editor.getJSON().content?.map((node) => node.type);
    expect(types).not.toContain('emailListItem');
  });

  it('keys every block it holds, so an added block exports with a key', async () => {
    const editor = await mount([paragraph('Hi')]);
    await caretAfter('Hi');
    await userEvent.keyboard('{Enter}More');

    await vi.waitFor(() => expect(exported(editor)).toHaveLength(2));
    const added = exported(editor)[1];
    expect([added.id, added.key !== '']).toEqual([null, true]);
  });

  it('deletes a block from the block menu, and disables Delete with its reason on a required block', async () => {
    const editor = await mount([paragraph('Keep me', 'kept'), paragraph('Drop me', 'dropped')], {
      options: { required: () => ['kept'] },
    });
    await caretAfter('Keep me');
    await openBlockMenu();
    const refused = find('[role=menuitem]', 'Delete');
    expect(refused.hasAttribute('data-disabled')).toBe(true);
    expect(refused.textContent).toContain('This block is required');
    await userEvent.keyboard('{Escape}');

    await caretAfter('Drop me');
    await openBlockMenu();
    await userEvent.click(find('[role=menuitem]', 'Delete'));

    await vi.waitFor(() => expect(exported(editor).map(({ id }) => id)).toEqual(['kept']));
  });

  it('changes no attribute and deletes no block in locked structure', async () => {
    await mount([paragraph('Hi', 'p')], { options: { structure: () => 'locked' } });
    await caretAfter('Hi');
    await openBlockMenu();

    const refused = find('[role=menuitem]', 'Delete');
    expect(refused.hasAttribute('data-disabled')).toBe(true);
    expect(refused.textContent).toContain('locked');
    expect(find('[role=menuitemradio]', 'Center').hasAttribute('data-disabled')).toBe(true);
  });

  it('refuses a custom feature whose block has no email codec, naming it', () => {
    const quote: EditorFeature = {
      id: 'quote',
      nodes: [{ name: 'quote', group: 'block', content: 'inline*' }],
    };
    expect(() => emailKit(fullProfile, [quote])).toThrow(
      expect.objectContaining({ code: 'editor.profile.no_email_codec', message: expect.stringContaining('"quote"') }),
    );
    expect(() => emailKit(fullProfile, [standardKit()])).toThrow(/"standard"/);

    const note: EditorFeature = {
      id: 'note',
      nodes: [{ name: 'note', group: 'block', content: 'inline*' }],
      codecs: [
        {
          node: 'note',
          toEmailBlock: () => block({ type: 'note' }),
          fromEmailBlock: (stored) => (stored.type === 'note' ? { type: 'note' } : null),
        },
      ],
    };
    expect(() => emailKit(fullProfile, [note])).not.toThrow();
  });
});
