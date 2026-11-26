import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { FileContentRouter, fileView } from './file-content-router';

// The markdown view renders upstream ScrollArea, which measures its viewport
// in a `queueMicrotask` its layout effect schedules on mount, outside of
// `render`'s own act() batch — awaiting a no-op act() settles it before the
// test's assertions run.
async function settle(): Promise<void> {
  await act(async () => {});
}

afterEach(() => {
  cleanup();
});

describe('fileView', () => {
  it('routes a file to the view its extension names', () => {
    expect(fileView('assets/logo.png')).toEqual({ view: 'image' });
    expect(fileView('scripts/run.py')).toEqual({ view: 'code', language: 'python' });
  });

  it('falls back to binary for unknown extensions', () => {
    expect(fileView('data.bin')).toEqual({ view: 'binary' });
    expect(fileView('archive.zip')).toEqual({ view: 'binary' });
  });
});

describe('FileContentRouter', () => {
  it('renders Markdown through the prose view', async () => {
    render(<FileContentRouter file={{ path: 'README.md', view: 'markdown', text: '# Title' }} />);
    await settle();
    expect(screen.getByRole('heading', { level: 1, name: 'Title' })).toBeTruthy();
  });

  it('renders an image with its alt text', () => {
    render(
      <FileContentRouter
        file={{
          path: 'logo.png',
          view: 'image',
          src: 'blob:logo',
          alt: 'Logo',
        }}
      />,
    );
    expect(screen.getByRole('img', { name: 'Logo' }).getAttribute('src')).toBe('blob:logo');
  });

  it('renders the binary fallback card with the file name', () => {
    render(<FileContentRouter file={{ path: 'data.bin', view: 'binary' }} />);
    expect(screen.getByText('data.bin')).toBeTruthy();
  });

  it('lets children override the binary fallback', () => {
    render(
      <FileContentRouter file={{ path: 'data.bin', view: 'binary' }}>
        <p>Custom fallback</p>
      </FileContentRouter>,
    );
    expect(screen.getByText('Custom fallback')).toBeTruthy();
  });
});
