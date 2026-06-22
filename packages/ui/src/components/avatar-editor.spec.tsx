import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

import {
  AvatarEditor,
  AvatarEditorColor,
  AvatarEditorContent,
  AvatarEditorEmoji,
  AvatarEditorTrigger,
  AvatarEditorUpload,
} from './avatar-editor';

beforeAll(() => {
  Element.prototype.scrollIntoView = vi.fn();
  // Base UI's popover positioning needs ResizeObserver, absent in jsdom.
  globalThis.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
});

afterEach(() => {
  cleanup();
});

const openEditor = () =>
  fireEvent.click(screen.getByRole('button', { name: 'Edit avatar' }));

describe('AvatarEditor', () => {
  it('shows only the Upload pane (no tab strip) when Upload is the only tab', () => {
    render(
      <AvatarEditor value={{}} onChange={vi.fn()}>
        <AvatarEditorTrigger>
          <span>avatar</span>
        </AvatarEditorTrigger>
        <AvatarEditorContent>
          <AvatarEditorUpload />
        </AvatarEditorContent>
      </AvatarEditor>,
    );
    openEditor();

    expect(screen.getByText('Click to upload an image')).toBeTruthy();
    // A single tab hides the strip — no emoji/color triggers.
    expect(screen.queryByRole('tab', { name: 'emoji' })).toBeNull();
    expect(screen.queryByRole('tab', { name: 'color' })).toBeNull();
  });

  it('builds the icon strip from the tab parts the consumer includes', () => {
    render(
      <AvatarEditor value={{}} onChange={vi.fn()}>
        <AvatarEditorTrigger>
          <span>avatar</span>
        </AvatarEditorTrigger>
        <AvatarEditorContent>
          <AvatarEditorEmoji />
          <AvatarEditorUpload />
          <AvatarEditorColor />
        </AvatarEditorContent>
      </AvatarEditor>,
    );
    openEditor();

    expect(screen.getByRole('tab', { name: 'emoji' })).toBeTruthy();
    expect(screen.getByRole('tab', { name: 'upload' })).toBeTruthy();
    expect(screen.getByRole('tab', { name: 'color' })).toBeTruthy();
  });

  it('lets children override the upload copy', () => {
    render(
      <AvatarEditor value={{}} onChange={vi.fn()}>
        <AvatarEditorTrigger>
          <span>avatar</span>
        </AvatarEditorTrigger>
        <AvatarEditorContent>
          <AvatarEditorUpload>Tải ảnh lên</AvatarEditorUpload>
        </AvatarEditorContent>
      </AvatarEditor>,
    );
    openEditor();

    expect(screen.getByText('Tải ảnh lên')).toBeTruthy();
    expect(screen.queryByText('Click to upload an image')).toBeNull();
  });

  it('hands the picked file to onUpload and adopts the resolved URL (not a data URL)', async () => {
    const onUpload = vi.fn().mockResolvedValue('https://cdn.example/a.png');
    const onChange = vi.fn();
    render(
      <AvatarEditor value={{}} onChange={onChange}>
        <AvatarEditorTrigger>
          <span>avatar</span>
        </AvatarEditorTrigger>
        <AvatarEditorContent>
          <AvatarEditorUpload onUpload={onUpload} />
        </AvatarEditorContent>
      </AvatarEditor>,
    );
    openEditor();

    const input = document.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;
    const file = new File(['x'], 'a.png', { type: 'image/png' });
    fireEvent.change(input, { target: { files: [file] } });

    expect(onUpload).toHaveBeenCalledWith(file);
    await waitFor(() =>
      expect(onChange).toHaveBeenCalledWith({
        imageUrl: 'https://cdn.example/a.png',
        emoji: null,
      }),
    );
  });

  it('clears emoji and image on Remove', () => {
    const onChange = vi.fn();
    render(
      <AvatarEditor value={{ emoji: '😀' }} onChange={onChange}>
        <AvatarEditorTrigger>
          <span>avatar</span>
        </AvatarEditorTrigger>
        <AvatarEditorContent>
          <AvatarEditorUpload />
        </AvatarEditorContent>
      </AvatarEditor>,
    );
    openEditor();

    fireEvent.click(screen.getByRole('button', { name: 'Remove avatar' }));
    expect(onChange).toHaveBeenCalledWith({ emoji: null, imageUrl: null });
  });
});
