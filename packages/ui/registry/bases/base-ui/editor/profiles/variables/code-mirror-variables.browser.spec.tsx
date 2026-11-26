import { useState } from 'react';
import { describe, expect, it, onTestFinished, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { page, userEvent } from 'vitest/browser';
import type { VariableDeclaration } from '@zeroxsolutions/editor-core/profiles/index';
import '../../../../../../test/nova-style.css';
import { CodeMirrorPane } from '../../shared/code-mirror/index';
import { codeMirrorVariables } from './code-mirror-variables';

const declared: VariableDeclaration[] = [
  { name: 'name', type: 'string', label: 'Name' },
  { name: 'resetUrl', type: 'url', label: 'Reset link' },
  { name: 'expiresIn', type: 'duration' },
];

interface Probe {
  value: string;
  /** Says the declarations changed, as the variable feature's `refreshVariables` does. */
  refresh(): void;
}

function Pane({
  initial,
  probe,
  declarations,
  language,
}: {
  initial: string;
  probe: Probe;
  declarations: VariableDeclaration[];
  language?: string;
}) {
  const [value, setValue] = useState(initial);
  const [extensions] = useState(() => {
    const listeners = new Set<() => void>();
    probe.refresh = () => listeners.forEach((listener) => listener());
    return codeMirrorVariables({
      declarations: () => declarations,
      subscribe: (listener) => {
        listeners.add(listener);
        return () => listeners.delete(listener);
      },
      icon: (declaration) => <svg data-icon={declaration.type} />,
    });
  });
  return (
    <div className="style-nova">
      <CodeMirrorPane
        value={value}
        language={language}
        extensions={extensions}
        onValueChange={(next) => {
          probe.value = next;
          setValue(next);
        }}
        className="h-48"
      />
      <button type="button">Elsewhere</button>
    </div>
  );
}

async function mount(
  initial: string,
  { language, declarations = declared }: { language?: string; declarations?: VariableDeclaration[] } = {},
): Promise<Probe> {
  const probe: Probe = { value: initial, refresh: () => {} };
  await render(<Pane initial={initial} probe={probe} declarations={declarations} language={language} />);
  return probe;
}

function content(): HTMLElement {
  const found = document.querySelector<HTMLElement>('.cm-content');
  if (!found) throw new Error('the pane has no editable content');
  return found;
}

const tokens = () => [...content().querySelectorAll<HTMLElement>('[data-variable]')];
const optionLabels = () => [...document.querySelectorAll('[role=option]')].map((option) => option.textContent);

async function typeAtEnd(text: string): Promise<void> {
  await userEvent.click(content());
  await userEvent.keyboard('{ControlOrMeta>}{End}{/ControlOrMeta}');
  await userEvent.keyboard(text);
}

/** How long `@codemirror/autocomplete`'s list ignores keys after it opens, its default `interactionDelay`. */
const AUTOCOMPLETE_INTERACTION_DELAY_MS = 75;

describe('variables in a code pane', () => {
  it('lists the declarations on {{, each with its icon, and filters them by label or name', async () => {
    await mount('Hi ');
    // `{{` is userEvent's escape for one literal `{`.
    await typeAtEnd('{{{{');

    await vi.waitFor(() => expect(optionLabels()).toEqual(['Name', 'Reset link', 'expiresIn']));
    expect(
      [...document.querySelectorAll('[role=option] [data-icon]')].map((icon) => icon.getAttribute('data-icon')),
    ).toEqual(['string', 'url', 'duration']);

    await userEvent.keyboard('url');
    await vi.waitFor(() => expect(optionLabels()).toEqual(['Reset link']));
  });

  it('moves the highlight with the arrows and inserts the highlighted {{name}} on Enter', async () => {
    const probe = await mount('Hi ');
    await typeAtEnd('{{{{');
    await expect.element(page.getByRole('option', { name: 'Name' })).toBeVisible();
    // The list takes an arrow pressed within its delay of opening, by the page's clock, as a caret move that closes
    // it; a person reading the list presses later, so the page's clock is moved on by the delay.
    vi.useFakeTimers({ toFake: ['Date'], now: Date.now() + AUTOCOMPLETE_INTERACTION_DELAY_MS });
    onTestFinished(() => {
      vi.useRealTimers();
    });
    await userEvent.keyboard('{ArrowDown}');
    await expect.element(page.getByRole('option', { name: 'Reset link', selected: true })).toBeInTheDocument();
    await userEvent.keyboard('{Enter}');

    await vi.waitFor(() => expect(probe.value).toBe('Hi {{resetUrl}}'));
    await expect.element(page.getByRole('listbox')).not.toBeInTheDocument();
  });

  it('takes in a }} already after the caret, so the token is not closed twice', async () => {
    const probe = await mount('Hi }}');
    await typeAtEnd('{ArrowLeft}{ArrowLeft}{{{{');
    await userEvent.click(page.getByRole('option', { name: 'Name' }));

    await vi.waitFor(() => expect(probe.value).toBe('Hi {{name}}'));
  });

  it('inserts the option pressed with the pointer', async () => {
    const probe = await mount('');
    await typeAtEnd('{{{{');
    await userEvent.click(page.getByRole('option', { name: 'expiresIn' }));

    await vi.waitFor(() => expect(probe.value).toBe('{{expiresIn}}'));
  });

  it('closes on Escape and keeps what was typed', async () => {
    const probe = await mount('');
    await typeAtEnd('{{{{na');
    await expect.element(page.getByRole('option', { name: 'Name' })).toBeVisible();

    await userEvent.keyboard('{Escape}');
    await expect.element(page.getByRole('listbox')).not.toBeInTheDocument();
    await userEvent.keyboard('{Enter}');

    await vi.waitFor(() => expect(probe.value).toBe('{{na\n'));
  });

  it('closes when the pane loses the focus', async () => {
    await mount('');
    await typeAtEnd('{{{{na');
    await expect.element(page.getByRole('option', { name: 'Name' })).toBeVisible();

    await userEvent.click(page.getByRole('button', { name: 'Elsewhere' }));

    await expect.element(page.getByRole('listbox')).not.toBeInTheDocument();
  });

  it('draws each token in place, the one no declaration names marked as undeclared', async () => {
    await mount('Hi {{name}}, {{ghost}} expires in {{expiresIn}}', { language: 'typescript' });

    await vi.waitFor(() =>
      expect(tokens().map((token) => [token.textContent, token.dataset.problem])).toEqual([
        ['{{name}}', undefined],
        ['{{ghost}}', 'variable-undeclared'],
        ['{{expiresIn}}', undefined],
      ]),
    );
    expect(tokens()[1].getAttribute('aria-invalid')).toBe('true');
  });

  it('marks a token typed by hand as it closes', async () => {
    await mount('');
    await typeAtEnd('{{{{ghost}}');

    await vi.waitFor(() => expect(tokens().map((token) => token.dataset.problem)).toEqual(['variable-undeclared']));
  });

  it('marks a token again once the host says the declarations changed', async () => {
    const declarations = [...declared];
    const probe = await mount('{{later}}', { declarations });
    await vi.waitFor(() => expect(tokens().map((token) => token.dataset.problem)).toEqual(['variable-undeclared']));

    declarations.push({ name: 'later', type: 'url', label: 'Later link' });
    probe.refresh();

    await vi.waitFor(() => expect(tokens().map((token) => token.dataset.problem)).toEqual([undefined]));
  });
});
