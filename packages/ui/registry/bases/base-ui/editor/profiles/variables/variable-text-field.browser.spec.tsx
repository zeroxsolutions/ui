import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { page, userEvent } from 'vitest/browser';
import type { VariableDeclaration } from '@zeroxsolutions/editor-core/profiles/index';
import '../../../../../../test/nova-style.css';
import '../../styles.css';
import { VariableTextField } from './variable-text-field';

const declared: VariableDeclaration[] = [
  { name: 'name', type: 'string', label: 'Name' },
  { name: 'tripUrl', type: 'url', label: 'Trip link' },
];

interface Probe {
  values: string[];
  commits: string[];
}

function Host({ initial, disabled, probe }: { initial: string; disabled?: boolean; probe: Probe }) {
  const [value, setValue] = useState(initial);
  const [invalid, setInvalid] = useState(false);
  return (
    <div className="style-nova p-12">
      <VariableTextField
        value={value}
        onValueChange={(next) => {
          probe.values.push(next);
          setValue(next);
        }}
        onCommit={(next) => probe.commits.push(next)}
        declarations={() => declared}
        label="Label"
        disabled={disabled}
        invalid={invalid}
        className="cn-input"
      />
      <button type="button" onClick={() => setValue('Reset {{tripUrl}}')}>
        Load
      </button>
      <button type="button" onClick={() => setInvalid(true)}>
        Invalidate
      </button>
    </div>
  );
}

async function mount(initial = '', disabled = false): Promise<Probe> {
  const probe: Probe = { values: [], commits: [] };
  await render(<Host initial={initial} disabled={disabled} probe={probe} />);
  await expect.element(field()).toBeInTheDocument();
  return probe;
}

const field = () => page.getByRole('textbox', { name: 'Label' });
const last = (values: string[]) => values[values.length - 1];
const menu = () => page.getByTestId('trigger-menu');

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

describe('VariableTextField', () => {
  it('draws each token of its value as a chip, and an undeclared one marked', async () => {
    await mount('Continue {{name}} at {{place}}');

    await expect.element(field().getByText('Name')).toHaveAttribute('data-slot', 'variable');
    await expect.element(field().getByText('place')).toHaveAttribute('data-problem', 'variable-undeclared');
  });

  it('inserts the variable chosen in the {{ menu, reported as its token', async () => {
    const probe = await mount('Continue');
    await userEvent.click(field());
    await userEvent.keyboard('{End} {{{{tr');
    await expect.element(menu()).toHaveTextContent('Trip');
    await userEvent.keyboard('{Enter}');

    await vi.waitFor(() => expect(last(probe.values)).toBe('Continue {{tripUrl}}'));
    expect(probe.commits).toEqual([]);
  });

  it('turns a typed token into a chip', async () => {
    const probe = await mount();
    await userEvent.click(field());
    await userEvent.keyboard('https://x.test/a?t={{{{name}}');

    await vi.waitFor(() => expect(last(probe.values)).toBe('https://x.test/a?t={{name}}'));
    await expect.element(field().getByText('Name')).toHaveAttribute('data-slot', 'variable');
  });

  it('commits on Enter and breaks no line on Enter or Shift+Enter', async () => {
    const probe = await mount('Go');
    await userEvent.click(field());
    await userEvent.keyboard('{End}{Shift>}{Enter}{/Shift}{Enter}');

    await vi.waitFor(() => expect(probe.commits).toEqual(['Go']));
    expect(probe.values).toEqual([]);
    expect(field().element().querySelectorAll('p')).toHaveLength(1);
  });

  it('lands pasted lines as one line, their tokens as chips', async () => {
    const probe = await mount();
    await copyText('Hi\n{{name}}');
    await userEvent.click(field());
    await userEvent.paste();

    await vi.waitFor(() => expect(last(probe.values)).toBe('Hi {{name}}'));
    await expect.element(field().getByText('Name')).toHaveAttribute('data-slot', 'variable');
  });

  it('loads a value from outside, and reports no change for it', async () => {
    const probe = await mount('Go');
    await userEvent.click(page.getByRole('button', { name: 'Load' }));

    await expect.element(field().getByText('Trip link')).toBeVisible();
    expect(probe.values).toEqual([]);
  });

  it('takes no typing and opens no menu while disabled', async () => {
    const probe = await mount('Go', true);
    await expect.element(field()).toHaveAttribute('aria-disabled', 'true');
    await userEvent.click(field(), { force: true });
    await userEvent.keyboard('x{{{{');
    // A load drawn after the keys shows the keys were handled before the absence is read.
    await userEvent.click(page.getByRole('button', { name: 'Load' }));
    await expect.element(field().getByText('Trip link')).toBeVisible();

    await expect.element(menu()).not.toBeInTheDocument();
    expect(probe.values).toEqual([]);
  });

  it('tells assistive technology it is invalid once the host marks it', async () => {
    await mount('Go');
    await expect.element(field()).not.toHaveAttribute('aria-invalid');

    await userEvent.click(page.getByRole('button', { name: 'Invalidate' }));

    await expect.element(field()).toHaveAttribute('aria-invalid', 'true');
  });
});
