import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { packageManagerCommands } from '@/lib/package-manager-commands';

const commands = packageManagerCommands('npx shadcn@latest add x')!;

/**
 * Renders a block from a fresh module graph: the config store keeps a refused choice in module state,
 * and a fresh import keeps one case's store out of the next. Settles the scroll area's measuring.
 */
async function renderBlock() {
  const { CodeBlockCommand } = await import('./code-block-command');
  const result = render(<CodeBlockCommand commands={commands} />);
  await act(async () => {});
  return result;
}

/** The command the block shows. */
function shownCommand(): string | null {
  return document.querySelector('[data-slot="highlighted-code"]')?.textContent ?? null;
}

let writeText: ReturnType<typeof vi.fn>;

beforeAll(() => {
  // The block's scroll area measures with a ResizeObserver and reads getAnimations, both absent in jsdom.
  globalThis.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
  Element.prototype.getAnimations ??= () => [];
});

// The first import transforms the block's whole graph, which alone can outrun a case's timeout under a
// loaded run; warming it here leaves each case only the fresh evaluation.
beforeAll(async () => {
  await import('./code-block-command');
}, 30_000);

beforeEach(() => {
  writeText = vi.fn(() => Promise.resolve());
  // Only the clipboard is faked: the fresh import reads the real navigator's user agent.
  Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.resetModules();
  localStorage.clear();
});

describe('CodeBlockCommand', () => {
  it('shows the pnpm command first, and the npm one under npm', async () => {
    await renderBlock();

    expect(shownCommand()).toBe('pnpm dlx shadcn@latest add x');

    fireEvent.click(screen.getByRole('tab', { name: 'npm' }));

    expect(shownCommand()).toBe('npx shadcn@latest add x');
  });

  it('copies the command the chosen tab shows', async () => {
    await renderBlock();
    fireEvent.click(screen.getByRole('tab', { name: 'yarn' }));

    fireEvent.click(screen.getByRole('button', { name: 'Copy code' }));

    await waitFor(() => expect(writeText).toHaveBeenCalledWith('yarn dlx shadcn@latest add x'));
  });

  it('remembers the chosen manager for the next block', async () => {
    await renderBlock();
    fireEvent.click(screen.getByRole('tab', { name: 'bun' }));
    cleanup();

    await renderBlock();

    expect(shownCommand()).toBe('bunx --bun shadcn@latest add x');
    expect(JSON.parse(localStorage.getItem('config')!)).toMatchObject({ packageManager: 'bun' });
  });

  it('still switches when storage refuses the choice', async () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError');
    });
    await renderBlock();

    fireEvent.click(screen.getByRole('tab', { name: 'npm' }));

    expect(shownCommand()).toBe('npx shadcn@latest add x');
  });
});
