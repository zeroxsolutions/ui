import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { packageManagerCommands } from '@/lib/highlight-code';

const commands = packageManagerCommands('npx shadcn@latest add x')!;

/**
 * Renders a block from a fresh module graph: the config store keeps a refused choice in module state,
 * and a fresh import keeps one case's store out of the next.
 */
async function renderBlock() {
  const { CodeBlockCommand } = await import('./code-block-command');
  return render(
    <CodeBlockCommand
      __npm__={commands.npm}
      __yarn__={commands.yarn}
      __pnpm__={commands.pnpm}
      __bun__={commands.bun}
    />,
  );
}

let writeText: ReturnType<typeof vi.fn>;

beforeEach(() => {
  writeText = vi.fn(() => Promise.resolve());
  // Only the clipboard is faked: the fresh import reads the real navigator's user agent.
  Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  vi.resetModules();
  localStorage.clear();
});

describe('CodeBlockCommand', () => {
  it('shows the pnpm command first, and the npm one under npm', async () => {
    await renderBlock();

    expect(screen.getByRole('tabpanel').textContent).toBe('pnpm dlx shadcn@latest add x');

    fireEvent.click(screen.getByRole('tab', { name: 'npm' }));

    expect(screen.getByRole('tabpanel').textContent).toBe('npx shadcn@latest add x');
  });

  it('copies the command the chosen tab shows', async () => {
    await renderBlock();
    fireEvent.click(screen.getByRole('tab', { name: 'yarn' }));

    fireEvent.click(screen.getByRole('button', { name: 'Copy' }));

    await waitFor(() => expect(writeText).toHaveBeenCalledWith('yarn dlx shadcn@latest add x'));
  });

  it('remembers the chosen manager for the next block', async () => {
    await renderBlock();
    fireEvent.click(screen.getByRole('tab', { name: 'bun' }));
    cleanup();

    await renderBlock();

    expect(screen.getByRole('tabpanel').textContent).toBe('bunx --bun shadcn@latest add x');
    expect(JSON.parse(localStorage.getItem('config')!)).toMatchObject({ packageManager: 'bun' });
  });

  it('still switches when storage refuses the choice', async () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError');
    });
    await renderBlock();

    fireEvent.click(screen.getByRole('tab', { name: 'npm' }));

    expect(screen.getByRole('tabpanel').textContent).toBe('npx shadcn@latest add x');
  });
});
