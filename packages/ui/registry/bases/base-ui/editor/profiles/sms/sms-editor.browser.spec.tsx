import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
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

async function caretAtEnd(probe: { editor: IEditor }): Promise<void> {
  await userEvent.click(await vi.waitFor(() => find('[contenteditable=true] p')));
  probe.editor.focus('end');
}

const last = <T,>(list: T[]): T | undefined => list[list.length - 1];

describe('SmsEditor', () => {
  it('reads the cost of the body, tokens counted as their literal text', async () => {
    await mount('Hello {{a}}!');
    await vi.waitFor(() => expect(meter()).toBe('16 / 160 GSM-7'));
    expect(find('[data-slot=sms-meter]').getAttribute('aria-live')).toBe('polite');
  });

  it('flips to UCS-2 when an emoji is typed', async () => {
    const probe = await mount('Hello');
    await caretAtEnd(probe);
    probe.editor.run('insertContent', { content: '\u{1F600}' });
    await vi.waitFor(() => expect(meter()).toMatch(/ \/ 70 UCS-2$/));
    await vi.waitFor(() => expect(last(probe.reported)).toBe('Hello\u{1F600}'));
  });

  it('shows the exceeded problem on the meter and the text past the limit', async () => {
    const probe = await mount('x'.repeat(160));
    await caretAtEnd(probe);
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
    await caretAtEnd(probe);
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

  it('draws no grip, no insert button and no slash menu', async () => {
    const probe = await mount('Hello');
    await userEvent.hover(await vi.waitFor(() => find('[contenteditable=true] p')));
    await caretAtEnd(probe);
    await userEvent.keyboard(' /');

    await vi.waitFor(() => expect(last(probe.reported)).toBe('Hello /'));
    expect(document.querySelector('.drag-handle')).toBeNull();
    expect(document.querySelector('[data-editor-add]')).toBeNull();
    expect(document.querySelector('[data-slot=slash-menu]')).toBeNull();
  });

  it('keeps a typed heading or list shortcut, and a pasted heading, as text', async () => {
    const probe = await mount('');
    await caretAtEnd(probe);
    await userEvent.keyboard('# Title{Enter}- item');
    const data = new DataTransfer();
    data.setData('text/html', '<h1>Hi</h1>');
    find('[contenteditable=true]').dispatchEvent(
      new ClipboardEvent('paste', { clipboardData: data, bubbles: true, cancelable: true }),
    );

    await vi.waitFor(() => expect(last(probe.reported)).toBe('# Title\n- itemHi'));
    expect((probe.editor.getJSON().content ?? []).map((block) => block.type)).toEqual(['paragraph', 'paragraph']);
  });

  it('makes a line break on Enter, reported as a new line', async () => {
    const probe = await mount('Hello');
    await caretAtEnd(probe);
    await userEvent.keyboard('{Enter}there');
    await vi.waitFor(() => expect(last(probe.reported)).toBe('Hello\nthere'));
  });

  it('loads a value the host changes, and does not reload the one it reported', async () => {
    const probe = await mount('Hello');
    await caretAtEnd(probe);
    // ProseMirror takes a caret at the start of the document within 200ms of a focus event for the browser's own
    // reset and puts its last selection back, so a slow runner's Home could land the text at the end, and an
    // arrow pressed inside that window can be undone; the keys wait it out.
    await new Promise((resolve) => setTimeout(resolve, 250));
    await userEvent.keyboard('{End}{ArrowLeft}{ArrowLeft}{ArrowLeft}abc');
    await vi.waitFor(() => expect(probe.editor.getText()).toBe('Heabcllo'));

    probe.load('Xin chao');
    await vi.waitFor(() => expect(probe.editor.getText()).toBe('Xin chao'));
    await vi.waitFor(() => expect(meter()).toBe('8 / 160 GSM-7'));
  });

  it('tells the host when the focus leaves it, and not while it is in a popup the editor opened', async () => {
    const probe = await mount('Hello');
    await caretAtEnd(probe);
    await userEvent.click(find('[data-slot=variable-menu]'));
    const option = await vi.waitFor(() => find('[data-slot=combobox-item]', 'A'));
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(probe.blurs).toBe(0);

    await userEvent.click(option);
    await vi.waitFor(() => expect(last(probe.reported)).toBe('Hello{{a}}'));
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(probe.blurs).toBe(0);
    await userEvent.click(find('button', 'Elsewhere'));

    await vi.waitFor(() => expect(probe.blurs).toBe(1));
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(probe.blurs).toBe(1);
  });

  it('validates once on mount and lists the problem no place holds', async () => {
    const probe = await mount('Hi {{a}}');
    await vi.waitFor(() => expect(probe.validated).toHaveLength(1));
    await new Promise((resolve) => setTimeout(resolve, 400));
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
    const probe = await mount('Hi {{a}}');
    await vi.waitFor(() => expect(find('[contenteditable=true] p').textContent).toContain('A'));

    probe.declare(smsProfile({ variables: [{ ...declared[0], label: 'First name' }, declared[1]] }));
    await vi.waitFor(() => expect(find('[contenteditable=true] p').textContent).toContain('First name'));

    const count = probe.validated.length;
    probe.declare(smsProfile({ variables: [{ ...declared[0], label: 'First name' }, declared[1]] }));
    await new Promise((resolve) => setTimeout(resolve, 400));
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
    await userEvent.click(await vi.waitFor(() => find('[contenteditable=true] p')));
    const data = new DataTransfer();
    data.setData('text/plain', 'a\n\nb {{a}}');
    find('[contenteditable=true]').dispatchEvent(
      new ClipboardEvent('paste', { clipboardData: data, bubbles: true, cancelable: true }),
    );
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

    await new Promise((resolve) => setTimeout(resolve, 400));
    expect(probe.reported).toEqual([]);
    expect(probe.editor.getText()).toBe('Hello');
    expect(document.querySelector('[data-slot=variable-menu]')).toBeNull();
  });
});
