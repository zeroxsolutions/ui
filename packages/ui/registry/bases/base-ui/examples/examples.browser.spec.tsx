/// <reference types="vite/client" />
import type { ComponentType } from 'react';
import { describe, expect, it } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-react';

import { CommandMenuDemo } from './command-menu-demo';
import { PermissionCardDemo } from './permission-card-demo';

/** What one example file exports, by export name. */
type ExampleModule = Record<string, ComponentType>;

// Next's global types declare `import.meta.glob` without Vite's module type parameter, and theirs is
// the declaration that wins, so the module shape is asserted here instead.
const MODULES = import.meta.glob(['./*.tsx', '!./*.spec.tsx', '!./__*.tsx'], { eager: true }) as Record<
  string,
  ExampleModule
>;

const EXAMPLES = Object.entries(MODULES).flatMap(([path, module]) =>
  Object.entries(module).map(([exportName, Example]) => ({
    file: path.slice('./'.length, -'.tsx'.length),
    exportName,
    Example,
  })),
);

describe('examples', () => {
  it.each(EXAMPLES)('$file renders $exportName', async ({ Example }) => {
    const { container } = await render(<Example />);

    expect(container.firstChild).not.toBeNull();
  });

  it('permission-card-demo shows the session wording after allowing for the session', async () => {
    await render(<PermissionCardDemo />);

    await userEvent.click(page.getByRole('button', { name: 'More allow options' }));
    await userEvent.click(page.getByRole('menuitem', { name: 'Allow this session' }));

    await expect.element(page.getByText('Allowed for this session - 2:14pm')).toBeVisible();
  });

  it('command-menu-demo loads closed and opens from its button', async () => {
    await render(<CommandMenuDemo />);
    await expect.element(page.getByRole('dialog')).not.toBeInTheDocument();

    await userEvent.click(page.getByRole('button', { name: 'Open menu' }));

    await expect.element(page.getByRole('dialog')).toBeVisible();
  });
});
