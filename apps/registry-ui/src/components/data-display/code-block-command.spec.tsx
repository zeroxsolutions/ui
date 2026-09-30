import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { packageManagerCommands } from '@/lib/highlight-code';

import { CodeBlockCommand } from './code-block-command';

const commands = packageManagerCommands('npx shadcn@latest add x')!;

function renderBlock() {
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
  vi.stubGlobal('navigator', { ...navigator, clipboard: { writeText } });
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  localStorage.clear();
});

describe('CodeBlockCommand', () => {
  it('shows the pnpm command first, and the npm one under npm', () => {
    renderBlock();

    expect(screen.getByRole('tabpanel').textContent).toBe('pnpm dlx shadcn@latest add x');

    fireEvent.click(screen.getByRole('tab', { name: 'npm' }));

    expect(screen.getByRole('tabpanel').textContent).toBe('npx shadcn@latest add x');
  });

  it('copies the command the chosen tab shows', async () => {
    renderBlock();
    fireEvent.click(screen.getByRole('tab', { name: 'yarn' }));

    fireEvent.click(screen.getByRole('button', { name: 'Copy' }));

    await waitFor(() => expect(writeText).toHaveBeenCalledWith('yarn dlx shadcn@latest add x'));
  });

  it('remembers the chosen manager for the next block', () => {
    renderBlock();
    fireEvent.click(screen.getByRole('tab', { name: 'bun' }));
    cleanup();

    renderBlock();

    expect(screen.getByRole('tabpanel').textContent).toBe('bunx --bun shadcn@latest add x');
    expect(JSON.parse(localStorage.getItem('config')!)).toMatchObject({ packageManager: 'bun' });
  });

  it('still switches when storage refuses the choice', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError');
    });
    renderBlock();

    fireEvent.click(screen.getByRole('tab', { name: 'npm' }));

    expect(screen.getByRole('tabpanel').textContent).toBe('npx shadcn@latest add x');
    vi.restoreAllMocks();
  });
});
