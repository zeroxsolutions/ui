import { useState, type ReactNode } from 'react';
import { afterEach, describe, expect, it, onTestFinished, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { page, userEvent, type Locator } from 'vitest/browser';
import type { BlockPreset } from '@zeroxsolutions/editor-core/blocks/index';
import type { IEditor } from '@zeroxsolutions/editor-core/document/core/index';
import {
  docProblems,
  emailPreset,
  emailProfile,
  MAIL_LAYOUT_KINDS,
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
import { EditorPresetsPanel } from '../../document/features/presets/presets-panel';
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
  /** Locks or frees the structure, as a host opening a template's locked copy does. */
  restructure(structure: 'free' | 'locked'): void;
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
  /** The presets the editor offers, listed in a panel beside it too. */
  presets?: readonly BlockPreset[];
}

/** A host that stores what the editor reports and hands it back as the value, as travel's rows do. */
function Host({
  initial,
  probe,
  renderBlockAdornment,
  profile: first,
  preview,
  readOnly: locked,
  structure: initialStructure,
  ...props
}: HarnessProps) {
  const [structure, setStructure] = useState(initialStructure);
  probe.restructure = setStructure;
  const [value, setValue] = useState(initial);
  const [current, setProfile] = useState(first);
  probe.declare = setProfile;
  const [readOnly, setReadOnly] = useState(locked);
  probe.lock = setReadOnly;
  const [adornment, setAdornment] = useState(() => renderBlockAdornment);
  probe.load = setValue;
  probe.adorn = (next) => setAdornment(() => next);
  const previewProps: EmailPreviewProps = preview ? { renderer: preview.renderer, previewInput: preview.input } : {};
  const [ready, setReady] = useState<IEditor | null>(null);
  return (
    <div className="style-nova p-12">
      {props.presets && ready && <EditorPresetsPanel editor={ready} presets={props.presets} />}
      <EmailEditor
        {...props}
        {...previewProps}
        label="Body"
        readOnly={readOnly}
        structure={structure}
        profile={current}
        value={value}
        renderBlockAdornment={adornment}
        onChange={(blocks) => {
          probe.reported.push(blocks);
          setValue(blocks);
        }}
        onValidate={(problems) => probe.validated.push(problems)}
        onBlur={() => (probe.blurs += 1)}
        onReady={(editor) => {
          probe.editor = editor;
          setReady(editor);
        }}
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
    restructure: () => {},
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

/**
 * Puts `html` on the clipboard as another app copies it, beside its text. A copy out of the page would carry the
 * page's own markup around it, which is not what the case pastes.
 */
async function copyHtml(html: string): Promise<void> {
  const text = new DOMParser().parseFromString(html, 'text/html').body.textContent ?? '';
  await navigator.clipboard.write([
    new ClipboardItem({
      'text/html': new Blob([html], { type: 'text/html' }),
      'text/plain': new Blob([text], { type: 'text/plain' }),
    }),
  ]);
}

/** Fakes the timers the editor schedules a validation on, until the case ends. */
function fakeTimers(): void {
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
  onTestFinished(() => {
    vi.useRealTimers();
  });
}

/** Runs every timer the editor has set, so a validation it scheduled has run before the count is read. */
function settleTimers(): void {
  vi.runOnlyPendingTimers();
  vi.runOnlyPendingTimers();
}

/** The renderer's HTML in a preview frame, without the policy and the measuring script the preview adds. */
function rendered(frame: HTMLIFrameElement): string {
  return frame.srcdoc
    .replace(/<meta http-equiv="Content-Security-Policy" content="[^"]*">/, '')
    .replace(/<script nonce="[0-9a-f]+">[\s\S]*?<\/script>/, '');
}

/** Shows the grip of the paragraph holding `text`, or of the block `selector` names, as a pointer over it does. */
async function gripOf(text: string, selector = '[contenteditable=true] p'): Promise<Locator> {
  await userEvent.hover(await vi.waitFor(() => find(selector, text)));
  return page.getByRole('button', { name: 'Block handle' });
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
  await userEvent.click(page.getByTestId('variable-menu'));
  await userEvent.click(page.getByRole('option', { name: label, exact: true }));
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
    await userEvent.click(page.getByTestId('variable-menu'));
    const option = page.getByRole('option', { name: 'Reset link' });
    // The leave is told a task after the blur, and each input the browser carries out spans several, so a leave
    // the popup caused has been told by the time the hover lands.
    await userEvent.hover(option);
    expect(probe.blurs).toBe(0);

    await userEvent.click(option);
    await vi.waitFor(() => expect(last(probe.reported)?.[0].content).toEqual({ text: 'Hello{{resetUrl}}' }));
    await userEvent.hover(page.getByRole('button', { name: 'Elsewhere' }));
    expect(probe.blurs).toBe(0);
    await userEvent.click(page.getByRole('button', { name: 'Elsewhere' }));

    await vi.waitFor(() => expect(probe.blurs).toBe(1));
    await userEvent.hover(page.getByRole('textbox', { name: 'Body' }));
    expect(probe.blurs).toBe(1);
  });

  it('marks a problem in place within a second, with its message on hover and on focus', async () => {
    const probe = await mount([paragraph('Hello', 'p1')]);
    await caretAfter('Hello');
    await userEvent.keyboard('{Shift>}{Home}{/Shift}{Backspace}');

    const message = DEFAULT_PROFILE_MESSAGES.problem({ kind: 'text-empty', block: 'p1', field: 'text' });
    const marker = await vi.waitFor(() => page.getByTestId('email-problem-marker').element(), { timeout: 1000 });
    const decorated = find('[contenteditable=true] [data-problem]');
    expect(document.getElementById(decorated.getAttribute('aria-describedby') ?? '')?.textContent).toBe(message);

    await userEvent.hover(marker);
    await expect.element(page.getByTestId('tooltip-content')).toHaveTextContent(message);
    await userEvent.unhover(marker);
    await expect.element(page.getByTestId('tooltip-content')).not.toBeInTheDocument();

    await caretAfter('');
    await userEvent.keyboard('{F8}');
    await vi.waitFor(() => expect(document.activeElement).toBe(marker));
    await expect.element(page.getByTestId('tooltip-content')).toHaveTextContent(message);
    expect(last(probe.validated)).toEqual(validate(last(probe.reported) ?? [], profile));
  });

  it('reaches each problem from the text with F8 and Shift+F8, and goes back to its block with Escape', async () => {
    const probe = await mount([paragraph('One', 'p1'), paragraph('', 'p2'), paragraph('Three {{nobody}}', 'p3')]);
    const markers = await vi.waitFor(() => {
      const found = page.getByTestId('email-problem-marker').elements();
      expect(found).toHaveLength(2);
      return found;
    });
    await caretAfter('One');

    await userEvent.keyboard('{F8}');
    expect(document.activeElement).toBe(markers[0]);
    const empty = DEFAULT_PROFILE_MESSAGES.problem({ kind: 'text-empty', block: 'p2' });
    await expect.element(page.getByTestId('tooltip-content')).toHaveTextContent(empty);
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
    fakeTimers();
    const probe = await mount([paragraph('Hi {{nobody}}', 'p1')]);

    await vi.waitFor(() => expect(probe.validated).toHaveLength(1));
    settleTimers();
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
      expect(
        page
          .getByTestId('email-block-adornment')
          .elements()
          .map((row) => row.textContent),
      ).toEqual(['badge p1', 'badge c1', 'badge l1', 'badge l2']),
    );
    probe.adorn((id) => <span>stale {id}</span>);
    await expect.element(page.getByTestId('email-block-adornment').first()).toHaveTextContent('stale p1');
  });

  it('selects the block the grip opened its menu for, while the menu is open', async () => {
    const probe = await mount([paragraph('First', 'p1'), paragraph('Second', 'p2')]);
    await openBlockMenu('Second');

    // `First` takes positions 0 to 7, so `Second` is the node from 7 to 15.
    expect(probe.editor.getSelection()).toMatchObject({ from: 7, to: 15, isNode: true });
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
    await expect.element(page.getByTestId('slash-menu')).not.toBeInTheDocument();
    await openBlockMenu('Hi /');
    await expect.element(page.getByRole('menuitem', { name: 'Delete' })).toBeDisabled();
  });

  it('marks a heading pasted where the profile holds none, whose structure the email cannot carry, with one problem', async () => {
    const probe = await mount([paragraph('Body', 'p1')], {
      profile: emailProfile({ variables: declared, allow: MAIL_LAYOUT_KINDS }),
    });
    // Between two paragraphs, so the heading is pasted whole rather than joined to the line it lands in.
    await copyHtml('<p>Before</p><h1>Hi</h1><p>After</p>');
    await caretAfter('Body');
    await userEvent.paste();

    await vi.waitFor(() => expect(last(probe.validated)?.map(({ kind }) => kind)).toEqual(['block-not-carried']));
    await vi.waitFor(() => expect(page.getByTestId('email-problem-marker').elements()).toHaveLength(1));
    const exported = toEmailBlocks(probe.editor.getJSON(), [], { kinds: MAIL_LAYOUT_KINDS });
    expect(exported.map(({ type, content }) => [type, content])).toContainEqual(['paragraph', { text: 'Hi' }]);
  });

  it("previews the renderer's HTML for the blocks, keys standing in for ids, with the sample values", async () => {
    const renderer = createEmailRenderer({ theme });
    const probe = await mount([paragraph('Hi {{name}}', 'p1')], { preview: { renderer, input: previewInput } });
    await caretAfter('Hi');
    await userEvent.keyboard('{Enter}More');

    const frame = await vi.waitFor(() => {
      const found = page.getByTitle('Email preview').element() as HTMLIFrameElement;
      expect(found.srcdoc).toContain('More');
      return found;
    });
    const expected = renderer.render({ ...previewInput, ...sampled, blocks: withIds(last(probe.reported) ?? []) });
    expect(rendered(frame)).toBe(expected.html);
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

    const frame = await vi.waitFor(() => page.getByTitle('Email preview').element() as HTMLIFrameElement);
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
    expect(page.getByTestId('email-preview-problems').element().textContent).toContain(
      DEFAULT_PROFILE_MESSAGES.renderProblem({ kind: 'variable-missing', name: 'nobody', blockId: 'x' }, 3),
    );
    expect(page.getByTestId('email-preview-problems').element().textContent).not.toContain('variable-missing');
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
      const lines = [...page.getByTestId('email-preview-problems').element().querySelectorAll('li')].map(
        (li) => li.textContent,
      );
      expect(lines).toEqual([line, line]);
    });
    expect(errors.mock.calls.flat().join(' ')).not.toContain('same key');
    errors.mockRestore();
  });

  it('validates a bounded number of times under a host that re-renders on each report', async () => {
    fakeTimers();
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
    settleTimers();
    settleTimers();
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

    const marker = await vi.waitFor(() => page.getByTestId('email-problem-marker').element());
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

    await expect.element(page.getByTestId('slash-menu')).toHaveTextContent('Duong ke');
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
    await openBlockMenu('', '[data-slot=link-button]');
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

    await userEvent.click(page.getByTestId('variable-menu'));
    await userEvent.click(page.getByRole('option', { name: 'Reset link' }));

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
    await openBlockMenu('', '[data-slot=link-button]');
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

    expect(probe.reported).toEqual([]);
    expect(probe.editor.getText()).toBe('Hello');
    await userEvent.hover(find('[data-editor=document] p', 'Hello'));
    await expect.element(page.getByRole('button', { name: 'Block handle' })).not.toBeInTheDocument();
    await expect.element(page.getByRole('menu')).not.toBeInTheDocument();
    await expect.element(page.getByTestId('slash-menu')).not.toBeInTheDocument();
    await expect.element(page.getByRole('toolbar')).not.toBeInTheDocument();
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
    await expect.element(page.getByRole('toolbar')).not.toBeInTheDocument();
    expect(page.getByTestId('email-editor-bar').getByRole('button').elements()).toHaveLength(0);

    await userEvent.click(page.getByRole('tab', { name: 'Edit' }));
    const toolbar = page.getByRole('toolbar');
    await expect.element(toolbar.getByRole('button', { name: 'Bold' })).toBeEnabled();
    await expect.element(toolbar.getByRole('combobox', { name: 'Variable', exact: true })).toBeEnabled();
  });

  const frame = () => page.getByTitle('Email preview').element() as HTMLIFrameElement;

  it('grows the frame with the email', async () => {
    const probe = await mount([paragraph('Hello', 'p1')], withPreview());
    await userEvent.click(page.getByRole('tab', { name: 'Preview' }));
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
      await vi.waitFor(() => expect(frame().style.colorScheme).toBe('dark'));

      root.classList.remove('dark');
      await vi.waitFor(() => expect(frame().style.colorScheme).toBe('light'));
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

    const inbox = page.getByTestId('email-preview-inbox');
    await expect.element(inbox.getByText('Example')).toBeVisible();
    await expect.element(inbox.getByText('Hi Lan')).toBeVisible();
    await expect.element(inbox.getByText('Your week')).toBeVisible();
  });

  it('offers the tabs when read-only, with no toolbar', async () => {
    await mount([paragraph('Hello', 'p1')], { ...withPreview(), readOnly: true });

    await userEvent.click(page.getByRole('tab', { name: 'Preview' }));
    await expect.element(page.getByTitle('Email preview')).toBeVisible();
    await expect.element(page.getByRole('toolbar')).not.toBeInTheDocument();
  });

  it('draws the editor alone without a renderer, at any viewport', async () => {
    await page.viewport(375, 800);
    await mount([paragraph('Hello', 'p1')]);

    await expect.element(page.getByRole('textbox', { name: 'Body' })).toBeVisible();
    await expect.element(page.getByRole('tablist')).not.toBeInTheDocument();
    await expect.element(page.getByTitle('Email preview')).not.toBeInTheDocument();
  });

  it("draws the link control and the variable menu as the toolbar's controls", async () => {
    await mount([paragraph('Hello', 'p1')]);

    const toolbar = page.getByRole('toolbar');
    await expect.element(toolbar.getByRole('button', { name: 'Link', exact: true })).toBeVisible();
    await expect.element(toolbar.getByRole('combobox', { name: 'Variable', exact: true })).toBeVisible();
  });

  it('offers no remove-link control in the toolbar', async () => {
    await mount([paragraph('Hello', 'p1')]);

    const toolbar = page.getByRole('toolbar');
    await expect.element(toolbar.getByRole('button', { name: 'Link', exact: true })).toBeVisible();
    await expect.element(toolbar.getByRole('button', { name: 'Remove link' })).not.toBeInTheDocument();
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
    await userEvent.click(page.getByTestId('bubble-menu').getByRole('button', { name: 'Remove link' }));
    await vi.waitFor(() => expect(exportedOf(probe.editor)[0].content).toEqual({ text: 'Open the page' }));

    await userEvent.keyboard('{Shift>}{ArrowLeft}{/Shift}');
    await expect.element(page.getByTestId('bubble-menu').getByRole('button', { name: 'Italic' })).toBeVisible();
    await expect
      .element(page.getByTestId('bubble-menu').getByRole('button', { name: 'Remove link' }))
      .not.toBeInTheDocument();
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
    await userEvent.click(page.getByTestId('email-html'));
    await userEvent.keyboard('{End}');
    await pickVariable('Name');

    await vi.waitFor(() => expect(last(probe.reported)?.[0].content).toEqual({ html: '<b>{{name}}' }));
  });
});

