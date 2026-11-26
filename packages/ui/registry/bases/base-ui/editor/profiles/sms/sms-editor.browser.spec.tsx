import { useState } from 'react';
import { describe, expect, it, onTestFinished, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { page, userEvent } from 'vitest/browser';
import type { IEditor } from '@zeroxsolutions/editor-core/document/core/index';
import {
  smsProfile,
  validate,
  type EditorProfile,
  type ProfileProblem,
  type VariableDeclaration,
} from '@zeroxsolutions/editor-core/profiles/index';
import '../../../../../../test/nova-style.css';
import '../../styles.css';
import { DEFAULT_PROFILE_MESSAGES, type ProfileEditorMessages } from '../messages';
import { SmsEditor } from './sms-editor';

const declared: VariableDeclaration[] = [
  { name: 'a', type: 'string', label: 'A', sampleValue: 'x' },
  { name: 'code', type: 'string', label: 'Code', required: true },
];

const profile = smsProfile({ variables: declared });

interface Probe {
  editor: IEditor | null;
  reported: string[];
  validated: ProfileProblem[][];
  blurs: number;
  load(value: string): void;
  declare(profile: EditorProfile): void;
}

/** A host that stores what the editor reports and hands it back as the value. */
interface HostProps {
  initial: string;
  probe: Probe;
  first?: EditorProfile;
  messages?: Partial<ProfileEditorMessages>;
  readOnly?: boolean;
}

function Host({ initial, probe, first = profile, ...props }: HostProps) {
  const [value, setValue] = useState(initial);
  const [current, setProfile] = useState(first);
  probe.load = setValue;
  probe.declare = setProfile;
  return (
    <div className="style-nova p-12">
      <SmsEditor
        {...props}
        label="Message"
        profile={current}
        value={value}
        onChange={(body) => {
          probe.reported.push(body);
          setValue(body);
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
  initial: string,
  first?: EditorProfile,
  props: Pick<HostProps, 'messages' | 'readOnly'> = {},
): Promise<Probe & { editor: IEditor }> {
  const probe: Probe = {
    editor: null,
    reported: [],
    validated: [],
    blurs: 0,
    load: () => {},
    declare: () => {},
  };
  await render(<Host {...props} initial={initial} probe={probe} first={first} />);
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

const meter = () => find('[data-slot=sms-meter-count]').textContent;

/** Clicks past the end of the last line, where a person puts the caret to type on. */
async function caretAtEnd(): Promise<void> {
  const lines = await vi.waitFor(() => {
    const found = [...document.querySelectorAll<HTMLElement>('[contenteditable=true] p')];
    if (found.length === 0) throw new Error('the editor has no line');
    return found;
  });
  const line = lines[lines.length - 1];
  const { width, height } = line.getBoundingClientRect();
  await userEvent.click(line, { position: { x: width - 1, y: height - 1 } });
}

/** Puts `value` on the clipboard the way a reader does: selects it in a field and copies. */
async function copyText(value: string): Promise<void> {
  const source = document.createElement('textarea');
  source.value = value;
  document.body.append(source);
  await userEvent.click(source);
  await userEvent.keyboard('{ControlOrMeta>}a{/ControlOrMeta}');
  await userEvent.copy();
  source.remove();
}

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

/** Runs every timer the editor has set, so a validation it scheduled has run before the count is read. */
function settleTimers(): void {
  vi.runOnlyPendingTimers();
  vi.runOnlyPendingTimers();
}

const last = <T,>(list: T[]): T | undefined => list[list.length - 1];

describe('SmsEditor', () => {
  it('reads the cost of the body, tokens counted as their literal text', async () => {
    await mount('Hello {{a}}!');
    await vi.waitFor(() => expect(meter()).toBe('16 / 160 GSM-7'));
  });

  it('flips to UCS-2 when an emoji is typed', async () => {
    const probe = await mount('Hello');
    await copyText('\u{1F600}');
    await caretAtEnd();
    await userEvent.paste();
    await vi.waitFor(() => expect(meter()).toMatch(/ \/ 70 UCS-2$/));
    await vi.waitFor(() => expect(last(probe.reported)).toBe('Hello\u{1F600}'));
  });

  it('shows the exceeded problem on the meter and the text past the limit', async () => {
    const probe = await mount('x'.repeat(160));
    await caretAtEnd();
    await userEvent.keyboard('yz');

    const message = DEFAULT_PROFILE_MESSAGES.problem({ kind: 'sms-segment-exceeded', block: null });
    await vi.waitFor(() => expect(find('[data-slot=sms-meter]').textContent).toContain(message));
    expect(find('[data-slot=sms-meter]').getAttribute('data-problem')).toBe('sms-segment-exceeded');
    const decorated = await vi.waitFor(() => find('[contenteditable=true] [data-problem]'), { timeout: 1000 });
    expect(decorated.getAttribute('data-problem')).toBe('sms-segment-exceeded');
    expect(decorated.textContent).toBe('yz');
    expect(last(probe.validated)?.map(({ kind }) => kind)).toContain('sms-segment-exceeded');
  });

  it('gives no bold or italic shortcut an effect', async () => {
    const probe = await mount('Hello');
    await caretAtEnd();
    await userEvent.keyboard(
      '{Shift>}{Home}{/Shift}{Control>}b{/Control}{Control>}i{/Control}{Meta>}b{/Meta}{Meta>}i{/Meta}',
    );
    expect(
      document.querySelector(
        '[contenteditable=true] strong, [contenteditable=true] em, [contenteditable=true] b, [contenteditable=true] i',
      ),
    ).toBeNull();
    expect(JSON.stringify(probe.editor.getJSON())).not.toContain('"marks"');
  });

  it('draws no grip and no insert button', async () => {
    await mount('Hello');
    await userEvent.hover(await vi.waitFor(() => find('[contenteditable=true] p')));
    await caretAtEnd();

    await expect.element(page.getByRole('button', { name: 'Block handle' })).not.toBeInTheDocument();
    await expect.element(page.getByRole('button', { name: 'Insert block below' })).not.toBeInTheDocument();
  });

  it('offers the declared variables under "/", inserting the picked one as its chip, which the meter counts', async () => {
    const probe = await mount('Hello');
    await caretAtEnd();
    await userEvent.keyboard(' /');

    const menu = page.elementLocator(await vi.waitFor(() => find('[data-slot=slash-menu]')));
    await expect.element(menu.getByText('Variables')).toBeVisible();
    await expect.element(menu.getByText('A', { exact: true })).toBeVisible();
    await userEvent.click(menu.getByText('Code', { exact: true }));

    await vi.waitFor(() => expect(last(probe.reported)).toBe('Hello {{code}}'));
    expect(find('[contenteditable=true] [data-variable=code]')).toBeTruthy();
    // More than "Hello " alone: the chip costs what the meter reserves for its variable.
    await vi.waitFor(() => expect(Number.parseInt(meter() ?? '', 10)).toBeGreaterThan('Hello '.length));
    await vi.waitFor(() => expect(document.querySelector('[data-slot=slash-menu]')).toBeNull());
  });

  it('leaves the typed "/" as text when its menu is dismissed', async () => {
    const probe = await mount('Hello');
    await caretAtEnd();
    await userEvent.keyboard(' /');
    await vi.waitFor(() => find('[data-slot=slash-menu]'));

    await userEvent.keyboard('{Escape}');
    await vi.waitFor(() => expect(document.querySelector('[data-slot=slash-menu]')).toBeNull());
    expect(last(probe.reported)).toBe('Hello /');
  });

  it('takes End after a chip to the end of the line, scrolling nothing, and Shift+End selects up to it', async () => {
    // A page taller than the window, which End would scroll were the key left to the browser, as on macOS.
    document.body.style.minHeight = '300vh';
    try {
      await mount('Hi {{a}} there');
      await vi.waitFor(() => find('[contenteditable=true] [data-variable=a]'));
      await caretAtEnd();
      const afterChip = '{ArrowLeft}'.repeat(' there'.length);
      await userEvent.keyboard(afterChip);

      await userEvent.keyboard('{End}');
      await vi.waitFor(() => {
        const selection = document.getSelection();
        expect(selection?.focusNode?.textContent).toBe(' there');
        expect(selection?.focusOffset).toBe(' there'.length);
      });
      expect(window.scrollY).toBe(0);

      await userEvent.keyboard(afterChip);
      await userEvent.keyboard('{Shift>}{End}{/Shift}');
      await vi.waitFor(() => expect(document.getSelection()?.toString()).toBe(' there'));
      expect(window.scrollY).toBe(0);
    } finally {
      document.body.style.minHeight = '';
    }
  });

  it('keeps a typed heading or list shortcut, and a pasted heading, as text', async () => {
    const probe = await mount('');
    await caretAtEnd();
    await userEvent.keyboard('# Title{Enter}- item');
    await copyHtml('<h1>Hi</h1>');
    await caretAtEnd();
    await userEvent.paste();

    await vi.waitFor(() => expect(last(probe.reported)).toBe('# Title\n- itemHi'));
    expect((probe.editor.getJSON().content ?? []).map((block) => block.type)).toEqual(['paragraph', 'paragraph']);
  });

  it('makes a line break on Enter, reported as a new line', async () => {
    const probe = await mount('Hello');
    await caretAtEnd();
    await userEvent.keyboard('{Enter}there');
    await vi.waitFor(() => expect(last(probe.reported)).toBe('Hello\nthere'));
  });

  it('loads a value the host changes, and does not reload the one it reported', async () => {
    const probe = await mount('Hello');
    await caretAtEnd();
    await userEvent.keyboard('{ArrowLeft}{ArrowLeft}{ArrowLeft}abc');
    await vi.waitFor(() => expect(probe.editor.getText()).toBe('Heabcllo'));

    probe.load('Xin chao');
    await vi.waitFor(() => expect(probe.editor.getText()).toBe('Xin chao'));
    await vi.waitFor(() => expect(meter()).toBe('8 / 160 GSM-7'));
  });

  it('tells the host when the focus leaves it, and not while it is in a popup the editor opened', async () => {
    const probe = await mount('Hello');
    await caretAtEnd();
    await userEvent.click(page.getByTestId('variable-menu'));
    const option = page.getByRole('option', { name: 'A', exact: true });
    // The leave is told a task after the blur, and each input the browser carries out spans several, so a leave
    // the popup caused has been told by the time the hover lands.
    await userEvent.hover(option);
    expect(probe.blurs).toBe(0);

    await userEvent.click(option);
    await vi.waitFor(() => expect(last(probe.reported)).toBe('Hello{{a}}'));
    await userEvent.hover(page.getByRole('button', { name: 'Elsewhere' }));
    expect(probe.blurs).toBe(0);
    await userEvent.click(page.getByRole('button', { name: 'Elsewhere' }));

    await vi.waitFor(() => expect(probe.blurs).toBe(1));
    await userEvent.hover(page.getByRole('textbox', { name: 'Message' }));
    expect(probe.blurs).toBe(1);
  });

  it('validates once on mount and lists the problem no place holds', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    onTestFinished(() => {
      vi.useRealTimers();
    });
    const probe = await mount('Hi {{a}}');
    await vi.waitFor(() => expect(probe.validated).toHaveLength(1));
    settleTimers();
    expect(probe.validated).toHaveLength(1);
    expect(probe.validated[0]).toEqual(validate('Hi {{a}}', profile));
    await vi.waitFor(() =>
      expect(find('[data-slot=sms-problems]').textContent).toBe(
        DEFAULT_PROFILE_MESSAGES.problem({ kind: 'required-variable-not-printed', block: null, name: 'code' }),
      ),
    );
  });

  it('marks a malformed placeholder where it is, and the undeclared variable chip', async () => {
    await mount('Hi {{code}} {{ oops {{nobody}}');
    const marked = await vi.waitFor(() => {
      const found = [
        ...document.querySelectorAll<HTMLElement>('[contenteditable=true] [data-problem]:not([data-slot=variable])'),
      ];
      expect(found).toHaveLength(2);
      return found;
    });
    const kinds = marked.map((element) => element.getAttribute('data-problem'));
    expect(kinds).toEqual(['sms-placeholder-malformed', 'variable-undeclared']);
    expect(marked[0].textContent).toBe('{{');
    expect(document.getElementById(marked[0].getAttribute('aria-describedby') ?? '')?.textContent).toBe(
      DEFAULT_PROFILE_MESSAGES.problem({ kind: 'sms-placeholder-malformed', block: null, offset: 0 }),
    );
  });

  it('reaches each problem with F8 and Shift+F8, and goes back to its text with Escape', async () => {
    const probe = await mount('{{ one {{nobody}} x');
    const markers = await vi.waitFor(() => {
      const found = [...document.querySelectorAll<HTMLElement>('[data-slot=sms-problem-marker]')];
      expect(found).toHaveLength(2);
      return found;
    });
    await userEvent.click(find('[contenteditable=true] p'));

    await userEvent.keyboard('{F8}');
    expect(document.activeElement).toBe(markers[0]);
    await vi.waitFor(() => expect(find('[data-slot=tooltip-content]').textContent).toBeTruthy());
    await userEvent.keyboard('{F8}');
    expect(document.activeElement).toBe(markers[1]);
    await userEvent.keyboard('{Shift>}{F8}{/Shift}');
    expect(document.activeElement).toBe(markers[0]);

    await userEvent.keyboard('{Escape}');
    await vi.waitFor(() => expect(document.activeElement?.getAttribute('contenteditable')).toBe('true'));
    await userEvent.keyboard('Z');
    await vi.waitFor(() => expect(last(probe.reported)).toBe('Z{{ one {{nobody}} x'));
    expect(probe.blurs).toBe(0);
  });

  it('reads the declarations again when the profile changes them, and not when it is rebuilt', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    onTestFinished(() => {
      vi.useRealTimers();
    });
    const probe = await mount('Hi {{a}}');
    await vi.waitFor(() => expect(find('[contenteditable=true] p').textContent).toContain('A'));

    probe.declare(smsProfile({ variables: [{ ...declared[0], label: 'First name' }, declared[1]] }));
    await vi.waitFor(() => expect(find('[contenteditable=true] p').textContent).toContain('First name'));

    const count = probe.validated.length;
    probe.declare(smsProfile({ variables: [{ ...declared[0], label: 'First name' }, declared[1]] }));
    await vi.waitFor(() => expect(find('[contenteditable=true] p').textContent).toContain('First name'));
    settleTimers();
    expect(probe.validated).toHaveLength(count);
  });

  it('marks an emoji whole when it is the character that overflows', async () => {
    const probe = await mount(`${'x'.repeat(69)}\u{1F600}`);
    // 69 + 2 = 71 units: UCS-2, past one segment of 70.
    const decorated = await vi.waitFor(() => find('[contenteditable=true] [data-problem]'), { timeout: 1000 });
    expect(decorated.textContent).toBe('\u{1F600}');
    expect(probe.editor.getText()).toContain('\u{1F600}');
  });

  it('keeps blank lines in pasted text, and turns its tokens into chips', async () => {
    const probe = await mount('');
    await copyText('a\n\nb {{a}}');
    await userEvent.click(await vi.waitFor(() => find('[contenteditable=true] p')));
    await userEvent.paste();
    await vi.waitFor(() => expect(last(probe.reported)).toBe('a\n\nb {{a}}'));
    await vi.waitFor(() => expect(find('[contenteditable=true] [data-slot=variable]')).toBeTruthy());
  });

  it('shows the segments against the cap when the profile allows several', async () => {
    await mount('x'.repeat(200), smsProfile({ variables: declared, maxSegments: 2 }));
    await vi.waitFor(() => expect(meter()).toBe('200 / 160 GSM-7 - 2 of 2 segments'));
    expect(find('[data-slot=sms-meter]').getAttribute('data-problem')).toBeNull();
  });

  it('marks the meter exceeded past the segment cap', async () => {
    await mount('x'.repeat(307), smsProfile({ variables: declared, maxSegments: 2 }));
    await vi.waitFor(() => expect(meter()).toBe('307 / 160 GSM-7 - 3 of 2 segments'));
    expect(find('[data-slot=sms-meter]').getAttribute('data-problem')).toBe('sms-segment-exceeded');
  });

  it("reads the meter in the host's words", async () => {
    await mount('', undefined, { messages: { smsMeter: ({ units, limit }) => units + '/' + limit } });

    await vi.waitFor(() => expect(meter()).toBe('0/160'));
  });

  it('is named by its label, and refuses typing when read-only', async () => {
    const probe = await mount('Hello', undefined, { readOnly: true });
    await userEvent.type(page.getByRole('textbox', { name: 'Message' }), ' there');

    expect(probe.reported).toEqual([]);
    expect(probe.editor.getText()).toBe('Hello');
    await expect.element(page.getByTestId('variable-menu')).not.toBeInTheDocument();
  });

  it('draws the variable menu in the toolbar', async () => {
    await mount('Hello');

    await expect.element(page.getByRole('toolbar').getByTestId('variable-menu')).toBeVisible();
  });
});
