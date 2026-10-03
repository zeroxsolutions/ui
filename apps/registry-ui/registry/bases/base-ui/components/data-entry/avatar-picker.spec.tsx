import type { Popover as PopoverPrimitive } from '@base-ui/react/popover';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { Palette, Smile, Upload } from 'lucide-react';
import { createRef, type MouseEvent, type ReactNode } from 'react';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

import { Tabs, TabsList, TabsTrigger } from '@/registry/bases/base-ui/ui/tabs';

import { EmptyContent, EmptyTitle } from '@/registry/bases/base-ui/ui/empty';

import {
  AvatarPicker,
  AvatarPickerColorContent,
  AvatarPickerColorField,
  AvatarPickerColorGroup,
  AvatarPickerContent,
  AvatarPickerEmojiContent,
  AvatarPickerRemoveButton,
  AvatarPickerTrigger,
  AvatarPickerUploadContent,
  AvatarPickerUploadTrigger,
  type AvatarPickerTab,
  type AvatarPickerUploadContentProps,
  type AvatarPickerValue,
} from './avatar-picker';
import { EmojiPickerContent, EmojiPickerEmpty, EmojiPickerSearch } from './emoji-picker';

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
                <TabsTrigger value="emoji" aria-label="Emoji">
                  <Smile />
                </TabsTrigger>
                <TabsTrigger value="upload" aria-label="Upload">
                  <Upload />
                </TabsTrigger>
                <TabsTrigger value="color" aria-label="Color">
                  <Palette />
                </TabsTrigger>
              </TabsList>
            )}
            <AvatarPickerRemoveButton className="ml-auto" onClick={onRemove} />
          </div>
          {children}
        </Tabs>
      </AvatarPickerContent>
    </AvatarPicker>
  );
}

/** The upload pane as the consumer composes it: a title and the trigger. */
function UploadPane(props: AvatarPickerUploadContentProps) {
  return (
    <AvatarPickerUploadContent {...props}>
      <EmptyTitle>Upload an image</EmptyTitle>
      <EmptyContent>
        <AvatarPickerUploadTrigger>Choose image</AvatarPickerUploadTrigger>
      </EmptyContent>
    </AvatarPickerUploadContent>
  );
}

function EmojiPane() {
  return (
    <AvatarPickerEmojiContent>
      <EmojiPickerSearch />
      <EmojiPickerContent>
        <EmojiPickerEmpty>No emoji found</EmojiPickerEmpty>
      </EmojiPickerContent>
    </AvatarPickerEmojiContent>
  );
}

function ColorPane() {
  return (
    <AvatarPickerColorContent>
      <AvatarPickerColorGroup aria-label="Colors" />
      <AvatarPickerColorField>Custom</AvatarPickerColorField>
    </AvatarPickerColorContent>
  );
}

const openEditor = () => fireEvent.click(screen.getByRole('button', { name: 'Edit avatar' }));

