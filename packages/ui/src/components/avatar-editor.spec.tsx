import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

import { AvatarEditor } from './avatar-editor';

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
  localStorage.clear();
});

const openEditor = () =>
  fireEvent.click(screen.getByRole('button', { name: 'Edit avatar' }));

describe('AvatarEditor', () => {
  it('shows only the Upload pane (no tab strip) when tabs=["upload"]', () => {
    render(
      <AvatarEditor value={{}} onChange={vi.fn()} tabs={['upload']}>
        <span>avatar</span>
      </AvatarEditor>,
    );
    openEditor();

    expect(screen.getByText('Click to upload an image')).toBeTruthy();
    // A single tab hides the strip — no emoji/color triggers.
    expect(screen.queryByRole('tab', { name: 'emoji' })).toBeNull();
    expect(screen.queryByRole('tab', { name: 'color' })).toBeNull();
  });

  it('hands the picked file to onUpload and adopts the resolved URL (not a data URL)', async () => {
    const onUpload = vi.fn().mockResolvedValue('https://cdn.example/a.png');
    const onChange = vi.fn();
    render(
      <AvatarEditor
        value={{}}
        onChange={onChange}
        tabs={['upload']}
        onUpload={onUpload}
      >
        <span>avatar</span>
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
      <AvatarEditor value={{ emoji: '😀' }} onChange={onChange} tabs={['upload']}>
        <span>avatar</span>
      </AvatarEditor>,
    );
    openEditor();

    fireEvent.click(screen.getByRole('button', { name: 'Remove avatar' }));
    expect(onChange).toHaveBeenCalledWith({ emoji: null, imageUrl: null });
  });
});
