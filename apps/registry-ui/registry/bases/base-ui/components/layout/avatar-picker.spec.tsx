import type { Popover as PopoverPrimitive } from '@base-ui/react/popover';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { Palette, Smile, Upload } from 'lucide-react';
import { createRef, type MouseEvent, type ReactNode } from 'react';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

import { Tabs, TabsList, TabsTrigger } from '@/registry/bases/base-ui/ui/tabs';

import {
  AvatarPicker,
  AvatarPickerColor,
  AvatarPickerContent,
  AvatarPickerEmoji,
  AvatarPickerRemove,
  AvatarPickerTrigger,
  AvatarPickerUpload,
  type AvatarPickerTab,
  type AvatarPickerValue,
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

function Picker({
  value = {},
  onValueChange = vi.fn(),
  defaultTab,
  strip = true,
  onRemove,
  children,
}: {
  value?: AvatarPickerValue;
  onValueChange?: (value: AvatarPickerValue) => void;
  defaultTab: AvatarPickerTab;
  strip?: boolean;
  onRemove?: (event: MouseEvent<HTMLButtonElement>) => void;
  children: ReactNode;
}) {
  return (
    <AvatarPicker value={value} onValueChange={onValueChange}>
      <AvatarPickerTrigger>
        <span>avatar</span>
      </AvatarPickerTrigger>
      <AvatarPickerContent>
        <Tabs defaultValue={defaultTab}>
          <div className="flex items-center gap-1">
            {strip && (
              <TabsList variant="line">
                <TabsTrigger value="emoji" aria-label="Emoji" className="flex-none">
                  <Smile />
                </TabsTrigger>
                <TabsTrigger value="upload" aria-label="Upload" className="flex-none">
                  <Upload />
                </TabsTrigger>
                <TabsTrigger value="color" aria-label="Color" className="flex-none">
                  <Palette />
                </TabsTrigger>
              </TabsList>
            )}
            <AvatarPickerRemove className="ml-auto" onClick={onRemove} />
          </div>
          {children}
        </Tabs>
      </AvatarPickerContent>
    </AvatarPicker>
  );
}

const openEditor = () => fireEvent.click(screen.getByRole('button', { name: 'Edit avatar' }));

describe('AvatarPicker', () => {
  it('shows only the pane the consumer composes when it declares no tab strip', () => {
    render(
      <Picker defaultTab="upload" strip={false}>
        <AvatarPickerUpload />
      </Picker>,
    );
    openEditor();

    expect(screen.getByText('Upload an image')).toBeTruthy();
    expect(screen.queryByRole('tab')).toBeNull();
  });

  it('switches panes through the tabs the consumer declares', () => {
    render(
      <Picker defaultTab="upload">
        <AvatarPickerEmoji />
        <AvatarPickerUpload />
        <AvatarPickerColor />
      </Picker>,
    );
    openEditor();

    expect(screen.getAllByRole('tab').map((tab) => tab.getAttribute('aria-label'))).toEqual([
      'Emoji',
      'Upload',
      'Color',
    ]);
    fireEvent.click(screen.getByRole('tab', { name: 'Color' }));
    expect(screen.getByRole('button', { name: '#6366f1' })).toBeTruthy();
  });

  it('keeps a pane wrapped in a consumer component reachable through its tab', () => {
    function UploadWrapper({ children }: { children: ReactNode }) {
      return <div data-testid="upload-wrapper">{children}</div>;
    }
    render(
      <Picker defaultTab="emoji">
        <AvatarPickerEmoji />
        <UploadWrapper>
          <AvatarPickerUpload />
        </UploadWrapper>
        <AvatarPickerColor />
      </Picker>,
    );
    openEditor();

    expect(screen.queryByText('Upload an image')).toBeNull();
    fireEvent.click(screen.getByRole('tab', { name: 'Upload' }));
    expect(screen.getByText('Upload an image')).toBeTruthy();
  });

  it('lets children override the upload copy', () => {
    render(
      <Picker defaultTab="upload">
        <AvatarPickerUpload>Upload a photo</AvatarPickerUpload>
      </Picker>,
    );
    openEditor();

    expect(screen.getByText('Upload a photo')).toBeTruthy();
    expect(screen.queryByText('Upload an image')).toBeNull();
  });

  it('opens the file picker from its button', () => {
    const click = vi.spyOn(HTMLInputElement.prototype, 'click').mockImplementation(() => {});
    render(
      <Picker defaultTab="upload">
        <AvatarPickerUpload />
      </Picker>,
    );
    openEditor();

    fireEvent.click(screen.getByRole('button', { name: 'Choose image' }));
    expect(click).toHaveBeenCalledTimes(1);
    click.mockRestore();
  });

  it('names the custom colour field by its label, which children replace', () => {
    render(
      <Picker defaultTab="color">
        <AvatarPickerColor>Pick any</AvatarPickerColor>
      </Picker>,
    );
    openEditor();

    expect(screen.getByText('Pick any').getAttribute('for')).toBe(screen.getByLabelText('Custom color').id);
  });

  it('marks the upload pane data-uploading until onUpload settles, then adopts the resolved URL', async () => {
    let resolve: (url: string) => void = () => {};
    const onUpload = vi.fn(() => new Promise<string>((r) => (resolve = r)));
    const onChange = vi.fn();
    render(
      <Picker defaultTab="upload" onValueChange={onChange}>
        <AvatarPickerUpload onUpload={onUpload} />
      </Picker>,
    );
    openEditor();

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['x'], 'a.png', { type: 'image/png' });
    fireEvent.change(input, { target: { files: [file] } });

    expect(onUpload).toHaveBeenCalledWith(file);
    const pane = document.querySelector('[data-slot="avatar-picker-upload"]') as HTMLElement;
    expect(pane.hasAttribute('data-uploading')).toBe(true);

    resolve('https://cdn.example/a.png');
    await waitFor(() => expect(pane.hasAttribute('data-uploading')).toBe(false));
    expect(onChange).toHaveBeenCalledWith({ imageUrl: 'https://cdn.example/a.png', emoji: null });
  });

  it('clears data-uploading once a rejected onUpload settles, without adopting a URL', async () => {
    let reject: (reason: unknown) => void = () => {};
    const onUpload = vi.fn(() => new Promise<string | null>((_resolve, r) => (reject = r)));
    const onChange = vi.fn();
    render(
      <Picker defaultTab="upload" onValueChange={onChange}>
        <AvatarPickerUpload onUpload={onUpload} />
      </Picker>,
    );
    openEditor();

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['x'], 'a.png', { type: 'image/png' });
    fireEvent.change(input, { target: { files: [file] } });

    const pane = document.querySelector('[data-slot="avatar-picker-upload"]') as HTMLElement;
    expect(pane.hasAttribute('data-uploading')).toBe(true);

    reject(new Error('upload failed'));
    await waitFor(() => expect(pane.hasAttribute('data-uploading')).toBe(false));
    expect(onChange).not.toHaveBeenCalled();
  });

  it("clears emoji and image on Remove and still runs the consumer's onClick", () => {
    const onChange = vi.fn();
    const onRemove = vi.fn();
    render(
      <Picker defaultTab="upload" value={{ emoji: 'x' }} onValueChange={onChange} onRemove={onRemove}>
        <AvatarPickerUpload />
      </Picker>,
    );
    openEditor();

    fireEvent.click(screen.getByRole('button', { name: 'Remove avatar' }));
    expect(onChange).toHaveBeenCalledWith({ emoji: null, imageUrl: null });
    expect(onRemove).toHaveBeenCalledTimes(1);
  });

  it("skips remove when the consumer's onClick prevents default, but still runs it", () => {
    const onChange = vi.fn();
    const onRemove = vi.fn((event: MouseEvent<HTMLButtonElement>) => event.preventDefault());
    render(
      <Picker defaultTab="upload" value={{ emoji: 'x' }} onValueChange={onChange} onRemove={onRemove}>
        <AvatarPickerUpload />
      </Picker>,
    );
    openEditor();

    fireEvent.click(screen.getByRole('button', { name: 'Remove avatar' }));
    expect(onRemove).toHaveBeenCalledTimes(1);
    expect(onChange).not.toHaveBeenCalled();
  });

  it('marks the current colour swatch pressed and sets the colour on a click', () => {
    const onChange = vi.fn();
    render(
      <Picker defaultTab="color" value={{ color: '#ec4899' }} onValueChange={onChange}>
        <AvatarPickerColor />
      </Picker>,
    );
    openEditor();

    expect(screen.getByRole('button', { name: '#ec4899' }).getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByRole('button', { name: '#6366f1' }).getAttribute('aria-pressed')).toBe('false');
    fireEvent.click(screen.getByRole('button', { name: '#6366f1' }));
    expect(onChange).toHaveBeenCalledWith({ color: '#6366f1' });
  });

  it('hands upstream Popover the root props it does not read', async () => {
    const actionsRef = createRef<PopoverPrimitive.Root.Actions>();
    render(
      <AvatarPicker value={{}} onValueChange={vi.fn()} defaultOpen actionsRef={actionsRef}>
        <AvatarPickerTrigger>
          <span>avatar</span>
        </AvatarPickerTrigger>
        <AvatarPickerContent>
          <Tabs defaultValue="color">
            <AvatarPickerColor />
          </Tabs>
        </AvatarPickerContent>
      </AvatarPicker>,
    );
    expect(screen.getByRole('button', { name: '#6366f1' })).toBeTruthy();

    act(() => actionsRef.current?.close());

    await waitFor(() => expect(screen.queryByRole('button', { name: '#6366f1' })).toBeNull());
  });
});
