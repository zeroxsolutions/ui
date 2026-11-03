/// <reference types="vite/client" />
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import type { ComponentType } from 'react';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

// code-block-demo renders CodeBlock, which highlights asynchronously through the
// shared Shiki highlighter; mocking it keeps this spec deterministic, the same
// way code-block.spec.tsx does for the component's own tests.
vi.mock('../lib/shiki', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../lib/shiki')>();
  return { ...actual, highlightToLines: vi.fn().mockResolvedValue(null) };
});

import { CommandMenuDemo } from './command-menu-demo';
import { PermissionCardDemo } from './permission-card-demo';

beforeAll(() => {
  Element.prototype.scrollIntoView = () => {};
  Element.prototype.getAnimations ??= () => [];
  globalThis.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
  window.matchMedia ??= () =>
    ({
      matches: false,
      addEventListener: () => {},
      removeEventListener: () => {},
    }) as unknown as MediaQueryList;
});

afterEach(cleanup);

/** What one example file exports, by export name. */
type ExampleModule = Record<string, ComponentType>;

// Next's global types declare `import.meta.glob` without Vite's module type parameter, and theirs is
// the declaration that wins, so the module shape is asserted here instead.
const MODULES = import.meta.glob(['./*.tsx', '!./*.spec.tsx', '!./__index__.tsx', '!./__components__.tsx'], {
  eager: true,
}) as Record<string, ExampleModule>;

const EXAMPLES = Object.entries(MODULES).flatMap(([path, module]) =>
  Object.entries(module).map(([exportName, Example]) => ({
    file: path.slice('./'.length, -'.tsx'.length),
    exportName,
    Example,
  })),
);

describe('examples', () => {
  it.each(EXAMPLES)('$file renders $exportName', async ({ Example }) => {
    const { container } = render(<Example />);
    // An upstream ScrollArea measures its viewport in a queueMicrotask outside
    // render's own act() batch; settle it so no example leaves a state update
    // to land after the test has moved on.
    await act(async () => {});
    expect(container.firstChild).not.toBeNull();
  });

  it('permission-card-demo shows the session wording after allowing for the session', async () => {
    render(<PermissionCardDemo />);
    fireEvent.click(screen.getByRole('button', { name: 'More allow options' }));
    fireEvent.click(await screen.findByRole('menuitem', { name: 'Allow this session' }));
    expect(await screen.findByText('Allowed for this session - 2:14pm')).toBeTruthy();
  });

  it('command-menu-demo loads closed and opens from its button', async () => {
    render(<CommandMenuDemo />);
    await act(async () => {});
    expect(screen.queryByRole('dialog')).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Open menu' }));
    expect(await screen.findByRole('dialog')).toBeTruthy();
  });

  it('command-menu-demo opens on Ctrl+K', async () => {
    render(<CommandMenuDemo />);
    await act(async () => {});
    expect(screen.queryByRole('dialog')).toBeNull();

    fireEvent.keyDown(document, { key: 'k', ctrlKey: true });
    expect(await screen.findByRole('dialog')).toBeTruthy();
  });
});
