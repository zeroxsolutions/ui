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

const textOf = (node: NodeJSON) => (node.content ?? []).map((child) => child.text ?? '').join('');

/** A custom block with an email codec, as a host's own feature adds one. */
const note: EditorFeature = {
  id: 'note',
  nodes: [{ name: 'note', group: 'block', content: 'inline*' }],
  codecs: [
    {
      node: 'note',
      toEmailBlock: (node) => ({
        id: typeof node.attrs?.id === 'string' ? node.attrs.id : null,
        key: String(node.attrs?.key ?? ''),
        type: 'note',
        attributes: {},
        content: { text: textOf(node) },
      }),
      fromEmailBlock: (stored) =>
        stored.type === 'note'
          ? {
              type: 'note',
              attrs: { id: stored.id, key: stored.key },
              content: [{ type: 'text', text: String(stored.content.text) }],
            }
          : null,
    },
  ],
};
const codecs = note.codecs ?? [];

function EmailHarness({
  profile,
  blocks,
  extra,
  options,
  onReady,
}: {
  profile: EditorProfile;
  blocks: EditorEmailBlock[];
  extra: EditorFeature[];
  options?: EmailKitOptions;
  onReady(editor: IEditor): void;
}) {
  const [features] = useState(() => emailKit(profile, extra, options));
  const [ui] = useState(() => collectUiContributions(features));
  const [editor, setEditor] = useState<IEditor | null>(null);
  const [root, setRoot] = useState<HTMLDivElement | null>(null);
  return (
    <div ref={setRoot} className="style-nova p-12">
      <Editor
        features={features}
        content={fromEmailBlocks(blocks, codecs)}
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
  {
    profile = fullProfile,
    options,
    extra = [],
  }: { profile?: EditorProfile; options?: EmailKitOptions; extra?: EditorFeature[] } = {},
): Promise<IEditor> {
  let ready: IEditor | null = null;
  await render(
    <EmailHarness profile={profile} blocks={blocks} extra={extra} options={options} onReady={(e) => (ready = e)} />,
  );
  return vi.waitFor(() => {
    if (!ready) throw new Error('the editor is not ready');
    return ready;
  });
}

const exported = (editor: IEditor) => toEmailBlocks(editor.getJSON(), codecs);

/** Pastes `html` at the caret, as the clipboard of another editor carries it. */
function pasteHtml(html: string): void {
  const data = new DataTransfer();
  data.setData('text/html', html);
  (document.activeElement ?? find('[contenteditable=true]')).dispatchEvent(
    new ClipboardEvent('paste', { clipboardData: data, bubbles: true, cancelable: true }),
  );
}

const buttonHtml = '<div data-type="emailButton" label="Go" href="{{resetUrl}}"></div>';
const typesOf = (editor: IEditor) => (editor.getJSON().content ?? []).map((node) => node.type);

function find(selector: string, text?: string): HTMLElement {
  const found = [...document.querySelectorAll<HTMLElement>(selector)].find(
    (element) => text === undefined || element.textContent?.includes(text),
  );
  if (!found) throw new Error(`nothing matches ${selector}${text ? ` holding "${text}"` : ''}`);
  return found;
}

/** Puts the caret at the end of the paragraph holding `text`. */
async function caretAfter(text: string): Promise<void> {
  const element = await vi.waitFor(() => find('[contenteditable=true] p', text));
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
    // Its name is its text, so it names both what it chooses and what it holds.
    expect([picker.getAttribute('aria-label'), picker.textContent]).toEqual([null, 'Button link: Reset link']);

    const options = await pickOption(picker);
    expect(options.map((option) => option.textContent)).toEqual(['Reset link', 'Help page']);
    await userEvent.click(options[1]);

    await vi.waitFor(() => expect(exported(editor)[0].content).toEqual({ label: 'Reset', href: '{{helpUrl}}' }));
  });

  it('links text to a url variable through the same picker', async () => {
    const editor = await mount([paragraph('Open the page')]);
    await caretAfter('Open the page');
    await userEvent.keyboard('{Shift>}{ArrowLeft}{ArrowLeft}{ArrowLeft}{ArrowLeft}{/Shift}');

    const picker = find('[data-slot=url-variable-picker][data-label=Link]');
    const options = await pickOption(picker);
    expect(options.map((option) => option.textContent)).toEqual(['Reset link', 'Help page']);
    await userEvent.click(options[0]);

    await vi.waitFor(() => expect(exported(editor)[0].content).toEqual({ text: 'Open the [page]({{resetUrl}})' }));
  });

  it('shows the link the caret is in, and removes it whole', async () => {
    const editor = await mount([paragraph('Open the [page]({{resetUrl}})')]);
    await caretAfter('Open the page');
    await userEvent.keyboard('{ArrowLeft}{ArrowLeft}');

    await vi.waitFor(() =>
      expect(find('[data-slot=url-variable-picker][data-label=Link]').textContent).toBe('Link: Reset link'),
    );
    await userEvent.click(find('[data-slot=editor-toolbar] [aria-label="Remove link"]'));

    await vi.waitFor(() => expect(exported(editor)[0].content).toEqual({ text: 'Open the page' }));
    expect(find('[data-slot=url-variable-picker][data-label=Link]').textContent).toBe('Link');
  });

  it('toggles italic from the bubble menu', async () => {
    const editor = await mount([paragraph('Hello world')]);
    await caretAfter('Hello world');
    await userEvent.keyboard('{Shift>}{ArrowLeft}{ArrowLeft}{ArrowLeft}{ArrowLeft}{ArrowLeft}{/Shift}');

    await userEvent.click(await vi.waitFor(() => find('[data-slot=bubble-menu] [aria-label=Italic]')));

    await vi.waitFor(() => expect(exported(editor)[0].content).toEqual({ text: 'Hello _world_' }));
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

  it('keeps marks off a code block and an html block', async () => {
    const blocks = [
      block({ id: 'c', key: 'c', type: 'code', content: { code: 'abc' } }),
      block({ id: 'h', key: 'h', type: 'html', content: { html: '<b>x</b>' } }),
    ];
    const editor = await mount(blocks);

    for (const slot of ['email-code', 'email-html']) {
      await userEvent.click(await vi.waitFor(() => find(`[data-slot=${slot}]`)));
      await userEvent.keyboard('{End}{Shift>}{Home}{/Shift}');
      expect(editor.can('toggleBold')).toBe(false);
      await userEvent.keyboard('{ControlOrMeta>}b{/ControlOrMeta}{ControlOrMeta>}i{/ControlOrMeta}');
    }

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

  it('acts on a button whose label field holds the focus', async () => {
    const editor = await mount([
      paragraph('Before'),
      block({ type: 'button', content: { label: 'Go', href: '{{resetUrl}}' } }),
    ]);
    await caretAfter('Before');
    await userEvent.click(find('[aria-label="Button label"]'));

    await chooseInBlockMenu('Full width');

    await vi.waitFor(() => expect(exported(editor)[1].attributes).toEqual({ width: 'full' }));
    expect(exported(editor)[0].attributes).toEqual({});
  });

  it('moves the blocks of a removed lane into the last lane kept', async () => {
    const editor = await mount([
      block({
        id: 'cols',
        key: 'cols',
        type: 'columns',
        attributes: { ratio: [1, 1, 1] },
        lanes: [[paragraph('left', 'l')], [paragraph('middle', 'm')], [paragraph('right', 'r')]],
      }),
    ]);
    await caretAfter('left');

    await chooseInBlockMenu('1 : 1');

    await vi.waitFor(() => expect(exported(editor)[0].lanes).toHaveLength(2));
    expect(exported(editor)[0].lanes?.map((lane) => lane.map(({ id, content }) => [id, content]))).toEqual([
      [['l', { text: 'left' }]],
      [
        ['m', { text: 'middle' }],
        ['r', { text: 'right' }],
      ],
    ]);
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

  it('adds no block of a kind the profile leaves out, while a full profile takes it', async () => {
    const layout = await mount([paragraph('Header')], { profile: emailProfile({ allow: MAIL_LAYOUT_KINDS }) });
    await caretAfter('Header');
    pasteHtml(buttonHtml);
    expect(typesOf(layout)).not.toContain('emailButton');

    const full = await mount([paragraph('Body')]);
    await caretAfter('Body');
    pasteHtml(buttonHtml);
    await vi.waitFor(() => expect(typesOf(full)).toContain('emailButton'));
  });

  it('opens a stored mail layout holding a button in a lane', async () => {
    const stored = [
      block({
        id: 'cols',
        key: 'cols',
        type: 'columns',
        lanes: [
          [block({ id: 'b', key: 'b', type: 'button', content: { label: 'Go', href: '{{resetUrl}}' } })],
          [paragraph('right', 'r')],
        ],
      }),
    ];
    const editor = await mount(stored, { profile: emailProfile({ allow: MAIL_LAYOUT_KINDS }) });

    expect(exported(editor)).toEqual(stored);
  });

  it("keys a custom block, takes the host's id for it, and lets a lane hold it", async () => {
    const editor = await mount(
      [
        block({ type: 'columns', lanes: [[paragraph('left')], [paragraph('right')]] }),
        block({ type: 'note', content: { text: 'Hi' } }),
      ],
      { extra: [note] },
    );

    const added = exported(editor)[1];
    expect(added.key).not.toBe('');
    expect(editor.run('assignBlockIds', { ids: { [added.key]: 'n1' } })).toBe(true);
    expect(exported(editor)[1]).toMatchObject({ id: 'n1', key: added.key, type: 'note' });

    await caretAfter('left');
    editor.run('insertContent', { content: { type: 'note', content: [{ type: 'text', text: 'In a lane' }] } });
    await vi.waitFor(() =>
      expect(exported(editor)[0].lanes?.[0].map(({ type, content }) => [type, content])).toContainEqual([
        'note',
        { text: 'In a lane' },
      ]),
    );
  });

  it('refuses a custom feature with an inline node or a mark', () => {
    const chip: EditorFeature = { id: 'chip', nodes: [{ name: 'chip', group: 'inline', atom: true }] };
    const shout: EditorFeature = { id: 'shout', marks: [{ name: 'shout', htmlTag: 'mark' }] };
    expect(() => emailKit(fullProfile, [chip])).toThrow(
      expect.objectContaining({ code: 'editor.profile.no_email_codec', message: expect.stringContaining('"chip"') }),
    );
    expect(() => emailKit(fullProfile, [shout])).toThrow(
      expect.objectContaining({ code: 'editor.profile.no_email_codec', message: expect.stringContaining('"shout"') }),
    );
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

    expect(() => emailKit(fullProfile, [note])).not.toThrow();
  });
});
