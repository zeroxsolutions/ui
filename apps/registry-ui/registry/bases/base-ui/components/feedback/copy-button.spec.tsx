import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { CopyButton } from './copy-button';

const writeText = vi.fn();

beforeEach(() => {
  writeText.mockReset().mockResolvedValue(undefined);
  Object.defineProperty(navigator, 'clipboard', {
    value: { writeText },
    configurable: true,
  });
});

afterEach(cleanup);

describe('CopyButton', () => {
  it('renders with the default accessible name', () => {
    render(<CopyButton value="hello" />);
    expect(screen.getByRole('button', { name: 'Copy' })).toBeTruthy();
  });

  it('honors a custom label and passes className through', () => {
    render(<CopyButton value="x" label="Copy source" className="size-6" />);
    expect(screen.getByRole('button', { name: 'Copy source' }).className).toContain('size-6');
  });

  it('marks itself with its slot', () => {
    render(<CopyButton value="x" />);
    expect(screen.getByRole('button', { name: 'Copy' }).dataset.slot).toBe('copy-button');
  });

  it('copies the value, flips to the copied name and carries data-copied', async () => {
    render(<CopyButton value="payload" copiedLabel="Copied!" />);
    const button = screen.getByRole('button', { name: 'Copy' });
    expect(button.hasAttribute('data-copied')).toBe(false);

    fireEvent.click(button);
    expect(writeText).toHaveBeenCalledWith('payload');
    expect(await screen.findByRole('button', { name: 'Copied!' })).toBe(button);
    expect(button.hasAttribute('data-copied')).toBe(true);
  });

  it('calls a caller onClick and still copies', () => {
    const onClick = vi.fn();
    render(<CopyButton value="payload" onClick={onClick} />);
    fireEvent.click(screen.getByRole('button', { name: 'Copy' }));
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(writeText).toHaveBeenCalledWith('payload');
  });

  it('skips the copy when a caller onClick prevents the default', () => {
    render(<CopyButton value="payload" onClick={(event) => event.preventDefault()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Copy' }));
    expect(writeText).not.toHaveBeenCalled();
  });
});