describe('EmailEditor presets', () => {
  const callToAction = emailPreset(profile, {
    id: 'call-to-action',
    label: 'Call to action',
    blocks: [
      { id: 'srv-h', key: 'kh', type: 'heading', attributes: { level: 2 }, content: { text: 'Ready?' } },
      paragraph('Reset it now.', 'srv-p'),
      { id: 'srv-b', key: 'kb', type: 'button', attributes: {}, content: { label: 'Reset', href: '{{resetUrl}}' } },
    ],
  });
  const action = emailPreset(profile, {
    id: 'action',
    label: 'Action',
    blocks: [
      paragraph('Reset it now.'),
      { id: null, key: '', type: 'button', attributes: {}, content: { label: 'Reset', href: '{{resetUrl}}' } },
    ],
  });
  const card = emailPreset(profile, {
    id: 'card',
    label: 'Card',
    blocks: [
      {
        id: null,
        key: '',
        type: 'card',
        attributes: {},
        content: {
          image: 'https://x.test/c.png',
          alt: 'A bay',
          heading: 'Stay',
          text: 'By the sea',
          buttonLabel: '',
          buttonHref: '',
        },
      },
    ],
  });
  const presets = [callToAction, action, card];
  const columns = (): EditorEmailBlock => ({
    id: 'c1',
    key: 'c1',
    type: 'columns',
    attributes: { ratio: [1, 1] },
    content: {},
    lanes: [[paragraph('Left', 'l1')], [paragraph('Right', 'l2')]],
  });
  const row = (label: string) => page.getByRole('button', { name: label, exact: true });
  const offered = () =>
    page
      .getByRole('list', { name: 'Presets' })
      .getByRole('button')
      .elements()
      .map((element) => element.textContent);

  /**
   * Whether a drop cursor was drawn as the next drag let go over a lane: read as the browser drops there, or as
   * it leaves a drag it refused, before the editor's handlers clear the cursor either way.
   */
  function watchLaneCursor(): () => boolean | null {
    let released: boolean | null = null;
    const read = (event: DragEvent) => {
      if (!event.isTrusted || !(event.target instanceof Element) || !event.target.closest('[data-slot=column]')) return;
      released = document.querySelector('.prosemirror-dropcursor-block') !== null;
    };
    for (const type of ['dragleave', 'drop'] as const) document.addEventListener(type, read, { capture: true });
    document.addEventListener(
      'dragend',
      () => {
        for (const type of ['dragleave', 'drop'] as const) document.removeEventListener(type, read, { capture: true });
      },
      { capture: true, once: true },
    );
    return () => released;
  }

  it("offers a preset holding a heading nowhere when the profile allows none, the group in the host's words", async () => {
    await mount([paragraph('Hi', 'p1')], {
      presets,
      profile: emailProfile({ variables: declared, allow: ['paragraph', 'button', 'divider'] }),
      messages: { presetsGroup: 'Ready-made' },
    });
    await vi.waitFor(() => expect(offered()).toEqual(['Action']));

    await caretAfter('Hi');
    await userEvent.keyboard('{Enter}/');

    await expect.element(page.getByText('Ready-made', { exact: true })).toBeVisible();
    const slash = () =>
      page
        .getByTestId('slash-menu')
        .getByTestId('item-title')
        .elements()
        .map((title) => title.textContent);
    expect(slash()).toContain('Action');
    expect(slash()).not.toContain('Call to action');
  });

  it('inserts each preset clicked while the caret is in a column at the top level, after the columns', async () => {
    const probe = await mount([paragraph('Top', 'p1'), columns()], { presets });
    await caretAfter('Left');
    await vi.waitFor(() => expect(row('Card').element().getAttribute('aria-disabled')).toBeNull());

    await userEvent.click(row('Action'));
    await vi.waitFor(() =>
      expect(exportedOf(probe.editor).map(({ type }) => type)).toEqual(['paragraph', 'columns', 'paragraph', 'button']),
    );
    await userEvent.click(row('Card'));

    await vi.waitFor(() =>
      expect(exportedOf(probe.editor).map(({ type }) => type)).toEqual([
        'paragraph',
        'columns',
        'paragraph',
        'button',
        'card',
      ]),
    );
    expect(exportedOf(probe.editor)[1].lanes?.map((lane) => lane.map(({ type }) => type))).toEqual([
      ['paragraph'],
      ['paragraph'],
    ]);
  });

  it('drops a card over a column at the top level, before the columns, and a call to action in the column', async () => {
    const probe = await mount([paragraph('Top', 'p1'), columns()], { presets });
    const lane = () => vi.waitFor(() => find('[contenteditable=true] [data-slot=column] p', 'Left'));
    await expect.element(row('Card')).toBeVisible();

    const outside = watchLaneCursor();
    await userEvent.dragAndDrop(row('Card'), await lane(), { steps: 10, targetPosition: { x: 2, y: 4 } });
    await vi.waitFor(() =>
      expect(exportedOf(probe.editor).map(({ type }) => type)).toEqual(['paragraph', 'card', 'columns']),
    );
    expect(outside()).toBe(true);

    const taken = watchLaneCursor();
    await userEvent.dragAndDrop(row('Call to action'), await lane(), { steps: 10, targetPosition: { x: 2, y: 4 } });
    await vi.waitFor(() =>
      expect(exportedOf(probe.editor)[2].lanes?.[0].map(({ type }) => type)).toEqual([
        'heading',
        'paragraph',
        'button',
        'paragraph',
      ]),
    );
    expect(taken()).toBe(true);
  });

  it('drops a card over the lower half of a column after the columns, the last block of the mail', async () => {
    const tall: EditorEmailBlock = {
      ...columns(),
      lanes: [['One', 'Two', 'Three', 'Four', 'Left'].map((text) => paragraph(text)), [paragraph('Right', 'l2')]],
    };
    const probe = await mount([paragraph('Top', 'p1'), tall], { presets });
    const last = await vi.waitFor(() => find('[contenteditable=true] [data-slot=column] p', 'Left'));
    await expect.element(row('Card')).toBeVisible();

    await userEvent.dragAndDrop(row('Card'), last, {
      steps: 10,
      targetPosition: { x: 2, y: last.getBoundingClientRect().height - 2 },
    });

    await vi.waitFor(() =>
      expect(exportedOf(probe.editor).map(({ type }) => type)).toEqual(['paragraph', 'columns', 'card']),
    );
  });

  it('drops a preset over a table before or after the table, never in a cell', async () => {
    const table: EditorEmailBlock = {
      id: 't1',
      key: 't1',
      type: 'table',
      attributes: {},
      content: {
        rows: [
          ['cellA', 'cellB'],
          ['cellC', 'cellD'],
        ],
      },
    };
    const probe = await mount([paragraph('Top', 'p1'), table, paragraph('End', 'p2')], { presets });
    const cell = (text: string) => vi.waitFor(() => find('[contenteditable=true] td', text));
    await expect.element(row('Action')).toBeVisible();

    const last = await cell('cellD');
    await userEvent.dragAndDrop(row('Action'), last, {
      steps: 10,
      targetPosition: { x: 2, y: last.getBoundingClientRect().height - 2 },
    });
    await vi.waitFor(() =>
      expect(exportedOf(probe.editor).map(({ type }) => type)).toEqual([
        'paragraph',
        'table',
        'paragraph',
        'button',
        'paragraph',
      ]),
    );

    await userEvent.dragAndDrop(row('Action'), await cell('cellA'), { steps: 10, targetPosition: { x: 2, y: 2 } });
    await vi.waitFor(() =>
      expect(exportedOf(probe.editor).map(({ type }) => type)).toEqual([
        'paragraph',
        'paragraph',
        'button',
        'table',
        'paragraph',
        'button',
        'paragraph',
      ]),
    );
    expect(exportedOf(probe.editor)[3].content).toEqual(table.content);
  });

  it('offers no preset in locked structure', async () => {
    await mount([paragraph('Hi', 'p1')], { presets, structure: 'locked' });
    await caretAfter('Hi');

    await expect.element(page.getByText('No presets fit here')).toBeVisible();
    expect(offered()).toEqual([]);
  });

  it('takes its presets away as the host locks the structure or turns read-only on', async () => {
    const probe = await mount([paragraph('Hi', 'p1')], { presets });
    await expect.element(row('Action')).toBeVisible();

    probe.restructure('locked');
    await expect.element(page.getByText('No presets fit here')).toBeVisible();
    probe.restructure('free');
    await expect.element(row('Action')).toBeVisible();

    probe.lock(true);
    await expect.element(page.getByText('No presets fit here')).toBeVisible();
  });

  it('inserts a preset as new blocks the export carries, with no problem and no id from where it came', async () => {
    const probe = await mount([paragraph('Hi', 'p1')], { presets });
    await caretAfter('Hi');

    await userEvent.click(row('Call to action'));

    await vi.waitFor(() =>
      expect(exportedOf(probe.editor).map(({ id, type }) => [id, type])).toEqual([
        ['p1', 'paragraph'],
        [null, 'heading'],
        [null, 'paragraph'],
        [null, 'button'],
      ]),
    );
    expect(validate(exportedOf(probe.editor), profile)).toEqual([]);
    expect(docProblems(probe.editor.getJSON())).toEqual([]);
    expect(new Set(exportedOf(probe.editor).map(({ key }) => key)).size).toBe(4);
  });
});