/** WCAG 2 contrast ratio between two computed `rgb()` colours; 1 when either is not one. */
function contrastRatio(a: string, b: string): number {
  const luminance = (color: string): number | undefined => {
    const channels = /rgba?\((\d+), (\d+), (\d+)/.exec(color)?.slice(1).map(Number);
    if (!channels) return undefined;
    const [r, g, bl] = channels.map((c) => {
      const s = c / 255;
      return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * bl;
  };
  const [la, lb] = [luminance(a), luminance(b)];
  if (la === undefined || lb === undefined) return 1;
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

describe('AvatarPicker', () => {
  it('shows only the pane the consumer composes when it declares no tab strip', () => {
    render(
      <Picker defaultTab="upload" strip={false}>
        <UploadPane />
      </Picker>,
    );
    openEditor();

    expect(screen.getByText('Upload an image')).toBeTruthy();
    expect(screen.queryByRole('tab')).toBeNull();
  });

  it('switches panes through the tabs the consumer declares', () => {
    render(
      <Picker defaultTab="upload">
        <EmojiPane />
        <UploadPane />
        <ColorPane />
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

  it('shows "No emoji found" when a search in the emoji pane matches nothing', () => {
    render(
      <Picker defaultTab="emoji">
        <EmojiPane />
      </Picker>,
    );
    openEditor();

    fireEvent.change(screen.getByLabelText('Search emoji'), { target: { value: 'zzzznotanemoji' } });

    expect(screen.getByText('No emoji found')).toBeTruthy();
  });

  it('keeps a pane wrapped in a consumer component reachable through its tab', () => {
    function UploadWrapper({ children }: { children: ReactNode }) {
      return <div data-testid="upload-wrapper">{children}</div>;
    }
    render(
      <Picker defaultTab="emoji">
        <EmojiPane />
        <UploadWrapper>
          <UploadPane />
        </UploadWrapper>
        <ColorPane />
      </Picker>,
    );
    openEditor();

    expect(screen.queryByText('Upload an image')).toBeNull();
    fireEvent.click(screen.getByRole('tab', { name: 'Upload' }));
    expect(screen.getByText('Upload an image')).toBeTruthy();
  });

  it('renders the copy the consumer composes in the upload pane', () => {
    render(
      <Picker defaultTab="upload">
        <AvatarPickerUploadContent>
          <EmptyTitle>Upload a photo</EmptyTitle>
          <AvatarPickerUploadTrigger>Browse</AvatarPickerUploadTrigger>
        </AvatarPickerUploadContent>
      </Picker>,
    );
    openEditor();

    expect(screen.getByText('Upload a photo')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Browse' })).toBeTruthy();
  });

  it('opens the file picker from its trigger', () => {
    const click = vi.spyOn(HTMLInputElement.prototype, 'click').mockImplementation(() => {});
    render(
      <Picker defaultTab="upload">
        <UploadPane />
      </Picker>,
    );
    openEditor();

    fireEvent.click(screen.getByRole('button', { name: 'Choose image' }));
    expect(click).toHaveBeenCalledTimes(1);
    click.mockRestore();
  });

  it('names the custom colour input by the label the consumer composes', () => {
    render(
      <Picker defaultTab="color">
        <AvatarPickerColorContent>
          <AvatarPickerColorField>Pick any</AvatarPickerColorField>
        </AvatarPickerColorContent>
      </Picker>,
    );
    openEditor();

    expect(screen.getByLabelText('Pick any').getAttribute('type')).toBe('color');
  });

  it('is busy, with its trigger disabled, until onUpload settles, then adopts the resolved URL', async () => {
    let resolve: (url: string) => void = () => {};
    const onUpload = vi.fn(() => new Promise<string>((r) => (resolve = r)));
    const onChange = vi.fn();
    render(
      <Picker defaultTab="upload" onValueChange={onChange}>
        <UploadPane onUpload={onUpload} />
      </Picker>,
    );
    openEditor();

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['x'], 'a.png', { type: 'image/png' });
    fireEvent.change(input, { target: { files: [file] } });

    expect(onUpload).toHaveBeenCalledWith(file);
    expect(screen.getByRole('tabpanel').getAttribute('aria-busy')).toBe('true');
    expect(screen.getByRole('button', { name: 'Choose image' }).hasAttribute('disabled')).toBe(true);

    resolve('https://cdn.example/a.png');
    await waitFor(() => expect(screen.getByRole('tabpanel').getAttribute('aria-busy')).toBe('false'));
    expect(screen.getByRole('button', { name: 'Choose image' }).hasAttribute('disabled')).toBe(false);
    expect(onChange).toHaveBeenCalledWith({ imageUrl: 'https://cdn.example/a.png', emoji: null });
  });

  it('leaves the busy state once a rejected onUpload settles, without adopting a URL', async () => {
    let reject: (reason: unknown) => void = () => {};
    const onUpload = vi.fn(() => new Promise<string | null>((_resolve, r) => (reject = r)));
    const onChange = vi.fn();
    render(
      <Picker defaultTab="upload" onValueChange={onChange}>
        <UploadPane onUpload={onUpload} />
      </Picker>,
    );
    openEditor();

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['x'], 'a.png', { type: 'image/png' });
    fireEvent.change(input, { target: { files: [file] } });

    expect(screen.getByRole('tabpanel').getAttribute('aria-busy')).toBe('true');

    reject(new Error('upload failed'));
    await waitFor(() => expect(screen.getByRole('tabpanel').getAttribute('aria-busy')).toBe('false'));
    expect(onChange).not.toHaveBeenCalled();
  });

  it('lets children replace the remove button icon', () => {
    render(
      <AvatarPicker value={{}} onValueChange={vi.fn()} defaultOpen>
        <AvatarPickerContent>
          <AvatarPickerRemoveButton>
            <span>clear</span>
          </AvatarPickerRemoveButton>
        </AvatarPickerContent>
      </AvatarPicker>,
    );

    expect(screen.getByRole('button', { name: 'Remove avatar' }).textContent).toBe('clear');
  });

  it("clears emoji and image on Remove and still runs the consumer's onClick", () => {
    const onChange = vi.fn();
    const onRemove = vi.fn();
    render(
      <Picker defaultTab="upload" value={{ emoji: 'x' }} onValueChange={onChange} onRemove={onRemove}>
        <UploadPane />
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
        <UploadPane />
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
        <ColorPane />
      </Picker>,
    );
    openEditor();

    expect(screen.getByRole('button', { name: '#ec4899' }).getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByRole('button', { name: '#6366f1' }).getAttribute('aria-pressed')).toBe('false');
    fireEvent.click(screen.getByRole('button', { name: '#6366f1' }));
    expect(onChange).toHaveBeenCalledWith({ color: '#6366f1' });
  });

  it.each(['#f59e0b', '#84cc16', '#6366f1'])(
    // 3:1 is WCAG's contrast for a graphic, which the check is.
    'draws the pressed %s swatch with a check that stands out from it at 3:1 or more',
    (color) => {
      render(
        <Picker defaultTab="color" value={{ color }} onValueChange={vi.fn()}>
          <ColorPane />
        </Picker>,
      );
      openEditor();

      const swatch = getComputedStyle(screen.getByRole('button', { name: color }));
      expect(contrastRatio(swatch.color, swatch.backgroundColor)).toBeGreaterThanOrEqual(3);
    },
  );

  it('hands upstream Popover the root props it does not read', async () => {
    const actionsRef = createRef<PopoverPrimitive.Root.Actions>();
    render(
      <AvatarPicker value={{}} onValueChange={vi.fn()} defaultOpen actionsRef={actionsRef}>
        <AvatarPickerTrigger>
          <span>avatar</span>
        </AvatarPickerTrigger>
        <AvatarPickerContent>
          <Tabs defaultValue="color">
            <ColorPane />
          </Tabs>
        </AvatarPickerContent>
      </AvatarPicker>,
    );
    expect(screen.getByRole('button', { name: '#6366f1' })).toBeTruthy();

    act(() => actionsRef.current?.close());

    await waitFor(() => expect(screen.queryByRole('button', { name: '#6366f1' })).toBeNull());
  });
});
