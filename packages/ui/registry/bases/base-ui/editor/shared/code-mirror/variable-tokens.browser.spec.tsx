import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { page, userEvent } from 'vitest/browser';
import type { VariableDeclaration } from '@zeroxsolutions/editor-core/profiles/index';
import '../../../../../../test/nova-style.css';
import { CodeMirrorPane } from './code-mirror-pane';
import { variableTokens } from './variable-tokens';

const declared: VariableDeclaration[] = [
  { name: 'name', type: 'string', label: 'Name' },
  { name: 'resetUrl', type: 'url', label: 'Reset link' },
  { name: 'expiresIn', type: 'duration' },
];

interface Probe {
  value: string;
}

function Pane({ initial, probe, language }: { initial: string; probe: Probe; language?: string }) {
  const [value, setValue] = useState(initial);
  const [extensions] = useState(() => variableTokens(() => declared));
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
    </div>
  );
}

async function mount(initial: string, language?: string): Promise<Probe> {
  const probe: Probe = { value: initial };
  await render(<Pane initial={initial} probe={probe} language={language} />);
  return probe;
}

function content(): HTMLElement {
  const found = document.querySelector<HTMLElement>('.cm-content');
  if (!found) throw new Error('the pane has no editable content');
  return found;
}

const tokens = () => [...content().querySelectorAll<HTMLElement>('[data-variable]')];

async function typeAtEnd(text: string): Promise<void> {
  await userEvent.click(content());
  await userEvent.keyboard('{ControlOrMeta>}{End}{/ControlOrMeta}');
  await userEvent.keyboard(text);
}

describe('variable tokens in a code pane', () => {
  it('offers the declarations on {{, filtered by what follows, and inserts the chosen {{name}}', async () => {
    const probe = await mount('Hi ');
    // `{{` is userEvent's escape for one literal `{`.
    await typeAtEnd('{{{{');

    const list = page.getByRole('listbox');
    await expect.element(list.getByRole('option', { name: 'Name' })).toBeVisible();
    await expect.element(list.getByRole('option', { name: 'Reset link' })).toBeVisible();
    await expect.element(list.getByRole('option', { name: 'expiresIn' })).toBeVisible();

    await userEvent.keyboard('reset');
    await vi.waitFor(() =>
      expect([...document.querySelectorAll('[role=option]')].map((option) => option.textContent)).toEqual([
        'Reset link',
      ]),
    );
    await userEvent.keyboard('{Enter}');

    await vi.waitFor(() => expect(probe.value).toBe('Hi {{resetUrl}}'));
    await expect.element(page.getByRole('listbox')).not.toBeInTheDocument();
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

  it('draws each token in place, the one no declaration names marked as undeclared', async () => {
    await mount('Hi {{name}}, {{ghost}} expires in {{expiresIn}}', 'typescript');

    await vi.waitFor(() =>
      expect(tokens().map((token) => [token.textContent, token.dataset.problem])).toEqual([
        ['{{name}}', undefined],
        ['{{ghost}}', 'variable-undeclared'],
        ['{{expiresIn}}', undefined],
      ]),
    );
    const ghost = tokens()[1];
    expect(ghost.getAttribute('aria-invalid')).toBe('true');
    // Drawn in the destructive token over the syntax colour, as an undeclared chip is.
    expect(getComputedStyle(ghost).color).not.toBe(getComputedStyle(tokens()[0]).color);
  });

  it('marks a token typed by hand as it closes', async () => {
    await mount('');
    await typeAtEnd('{{{{ghost}}');

    await vi.waitFor(() => expect(tokens().map((token) => token.dataset.problem)).toEqual(['variable-undeclared']));
  });
});
