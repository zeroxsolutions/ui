import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

import {
  AvatarPicker,
  AvatarPickerColor,
  AvatarPickerContent,
  AvatarPickerEmoji,
  AvatarPickerTrigger,
  AvatarPickerUpload,
} from './avatar-picker';

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

const openEditor = () => fireEvent.click(screen.getByRole('button', { name: 'Edit avatar' }));

describe('AvatarPicker', () => {
  it('shows only the Upload pane (no tab strip) when Upload is the only tab', () => {
    render(
      <AvatarPicker value={{}} onValueChange={vi.fn()}>
        <AvatarPickerTrigger>
          <span>avatar</span>
        </AvatarPickerTrigger>
        <AvatarPickerContent>
          <AvatarPickerUpload />
        </AvatarPickerContent>
      </AvatarPicker>,
    );
    openEditor();

    expect(screen.getByText('Click to upload an image')).toBeTruthy();
    // A single tab hides the strip — no emoji/color triggers.
    expect(screen.queryByRole('tab', { name: 'emoji' })).toBeNull();
    expect(screen.queryByRole('tab', { name: 'color' })).toBeNull();
  });

  it('builds the icon strip from the tab parts the consumer includes', () => {
    render(
      <AvatarPicker value={{}} onValueChange={vi.fn()}>
        <AvatarPickerTrigger>
          <span>avatar</span>
        </AvatarPickerTrigger>
        <AvatarPickerContent>
          <AvatarPickerEmoji />
          <AvatarPickerUpload />
          <AvatarPickerColor />
        </AvatarPickerContent>
      </AvatarPicker>,
    );
    openEditor();

    expect(screen.getByRole('tab', { name: 'emoji' })).toBeTruthy();
    expect(screen.getByRole('tab', { name: 'upload' })).toBeTruthy();
    expect(screen.getByRole('tab', { name: 'color' })).toBeTruthy();
  });

  it('lets children override the upload copy', () => {
    render(
      <AvatarPicker value={{}} onValueChange={vi.fn()}>
        <AvatarPickerTrigger>
          <span>avatar</span>
        </AvatarPickerTrigger>
        <AvatarPickerContent>
          <AvatarPickerUpload>Tải ảnh lên</AvatarPickerUpload>
        </AvatarPickerContent>
      </AvatarPicker>,
    );
    openEditor();

    expect(screen.getByText('Tải ảnh lên')).toBeTruthy();
    expect(screen.queryByText('Click to upload an image')).toBeNull();
  });

  it('hands the picked file to onUpload and adopts the resolved URL (not a data URL)', async () => {
    const onUpload = vi.fn().mockResolvedValue('https://cdn.example/a.png');
    const onChange = vi.fn();
    render(
      <AvatarPicker value={{}} onValueChange={onChange}>
        <AvatarPickerTrigger>
          <span>avatar</span>
        </AvatarPickerTrigger>
        <AvatarPickerContent>
          <AvatarPickerUpload onUpload={onUpload} />
        </AvatarPickerContent>
      </AvatarPicker>,
    );
    openEditor();

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
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
      <AvatarPicker value={{ emoji: '😀' }} onValueChange={onChange}>
        <AvatarPickerTrigger>
          <span>avatar</span>
        </AvatarPickerTrigger>
        <AvatarPickerContent>
          <AvatarPickerUpload />
        </AvatarPickerContent>
      </AvatarPicker>,
    );
    openEditor();

    fireEvent.click(screen.getByRole('button', { name: 'Remove avatar' }));
    expect(onChange).toHaveBeenCalledWith({ emoji: null, imageUrl: null });
  });
});
