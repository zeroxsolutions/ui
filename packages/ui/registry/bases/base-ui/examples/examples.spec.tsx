/// <reference types="vite/client" />
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import type { ComponentType } from 'react';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

// code-card-demo renders CodeCard, which highlights asynchronously through the
// shared Shiki highlighter; mocking it keeps this spec deterministic, the same
// way code-card.spec.tsx does for the component's own tests.
vi.mock('../lib/shiki', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../lib/shiki')>();
  return { ...actual, highlightToLines: vi.fn().mockResolvedValue(null) };
});

import { Components } from './__components__';
import { EditorComponents } from './__editor-components__';
import { EditorComponentsClientOnly } from './__editor-components-client-only__';
import { Index } from './__index__';
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
const MODULES = import.meta.glob(['./*.tsx', '!./*.spec.tsx', '!./__*.tsx'], {
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
  it('splits the demos between the maps', () => {
    const plain = Object.keys(Components);
    const editor = Object.keys(EditorComponents);

    expect(plain.filter((name) => editor.includes(name))).toEqual([]);
    expect([...plain, ...editor].sort()).toEqual(Object.keys(Index).sort());
    expect(Object.keys(EditorComponentsClientOnly).sort()).toEqual([...editor].sort());
    expect(editor).toContain('document-editor-demo');
    expect(editor).toContain('chat-input-demo');
    expect(editor).not.toContain('code-card-demo');
  });

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
