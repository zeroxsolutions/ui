import { useState, type ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { page, userEvent } from 'vitest/browser';
import type { IEditor } from '@zeroxsolutions/editor-core/document/core/index';
import {
  emailProfile,
  toEmailBlocks,
  validate,
  type EditorEmailBlock,
  type EditorProfile,
  type ProfileProblem,
  type VariableDeclaration,
} from '@zeroxsolutions/editor-core/profiles/index';
import {
  createEmailRenderer,
  type EmailTheme,
  type RenderEmailInput,
} from '@zeroxsolutions/editor-core/template/email/index';
import '../../../../../../test/nova-style.css';
import '../../styles.css';
import {
  EmailEditor,
  type EmailEditorProps,
  type EmailPreviewInput,
  type EmailPreviewProps,
  type EmailPreviewRenderer,
} from './email-editor';
import { DEFAULT_PROFILE_MESSAGES, type ProfileEditorMessages } from '../messages';

const declared: VariableDeclaration[] = [
  { name: 'name', type: 'string', label: 'Name', sampleValue: 'Lan' },
  { name: 'resetUrl', type: 'url', label: 'Reset link', sampleValue: 'https://example.test/reset' },
];

const profile = emailProfile({ variables: declared });

const theme: EmailTheme = {
  colors: {
    background: '#FFFFFF',
    foreground: '#09090B',
    primary: '#007A55',
    primaryForeground: '#ECFDF5',
    muted: '#F4F4F5',
    mutedForeground: '#63636D',
    border: '#E4E4E7',
  },
  radius: 10,
  font: { family: 'Inter', fallback: 'Arial, Helvetica, sans-serif' },
};

const layoutProps = {
  logo: { url: 'https://cdn.example.test/logo@2x.png', alt: 'Example', width: 120 },
  footer: ['Example Company Limited.'],
};

const previewInput = { subject: 'Hello', preheader: null, locale: 'vi', layoutProps } satisfies EmailPreviewInput;

const sampled = {
  variables: { name: 'Lan', resetUrl: 'https://example.test/reset' },
  variableTypes: { name: 'string', resetUrl: 'url' },
} as const;

/** The blocks a render takes, a key standing in for each missing id. */
function withIds(blocks: readonly EditorEmailBlock[]): RenderEmailInput<unknown>['blocks'] {
  return blocks.map(({ lanes, ...block }) => ({
    ...block,
    id: block.id ?? block.key,
    ...(lanes ? { lanes: lanes.map(withIds) } : {}),
  }));
}

const paragraph = (text: string, id: string | null = null): EditorEmailBlock => ({
  id,
  key: id ?? '',
  type: 'paragraph',
  attributes: {},
  content: { text },
});

interface Probe {
  editor: IEditor | null;
  reported: EditorEmailBlock[][];
  validated: ProfileProblem[][];
  blurs: number;
  /** Hands the editor a new value, as a host loading another locale does. */
  load(value: EditorEmailBlock[]): void;
  /** Changes what the host draws beside each block. */
  adorn(adornment: (id: string | null, key: string) => ReactNode): void;
  /** Hands the editor another profile, as a host whose declarations changed does. */
  declare(profile: EditorProfile): void;
  /** Turns read-only on or off, as a host opening a draft does. */
  lock(readOnly: boolean): void;
}

interface HarnessProps {
  profile: EditorProfile;
  messages?: Partial<ProfileEditorMessages>;
  readOnly?: boolean;
  required?: readonly string[];
  structure?: 'free' | 'locked';
  preview?: { renderer: EmailPreviewRenderer; input: EmailPreviewInput };
  renderBlockAdornment?: EmailEditorProps['renderBlockAdornment'];
  initial: EditorEmailBlock[];
  probe: Probe;
}

/** A host that stores what the editor reports and hands it back as the value, as travel's rows do. */
function Host({
  initial,
  probe,
  renderBlockAdornment,
  profile: first,
  preview,
  readOnly: locked,
  ...props
}: HarnessProps) {
  const [value, setValue] = useState(initial);
  const [current, setProfile] = useState(first);
  probe.declare = setProfile;
  const [readOnly, setReadOnly] = useState(locked);
  probe.lock = setReadOnly;
  const [adornment, setAdornment] = useState(() => renderBlockAdornment);
  probe.load = setValue;
  probe.adorn = (next) => setAdornment(() => next);
  const previewProps: EmailPreviewProps = preview ? { renderer: preview.renderer, previewInput: preview.input } : {};
  return (
    <div className="style-nova p-12">
      <EmailEditor
        {...props}
        {...previewProps}
        label="Body"
        readOnly={readOnly}
        profile={current}
        value={value}
        renderBlockAdornment={adornment}
        onChange={(blocks) => {
          probe.reported.push(blocks);
          setValue(blocks);
        }}
        onValidate={(problems) => probe.validated.push(problems)}
        onBlur={() => (probe.blurs += 1)}
        onReady={(editor) => (probe.editor = editor)}
      />
      <button type="button">Elsewhere</button>
    </div>
  );
}

async function mount(
  initial: EditorEmailBlock[],
  props: Omit<HarnessProps, 'initial' | 'probe' | 'profile'> & { profile?: EditorProfile } = {},
): Promise<Probe & { editor: IEditor }> {
  const probe: Probe = {
    editor: null,
    reported: [],
    validated: [],
    blurs: 0,
    load: () => {},
    adorn: () => {},
    declare: () => {},
    lock: () => {},
  };
  await render(<Host profile={profile} {...props} initial={initial} probe={probe} />);
  await vi.waitFor(() => {
    if (!probe.editor) throw new Error('the editor is not ready');
  });
  return probe as Probe & { editor: IEditor };
}

function find(selector: string, text?: string): HTMLElement {
  const found = [...document.querySelectorAll<HTMLElement>(selector)].find(
    (element) => text === undefined || element.textContent?.includes(text),
  );
  if (!found) throw new Error(`nothing matches ${selector}${text ? ` holding "${text}"` : ''}`);
  return found;
}

async function caretAfter(text: string): Promise<void> {
  const element = await vi.waitFor(() => find('[contenteditable=true] p', text));
  await userEvent.click(element);
  await userEvent.keyboard('{End}');
}

const last = <T,>(list: T[]): T | undefined => list[list.length - 1];

/** The renderer's HTML in a preview frame, without the policy and the measuring script the preview adds. */
function rendered(frame: HTMLIFrameElement): string {
  return frame.srcdoc
    .replace(/<meta http-equiv="Content-Security-Policy" content="[^"]*">/, '')
    .replace(/<script nonce="[0-9a-f]+">[\s\S]*?<\/script>/, '');
}

/** Shows the grip of the paragraph holding `text`, or of the block `selector` names, as a pointer over it does. */
async function gripOf(text: string, selector = '[contenteditable=true] p'): Promise<HTMLElement> {
  await userEvent.hover(await vi.waitFor(() => find(selector, text)));
  return vi.waitFor(() => {
    const grip = find('.drag-handle');
    if (grip.classList.contains('hide')) throw new Error('the grip is hidden');
    return grip;
  });
}

/** Opens the block menu from the grip of the paragraph holding `text`, or of the block `selector` names. */
/** A button keyed b1 labelled Reset, linked to the reset url. */
const button = (): EditorEmailBlock => ({
  id: 'b1',
  key: 'b1',
  type: 'button',
  attributes: {},
  content: { label: 'Reset', href: '{{resetUrl}}' },
});

/** Picks `label` from the toolbar's variable menu. */
async function pickVariable(label: string): Promise<void> {
  await userEvent.click(find('[data-slot=variable-menu]'));
  await userEvent.click(await vi.waitFor(() => find('[data-slot=combobox-item]', label)));
}

async function openBlockMenu(text: string, selector?: string): Promise<void> {
  await userEvent.click(await gripOf(text, selector));
  await expect.element(page.getByRole('menu', { name: 'Block actions' })).toBeVisible();
}

const exportedOf = (editor: IEditor) => toEmailBlocks(editor.getJSON());

describe('EmailEditor', () => {
  it('loads its value and reports each edit as blocks', async () => {
    const probe = await mount([paragraph('Hello', 'p1')]);
    await caretAfter('Hello');
    await userEvent.keyboard(' there');

    await vi.waitFor(() =>
      expect(last(probe.reported)?.map(({ id, content }) => [id, content])).toEqual([['p1', { text: 'Hello there' }]]),
    );
  });

  it('loads a value the host changes, and does not reload the one it reported', async () => {
    const probe = await mount([paragraph('Hello', 'p1')]);
    await caretAfter('Hello');
    // ProseMirror takes a caret at the start of the document within 200ms of a focus event for the browser's own
    // reset and puts its last selection back, so a slow runner's Home could land the text at the end.
    await userEvent.keyboard('{End}{ArrowLeft}{ArrowLeft}{ArrowLeft}abc');
    // Each reported value came back as the value; a reload would have moved the caret out of the word.
    await vi.waitFor(() => expect(probe.editor.getText()).toBe('Heabcllo'));

    probe.load([paragraph('Xin chao', 'p1')]);
    await vi.waitFor(() => expect(probe.editor.getText()).toBe('Xin chao'));
  });

  it('does not reload a value of the same content with its keys in another order', async () => {
    const probe = await mount([paragraph('Hello', 'p1')]);
    await caretAfter('Hello');
    await userEvent.keyboard('{End}{ArrowLeft}{ArrowLeft}{ArrowLeft}a');
    const reported = await vi.waitFor(() => {
      const blocks = last(probe.reported);
      expect(blocks?.[0].content).toEqual({ text: 'Heallo' });
      return blocks as EditorEmailBlock[];
    });

    const reversed = <T extends object>(object: T): T => Object.fromEntries(Object.entries(object).reverse()) as T;
    probe.load(reported.map((block) => reversed({ ...block, content: reversed(block.content) })));
    await userEvent.keyboard('b');
    await vi.waitFor(() => expect(probe.editor.getText()).toBe('Heabllo'));
  });

  it('does not reload a refetched copy of the same content whose saved blocks carry no keys', async () => {
    const probe = await mount([paragraph('Hello', 'p1')]);
    await caretAfter('Hello');
    await userEvent.keyboard('{End}{ArrowLeft}{ArrowLeft}{ArrowLeft}a');
    const reported = await vi.waitFor(() => {
      const blocks = last(probe.reported);
      expect(blocks?.[0].content).toEqual({ text: 'Heallo' });
      return blocks as EditorEmailBlock[];
    });

    probe.load(reported.map(({ key: _key, ...block }) => block as EditorEmailBlock));
    await userEvent.keyboard('b');
    await vi.waitFor(() => expect(probe.editor.getText()).toBe('Heabllo'));
  });

  it('tells the host when the focus leaves it, and not while it is in a popup the editor opened', async () => {
    const probe = await mount([paragraph('Hello')]);
    await caretAfter('Hello');
    await userEvent.click(find('[data-slot=variable-menu]'));
    const option = await vi.waitFor(() => find('[data-slot=combobox-item]', 'Reset link'));
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(probe.blurs).toBe(0);

    await userEvent.click(option);
    await vi.waitFor(() => expect(last(probe.reported)?.[0].content).toEqual({ text: 'Hello{{resetUrl}}' }));
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(probe.blurs).toBe(0);
    await userEvent.click(find('button', 'Elsewhere'));

    await vi.waitFor(() => expect(probe.blurs).toBe(1));
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(probe.blurs).toBe(1);
  });

  it('marks a problem in place within a second, with its message on hover and on focus', async () => {
    const probe = await mount([paragraph('Hello', 'p1')]);
    await caretAfter('Hello');
    await userEvent.keyboard('{Shift>}{Home}{/Shift}{Backspace}');

    const message = DEFAULT_PROFILE_MESSAGES.problem({ kind: 'text-empty', block: 'p1', field: 'text' });
    const marker = await vi.waitFor(() => find('[data-slot=email-problem-marker]'), { timeout: 1000 });
    const decorated = find('[contenteditable=true] [data-problem]');
    expect(document.getElementById(decorated.getAttribute('aria-describedby') ?? '')?.textContent).toBe(message);

    await userEvent.hover(marker);
    await vi.waitFor(() => expect(find('[data-slot=tooltip-content]').textContent).toBe(message));
    await userEvent.unhover(marker);
    await vi.waitFor(() => expect(document.querySelector('[data-slot=tooltip-content]')).toBeNull());

    marker.focus();
    await vi.waitFor(() => expect(find('[data-slot=tooltip-content]').textContent).toBe(message));
    expect(last(probe.validated)).toEqual(validate(last(probe.reported) ?? [], profile));
  });

  it('reaches each problem from the text with F8 and Shift+F8, and goes back to its block with Escape', async () => {
    const probe = await mount([paragraph('One', 'p1'), paragraph('', 'p2'), paragraph('Three {{nobody}}', 'p3')]);
    const markers = await vi.waitFor(() => {
      const found = [...document.querySelectorAll<HTMLElement>('[data-slot=email-problem-marker]')];
      expect(found).toHaveLength(2);
      return found;
    });
    await caretAfter('One');

    await userEvent.keyboard('{F8}');
    expect(document.activeElement).toBe(markers[0]);
    const empty = DEFAULT_PROFILE_MESSAGES.problem({ kind: 'text-empty', block: 'p2' });
    await vi.waitFor(() => expect(find('[data-slot=tooltip-content]').textContent).toBe(empty));
    await userEvent.keyboard('{F8}');
    expect(document.activeElement).toBe(markers[1]);
    await userEvent.keyboard('{Shift>}{F8}{/Shift}');
    expect(document.activeElement).toBe(markers[0]);

    await userEvent.keyboard('{Escape}');
    await vi.waitFor(() => expect(document.activeElement?.getAttribute('contenteditable')).toBe('true'));
    await userEvent.keyboard('Two');
    await vi.waitFor(() => expect(last(probe.reported)?.[1].content).toEqual({ text: 'Two' }));
    expect(probe.blurs).toBe(0);
  });

  it('marks the token a problem names, and validates once on mount', async () => {
    const probe = await mount([paragraph('Hi {{nobody}}', 'p1')]);

    await vi.waitFor(() => expect(probe.validated).toHaveLength(1));
    await new Promise((resolve) => setTimeout(resolve, 400));
    expect(probe.validated).toHaveLength(1);
    expect(probe.validated[0]).toEqual([{ kind: 'variable-undeclared', block: 'p1', field: 'text', name: 'nobody' }]);
    const token = await vi.waitFor(() => find('[contenteditable=true] [data-problem]'));
    expect(token.closest('p')).not.toBe(token);
    expect(token.textContent).toContain('nobody');
  });

  it('reads the declarations again when the profile changes them', async () => {
    const probe = await mount([paragraph('Hi {{name}}', 'p1')]);
    await vi.waitFor(() => expect(find('[contenteditable=true] p').textContent).toContain('Name'));

    probe.declare(emailProfile({ variables: [{ ...declared[0], label: 'First name' }, declared[1]] }));
    await vi.waitFor(() => expect(find('[contenteditable=true] p').textContent).toContain('First name'));
  });

  it('draws the adornment beside each block, lanes included, and redraws it when the host does', async () => {
    const lane = (id: string, text: string) => [paragraph(text, id)];
    const probe = await mount(
      [
        paragraph('Top', 'p1'),
        {
          id: 'c1',
          key: 'c1',
          type: 'columns',
          attributes: { ratio: [1, 1] },
          content: {},
          lanes: [lane('l1', 'Left'), lane('l2', 'Right')],
        },
      ],
      { renderBlockAdornment: (id) => <span>badge {id}</span> },
    );

    await vi.waitFor(() =>
      expect([...document.querySelectorAll('[data-slot=email-block-adornment]')].map((row) => row.textContent)).toEqual(
        ['badge p1', 'badge c1', 'badge l1', 'badge l2'],
      ),
    );
    probe.adorn((id) => <span>stale {id}</span>);
    await vi.waitFor(() => expect(find('[data-slot=email-block-adornment]').textContent).toBe('stale p1'));
  });

  it('marks the block the grip selected while its menu is open', async () => {
    await mount([paragraph('First', 'p1'), paragraph('Second', 'p2')]);
    await openBlockMenu('Second');

    expect(find('[contenteditable=true] p', 'Second').classList).toContain('ProseMirror-selectednode');
    expect(find('[contenteditable=true] p', 'First').classList).not.toContain('ProseMirror-selectednode');
  });

  it("disables a required block's Delete with its reason", async () => {
    await mount([paragraph('Keep me', 'kept')], { required: ['kept'] });
    await openBlockMenu('Keep me');

    const refused = page.getByRole('menuitem', { name: 'Delete' });
    await expect.element(refused).toBeDisabled();
    await userEvent.hover(refused, { force: true });
    await expect.element(page.getByText('This block is required')).toBeVisible();
  });

  it('offers no insert and no remove in locked structure', async () => {
    await mount([paragraph('Hi', 'p1')], { structure: 'locked' });
    await caretAfter('Hi');
    await userEvent.keyboard(' /');

    await vi.waitFor(() => expect(find('[contenteditable=true] p').textContent).toBe('Hi /'));
    expect(document.querySelector('[data-slot=slash-menu]')).toBeNull();
    await openBlockMenu('Hi /');
    await expect.element(page.getByRole('menuitem', { name: 'Delete' })).toBeDisabled();
  });

  it('draws an undeclared variable chip in the destructive token, with no underline', async () => {
    await mount([paragraph('Hi {{ghost}}', 'p1')]);

    const chip = await vi.waitFor(() => find('[contenteditable=true] [data-slot=variable][data-problem]'));
    const host = await vi.waitFor(() => {
      const marked = chip.closest<HTMLElement>('[aria-describedby]');
      if (!marked) throw new Error('the chip is not marked');
      return marked;
    });
    expect(host.className).not.toContain('underline');
    expect(getComputedStyle(chip).textDecorationLine).toBe('none');
    const style = getComputedStyle(chip);
    expect(style.borderTopColor).toBe(style.color);
  });

  it('marks a pasted heading, whose structure the email cannot carry, with one problem', async () => {
    const probe = await mount([paragraph('Body', 'p1')]);
    await caretAfter('Body');
    const data = new DataTransfer();
    // Between two paragraphs, so the heading is pasted whole rather than joined to the line it lands in.
    data.setData('text/html', '<p>Before</p><h1>Hi</h1><p>After</p>');
    document.activeElement?.dispatchEvent(
      new ClipboardEvent('paste', { clipboardData: data, bubbles: true, cancelable: true }),
    );

    await vi.waitFor(() => expect(last(probe.validated)?.map(({ kind }) => kind)).toEqual(['block-not-carried']));
    await vi.waitFor(() => expect(document.querySelectorAll('[data-slot=email-problem-marker]')).toHaveLength(1));
    expect(exportedOf(probe.editor).map(({ type, content }) => [type, content])).toContainEqual([
      'paragraph',
      { text: 'Hi' },
    ]);
  });

  it("previews the renderer's HTML for the blocks, keys standing in for ids, with the sample values", async () => {
    const renderer = createEmailRenderer({ theme });
    const probe = await mount([paragraph('Hi {{name}}', 'p1')], { preview: { renderer, input: previewInput } });
    await caretAfter('Hi');
    await userEvent.keyboard('{Enter}More');

    const frame = await vi.waitFor(() => {
      const found = find('iframe[data-slot=email-preview]') as HTMLIFrameElement;
      expect(found.srcdoc).toContain('More');
      return found;
    });
    const expected = renderer.render({ ...previewInput, ...sampled, blocks: withIds(last(probe.reported) ?? []) });
    expect(rendered(frame)).toBe(expected.html);
    // Scripts run under a policy that admits the measuring script alone, at an opaque origin.
    expect(frame.getAttribute('sandbox')).toBe('allow-scripts');
  });

  it('previews a columns block, keys standing in for the ids of its lanes, and lists the render problems', async () => {
    const renderer = createEmailRenderer({ theme });
    const lanes = [[paragraph('Left')], [paragraph('Right {{nobody}}')]];
    const columns: EditorEmailBlock = {
      id: 'c1',
      key: 'c1',
      type: 'columns',
      attributes: { ratio: [1, 1] },
      content: {},
      lanes,
    };
    const probe = await mount([columns], { preview: { renderer, input: previewInput } });

    const frame = await vi.waitFor(() => find('iframe[data-slot=email-preview]') as HTMLIFrameElement);
    const blocks = exportedOf(probe.editor);
    const laneIds = (blocks[0].lanes ?? []).flat().map(({ id, key }) => [id, key !== '']);
    expect(laneIds).toEqual([
      [null, true],
      [null, true],
    ]);
    const expected = renderer.render({ ...previewInput, ...sampled, blocks: withIds(blocks) });
    expect(rendered(frame)).toBe(expected.html);
    expect(expected.problems.length).toBeGreaterThan(0);
    // In words, at the place of its block in the document: the columns, Left, then Right.
    expect(find('[data-slot=email-preview-problems]').textContent).toContain(
      DEFAULT_PROFILE_MESSAGES.renderProblem({ kind: 'variable-missing', name: 'nobody', blockId: 'x' }, 3),
    );
    expect(find('[data-slot=email-preview-problems]').textContent).not.toContain('variable-missing');
  });

  it('lists two render problems that read the same as two lines', async () => {
    const renderer = createEmailRenderer({ theme });
    const footer = ['f1', 'f2'].map((id) => ({
      id,
      type: 'paragraph',
      attributes: {},
      content: { text: '{{unsub}}' },
    }));
    const input = { ...previewInput, regions: { footer: { blocks: footer, variables: {}, variableTypes: {} } } };
    const errors = vi.spyOn(console, 'error');
    await mount([paragraph('Hello', 'p1')], { preview: { renderer, input } });

    const line = DEFAULT_PROFILE_MESSAGES.renderProblem({
      kind: 'variable-missing',
      name: 'unsub',
      blockId: 'f1',
      region: 'footer',
    });
    await vi.waitFor(() => {
      const lines = [...find('[data-slot=email-preview-problems]').querySelectorAll('li')].map((li) => li.textContent);
      expect(lines).toEqual([line, line]);
    });
    expect(errors.mock.calls.flat().join(' ')).not.toContain('same key');
    errors.mockRestore();
  });

  it('validates a bounded number of times under a host that re-renders on each report', async () => {
    let calls = 0;
    const renderer = createEmailRenderer({ theme });
    function Restless() {
      const [, setProblems] = useState<ProfileProblem[]>([]);
      return (
        <EmailEditor
          label="Body"
          profile={emailProfile({ variables: declared })}
          value={[paragraph('', 'p1')]}
          renderer={renderer}
          previewInput={{ subject: 'Hello', preheader: null, locale: 'vi', layoutProps }}
          onValidate={(problems) => {
            calls += 1;
            setProblems(problems);
          }}
        />
      );
    }
    await render(<Restless />);
    await vi.waitFor(() => expect(calls).toBe(1));
    await new Promise((resolve) => setTimeout(resolve, 800));
    expect(calls).toBe(1);
  });

  it('keeps the caret when the host assigns ids after a save', async () => {
    const probe = await mount([paragraph('Hello', 'p1')]);
    await caretAfter('Hello');
    await userEvent.keyboard('{Enter}More');
    const added = await vi.waitFor(() => {
      const block = last(probe.reported)?.[1];
      expect(block?.content).toEqual({ text: 'More' });
      return block as EditorEmailBlock;
    });

    await caretAfter('Hello');
    await userEvent.keyboard('{End}{ArrowLeft}{ArrowLeft}{ArrowLeft}');

    expect(probe.editor.run('assignBlockIds', { ids: { [added.key]: 'p2' } })).toBe(true);
    await vi.waitFor(() => expect(last(probe.reported)?.map(({ id }) => id)).toEqual(['p1', 'p2']));
    await userEvent.keyboard('!');

    await vi.waitFor(() => expect(last(probe.reported)?.[0].content).toEqual({ text: 'He!llo' }));
  });

  it("draws a problem in the host's words", async () => {
    await mount([paragraph('', 'p1')], { messages: { problem: () => 'Khoi trong' } });

    const marker = await vi.waitFor(() => find('[data-slot=email-problem-marker]'));
    expect(document.getElementById(marker.getAttribute('aria-describedby') ?? '')?.textContent).toBe('Khoi trong');
  });

  it("names the toolbar's controls and the slash menu's blocks in the host's words", async () => {
    await mount([paragraph('Hello', 'p1')], {
      messages: {
        bold: 'In dam',
        blocks: { ...DEFAULT_PROFILE_MESSAGES.blocks, divider: { title: 'Duong ke', description: 'Mot duong ke' } },
      },
    });
    await expect.element(page.getByRole('button', { name: 'In dam' })).toBeInTheDocument();
    await caretAfter('Hello');
    await userEvent.keyboard('{Enter}/');

    await vi.waitFor(() => expect(find('[data-slot=slash-menu]').textContent).toContain('Duong ke'));
  });

  it('is named by its label', async () => {
    await mount([paragraph('Hello', 'p1')]);

    await expect.element(page.getByRole('textbox', { name: 'Body' })).toBeInTheDocument();
  });

  it("unlocks and locks a button's label as read-only turns off and on, its link in the block menu", async () => {
    const button: EditorEmailBlock = {
      id: 'b1',
      key: 'b1',
      type: 'button',
      attributes: {},
      content: { label: 'Reset', href: '{{resetUrl}}' },
    };
    const probe = await mount([button], { readOnly: true });
    const field = page.getByRole('textbox', { name: 'Button label' });
    await expect.element(field).toHaveAttribute('aria-readonly', 'true');

    probe.lock(false);
    await expect.element(field).not.toHaveAttribute('aria-readonly');
    await userEvent.click(field);
    await userEvent.keyboard('{End} now');
    await vi.waitFor(() =>
      expect(last(probe.reported)?.[0].content).toEqual({ label: 'Reset now', href: '{{resetUrl}}' }),
    );
    await openBlockMenu('', '[data-slot=email-button]');
    await userEvent.click(page.getByRole('menuitem', { name: 'Link' }));
    const popover = page.getByRole('dialog', { name: 'Link' });
    await expect.element(popover.getByRole('textbox', { name: 'Link' }).getByText('Reset link')).toBeVisible();
    await userEvent.keyboard('{Escape}');
    await expect.element(popover).not.toBeInTheDocument();

    probe.lock(true);
    await expect.element(field).toHaveAttribute('aria-readonly', 'true');
  });

  it("inserts the toolbar's variable into the button label that held the focus", async () => {
    const button: EditorEmailBlock = {
      id: 'b1',
      key: 'b1',
      type: 'button',
      attributes: {},
      content: { label: 'Reset', href: '{{resetUrl}}' },
    };
    const probe = await mount([paragraph('Hello', 'p1'), button]);
    const field = page.getByRole('textbox', { name: 'Button label' });
    await userEvent.click(field);
    await userEvent.keyboard('{End}');

    await userEvent.click(find('[data-slot=variable-menu]'));
    await userEvent.click(await vi.waitFor(() => find('[data-slot=combobox-item]', 'Reset link')));

    await vi.waitFor(() =>
      expect(last(probe.reported)?.[1].content).toEqual({ label: 'Reset{{resetUrl}}', href: '{{resetUrl}}' }),
    );
    expect(last(probe.reported)?.[0].content).toEqual({ text: 'Hello' });
    await expect.element(field.getByText('Reset link')).toHaveAttribute('data-slot', 'variable');
  });

  it('forgets the label once the author leaves it, so a later pick lands in the document', async () => {
    const probe = await mount([paragraph('Hello', 'p1'), button()]);
    const field = page.getByRole('textbox', { name: 'Button label' });
    await userEvent.click(field);
    await userEvent.keyboard('{End}');
    await pickVariable('Name');
    await vi.waitFor(() =>
      expect(last(probe.reported)?.[1].content).toEqual({ label: 'Reset{{name}}', href: '{{resetUrl}}' }),
    );

    await caretAfter('Hello');
    await userEvent.click(page.getByRole('toolbar').getByRole('button', { name: 'Bold', exact: true }));
    await pickVariable('Reset link');

    await vi.waitFor(() => expect(last(probe.reported)?.[0].content).toEqual({ text: 'Hello{{resetUrl}}' }));
    expect(last(probe.reported)?.[1].content).toEqual({ label: 'Reset{{name}}', href: '{{resetUrl}}' });
  });

  it("inserts the toolbar's variable into the link popover's href field, which stays open", async () => {
    const probe = await mount([button()]);
    await openBlockMenu('', '[data-slot=email-button]');
    await userEvent.click(page.getByRole('menuitem', { name: 'Link' }));
    const popover = page.getByRole('dialog', { name: 'Link' });
    const href = popover.getByRole('textbox', { name: 'Link' });
    await expect.element(href).toHaveFocus();
    await userEvent.keyboard('{ControlOrMeta>}a{/ControlOrMeta}{Backspace}https://x.test/?n=');

    await pickVariable('Name');
    await expect.element(href.getByText('Name')).toHaveAttribute('data-slot', 'variable');
    await userEvent.click(popover.getByRole('button', { name: 'Apply' }));

    await vi.waitFor(() =>
      expect(last(probe.reported)?.[0].content).toEqual({ label: 'Reset', href: 'https://x.test/?n={{name}}' }),
    );
  });

  it('refuses typing and opens no block menu when read-only', async () => {
    const probe = await mount([paragraph('Hello', 'p1')], { readOnly: true });
    await userEvent.type(page.getByRole('textbox', { name: 'Body' }), ' there');
    await userEvent.keyboard('/');

    await new Promise((resolve) => setTimeout(resolve, 400));
    expect(probe.reported).toEqual([]);
    expect(probe.editor.getText()).toBe('Hello');
    await userEvent.hover(find('[data-editor=document] p', 'Hello'));
    expect(document.querySelector('.drag-handle:not(.hide)')).toBeNull();
    expect(document.querySelector('[role=menu]')).toBeNull();
    expect(document.querySelector('[data-slot=slash-menu]')).toBeNull();
    expect(document.querySelector('[data-slot=editor-toolbar]')).toBeNull();
  });
});

describe('EmailEditor frame', () => {
  // The browser's own viewport, which a spec here changes and the next spec must not inherit.
  const initial = { width: window.innerWidth, height: window.innerHeight };
  afterEach(async () => {
    await page.viewport(initial.width, initial.height);
  });

  const withPreview = () => ({ preview: { renderer: createEmailRenderer({ theme }), input: previewInput } });

  it.each([
    [1280, 800],
    [375, 800],
  ])('tabs between the editor and the preview at %ipx', async (width, height) => {
    await page.viewport(width, height);
    await mount([paragraph('Hello', 'p1')], withPreview());

    await expect.element(page.getByRole('tab', { name: 'Edit' })).toHaveAttribute('aria-selected', 'true');
    await expect.element(page.getByRole('textbox', { name: 'Body' })).toBeVisible();
    await expect.element(page.getByTitle('Email preview')).not.toBeVisible();

    await userEvent.click(page.getByRole('tab', { name: 'Preview' }));
    await expect.element(page.getByTitle('Email preview')).toBeVisible();
    await expect.element(page.elementLocator(find('[contenteditable=true]'))).not.toBeVisible();
  });

  it('keeps the editor, its text and its caret across the tabs', async () => {
    const probe = await mount([paragraph('Hello', 'p1')], withPreview());
    const surface = find('[contenteditable=true]');
    await caretAfter('Hello');
    await userEvent.keyboard(' there{ArrowLeft}{ArrowLeft}{ArrowLeft}{ArrowLeft}{ArrowLeft}{ArrowLeft}');

    await userEvent.click(page.getByRole('tab', { name: 'Preview' }));
    await userEvent.click(page.getByRole('tab', { name: 'Edit' }));

    expect(find('[contenteditable=true]')).toBe(surface);
    probe.editor.focus();
    await vi.waitFor(() => expect(document.activeElement).toBe(surface));
    await userEvent.keyboard('!');
    await vi.waitFor(() => expect(last(probe.reported)?.[0].content).toEqual({ text: 'Hello! there' }));
  });

  it("holds only the tabs in the toolbar's row on the Preview tab, and the toolbar back on Edit", async () => {
    await mount([paragraph('Hello', 'p1')], withPreview());

    await userEvent.click(page.getByRole('tab', { name: 'Preview' }));
    await expect.element(page.getByTitle('Email preview')).toBeVisible();
    expect(document.querySelector('[role=toolbar]')).toBeNull();
    expect(find('[data-slot=email-editor-bar]').querySelectorAll('button:not([role=tab])')).toHaveLength(0);

    await userEvent.click(page.getByRole('tab', { name: 'Edit' }));
    const toolbar = page.getByRole('toolbar');
    await expect.element(toolbar.getByRole('button', { name: 'Bold' })).toBeEnabled();
    await expect.element(toolbar.getByRole('combobox', { name: 'Variable', exact: true })).toBeEnabled();
  });

  const frame = () => find('iframe[data-slot=email-preview]') as HTMLIFrameElement;

  const previewAt = async (width: number) => {
    await page.viewport(width, 800);
    await mount([paragraph('Hello', 'p1')], withPreview());
    await userEvent.click(page.getByRole('tab', { name: 'Preview' }));
    return vi.waitFor(() => {
      expect(frame().offsetWidth).toBeGreaterThan(0);
      return frame().offsetWidth;
    });
  };

  // The email's narrow-screen rules apply at 600px and under.
  it("draws the email at the editor's own width, past the narrow-screen breakpoint on a wide page", async () => {
    expect(await previewAt(1280)).toBeGreaterThan(600);
  });

  it('draws the email under the narrow-screen breakpoint on a phone, unscaled and inside the page', async () => {
    const width = await previewAt(375);

    expect(width).toBeLessThan(375);
    expect(frame().getBoundingClientRect().width).toBe(width);
    expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(375);
  });

  it('grows the frame with the email, running only its own measuring script', async () => {
    const probe = await mount([paragraph('Hello', 'p1')], withPreview());
    await userEvent.click(page.getByRole('tab', { name: 'Preview' }));
    expect(frame().getAttribute('sandbox')).toBe('allow-scripts');
    expect(frame().srcdoc).toMatch(
      /<meta http-equiv="Content-Security-Policy" content="script-src 'nonce-[0-9a-f]+'">/,
    );
    const first = await vi.waitFor(() => {
      const height = parseFloat(frame().style.height);
      expect(height).toBeGreaterThan(0);
      return height;
    });

    probe.load(['One', 'Two', 'Three', 'Four', 'Five'].map((text, index) => paragraph(text, `p${index}`)));
    await vi.waitFor(() => expect(parseFloat(frame().style.height)).toBeGreaterThan(first));
  });

  it("answers the email's dark rules in a dark theme, and its light ones once the theme turns light", async () => {
    const dark = { ...theme.colors, background: '#18181B' };
    const root = document.documentElement;
    root.classList.add('dark');
    try {
      await mount([paragraph('Hello', 'p1')], {
        preview: { renderer: createEmailRenderer({ theme: { ...theme, dark } }), input: previewInput },
      });
      await userEvent.click(page.getByRole('tab', { name: 'Preview' }));
      await vi.waitFor(() => expect(frame().srcdoc).toContain('@media all{.zx-body{background:#18181B'));
      expect(frame().style.colorScheme).toBe('dark');

      root.classList.remove('dark');
      await vi.waitFor(() => expect(frame().srcdoc).toContain('@media not all{.zx-body{background:#18181B'));
      expect(frame().style.colorScheme).toBe('light');
    } finally {
      root.classList.remove('dark');
    }
  });

  it('shows the sender, the subject and the preheader above the email', async () => {
    render(
      <EmailEditor
        label="Body"
        profile={profile}
        value={[paragraph('Hello', 'p1')]}
        renderer={createEmailRenderer({ theme })}
        previewInput={{ ...previewInput, subject: 'Hi {{name}}', preheader: 'Your week' }}
        sender="Example"
      />,
    );
    await userEvent.click(page.getByRole('tab', { name: 'Preview' }));

    const inbox = page.elementLocator(await vi.waitFor(() => find('[data-slot=email-preview-inbox]')));
    await expect.element(inbox.getByText('Example')).toBeVisible();
    await expect.element(inbox.getByText('Hi Lan')).toBeVisible();
    await expect.element(inbox.getByText('Your week')).toBeVisible();
  });

  it('offers the tabs when read-only, with no toolbar', async () => {
    await mount([paragraph('Hello', 'p1')], { ...withPreview(), readOnly: true });

    await userEvent.click(page.getByRole('tab', { name: 'Preview' }));
    await expect.element(page.getByTitle('Email preview')).toBeVisible();
    expect(document.querySelector('[role=toolbar]')).toBeNull();
  });

  it('draws the editor alone without a renderer, at any viewport', async () => {
    await page.viewport(375, 800);
    await mount([paragraph('Hello', 'p1')]);

    await expect.element(page.getByRole('textbox', { name: 'Body' })).toBeVisible();
    expect(document.querySelector('[role=tablist]')).toBeNull();
    expect(document.querySelector('iframe')).toBeNull();
  });

  it("draws the link control and the variable menu as the toolbar's controls", async () => {
    await mount([paragraph('Hello', 'p1')]);

    const toolbar = page.getByRole('toolbar');
    await expect.element(toolbar.getByRole('button', { name: 'Link', exact: true })).toBeVisible();
    await expect.element(toolbar.getByRole('combobox', { name: 'Variable', exact: true })).toBeVisible();
  });

  it('reads bold, italic, then the link control and the variable menu, with no remove-link control', async () => {
    await mount([paragraph('Hello', 'p1')]);

    const toolbar = await vi.waitFor(() => find('[role=toolbar]'));
    const names = [...toolbar.querySelectorAll('button, [role=combobox]')].map((control) =>
      control.getAttribute('aria-label'),
    );
    expect(names).toEqual(['Bold', 'Italic', 'Link', 'Variable']);
  });

  it('offers to remove a link in the bubble only while the selection is in one', async () => {
    const linked: EditorEmailBlock = {
      id: 'p1',
      key: 'p1',
      type: 'paragraph',
      attributes: {},
      content: { text: 'Open the [page]({{resetUrl}})' },
    };
    const probe = await mount([linked]);
    await caretAfter('Open the page');
    await userEvent.keyboard('{ArrowLeft}{ArrowLeft}{Shift>}{ArrowLeft}{/Shift}');
    await userEvent.click(await vi.waitFor(() => find('[data-slot=bubble-menu] [aria-label="Remove link"]')));
    await vi.waitFor(() => expect(exportedOf(probe.editor)[0].content).toEqual({ text: 'Open the page' }));

    await userEvent.keyboard('{Shift>}{ArrowLeft}{/Shift}');
    await vi.waitFor(() => find('[data-slot=bubble-menu] [aria-label=Italic]'));
    expect(document.querySelector('[data-slot=bubble-menu] [aria-label="Remove link"]')).toBeNull();
  });

  it('presses the link control while the caret is in a link', async () => {
    const linked: EditorEmailBlock = {
      id: 'p1',
      key: 'p1',
      type: 'paragraph',
      attributes: {},
      content: { text: '[Reset]({{resetUrl}})' },
    };
    await mount([linked]);
    await caretAfter('Reset');
    await userEvent.keyboard('{ArrowLeft}');

    await expect
      .element(page.getByRole('toolbar').getByRole('button', { name: 'Link', exact: true }))
      .toHaveAttribute('aria-pressed', 'true');
  });
});

describe('EmailEditor variables in code and html', () => {
  const code = (value: string): EditorEmailBlock => ({
    id: 'c1',
    key: 'c1',
    type: 'code',
    attributes: {},
    content: { code: value },
  });
  const html = (value: string): EditorEmailBlock => ({
    id: 'h1',
    key: 'h1',
    type: 'html',
    attributes: {},
    content: { html: value },
  });

  it('completes {{ in a code block from the declarations and exports the token as written', async () => {
    const probe = await mount([code('Hi ')]);
    const pane = await vi.waitFor(() => find('[data-code-block] .cm-content'));
    await userEvent.click(pane);
    await userEvent.keyboard('{ControlOrMeta>}{End}{/ControlOrMeta}{{{{na');
    await userEvent.click(page.getByRole('option', { name: 'Name' }));

    await vi.waitFor(() => expect(last(probe.reported)?.[0].content).toEqual({ code: 'Hi {{name}}' }));
  });

  it("inserts the toolbar's variable into the code block that held the focus, keeping the other blocks", async () => {
    const probe = await mount([paragraph('Hello', 'p1'), code('Hi ')]);
    await userEvent.click(await vi.waitFor(() => find('[data-code-block] .cm-content')));
    await userEvent.keyboard('{ControlOrMeta>}{End}{/ControlOrMeta}');
    await pickVariable('Name');

    await vi.waitFor(() =>
      expect(last(probe.reported)?.map(({ type, content }) => [type, content])).toEqual([
        ['paragraph', { text: 'Hello' }],
        ['code', { code: 'Hi {{name}}' }],
      ]),
    );
  });

  it('inserts a variable into an html block as its token, so the export is the text as written', async () => {
    const probe = await mount([html('<b>')]);
    await userEvent.click(await vi.waitFor(() => find('[data-slot=email-html]')));
    await userEvent.keyboard('{End}');
    await pickVariable('Name');

    await vi.waitFor(() => expect(last(probe.reported)?.[0].content).toEqual({ html: '<b>{{name}}' }));
  });
});
