import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { FileContentRouter, fileView } from './file-content-router.js';

afterEach(() => {
  cleanup();
});

describe('fileView', () => {
  it('classifies images and fonts to their previews', () => {
    expect(fileView('assets/logo.png')).toEqual({ view: 'image' });
    expect(fileView('assets/Inter.woff2')).toEqual({ view: 'font' });
  });

  it('classifies known code/data to an editable code view with a language', () => {
    expect(fileView('scripts/run.py')).toEqual({
      view: 'code',
      language: 'python',
    });
    expect(fileView('manifest.json')).toEqual({
      view: 'code',
      language: 'json',
    });
    expect(fileView('component.tsx')).toEqual({
      view: 'code',
      language: 'tsx',
    });
  });

  it('treats Markdown as editable code (markdown highlight), preview is opt-in', () => {
    expect(fileView('SKILL.md')).toEqual({
      view: 'code',
      language: 'markdown',
    });
  });

  it('falls back to binary for unknown extensions', () => {
    expect(fileView('data.bin')).toEqual({ view: 'binary' });
    expect(fileView('archive.zip')).toEqual({ view: 'binary' });
  });
});

describe('FileContentRouter', () => {
  it('renders Markdown through the prose view', () => {
    render(<FileContentRouter file={{ path: 'README.md', view: 'markdown', text: '# Title' }} />);
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
    const { container } = render(<FileContentRouter file={{ path: 'data.bin', view: 'binary' }} />);
    expect(container.querySelector('[data-slot="empty"]')).toBeTruthy();
    expect(screen.getByText('data.bin')).toBeTruthy();
  });

  it('truncates a long binary file name instead of overflowing', () => {
    const path = 'src/generated/a-very-long-vendored-binary-artifact-name.wasm';
    const { container } = render(<FileContentRouter file={{ path, view: 'binary' }} />);
    const title = container.querySelector('[data-slot="empty-title"]');
    expect(title?.className).toContain('truncate');
  });

  it('lets children override the binary fallback', () => {
    render(
      <FileContentRouter file={{ path: 'data.bin', view: 'binary' }}>
        <p>Custom fallback</p>
      </FileContentRouter>,
    );
    expect(screen.getByText('Custom fallback')).toBeTruthy();
  });

  it('exposes the routed view as a data attribute', () => {
    const { container } = render(<FileContentRouter file={{ path: 'logo.png', view: 'image', src: 'blob:logo' }} />);
    expect(container.querySelector('[data-slot="file-content-router"]')?.getAttribute('data-view')).toBe('image');
  });
});
