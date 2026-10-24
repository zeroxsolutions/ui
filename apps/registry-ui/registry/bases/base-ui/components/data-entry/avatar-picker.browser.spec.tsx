import type { Popover as PopoverPrimitive } from '@base-ui/react/popover';
import { Palette, Smile, Upload } from 'lucide-react';
import { createRef, type MouseEvent, type ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-react';

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
  AvatarPickerUploadPreview,
  AvatarPickerUploadTrigger,
  type AvatarPickerTab,
  type AvatarPickerUploadContentProps,
  type AvatarPickerValue,
} from './avatar-picker';
import { EmojiPickerContent, EmojiPickerEmpty, EmojiPickerSearch } from './emoji-picker';

/** A 1x1 PNG the browser can decode, so a data URL or object URL read from it draws as an image. */
const PNG = Uint8Array.from(
  atob('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='),
  (c) => c.charCodeAt(0),
);
const pngFile = (): File => new File([PNG], 'a.png', { type: 'image/png' });

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

const openEditor = () => userEvent.click(page.getByRole('button', { name: 'Edit avatar' }));

const pane = page.getByRole('tabpanel');

// The input is hidden, so no role or label reaches it.
const fileInput = (): HTMLInputElement => document.querySelector<HTMLInputElement>('input[type="file"]')!;

/**
 * Sends `type` to `target` as a drag carrying `files`. Neither Playwright nor Vitest can drag a file in
 * from outside the page, so this dispatches the browser's own DragEvent around a real DataTransfer;
 * returns the event, whose `defaultPrevented` says whether the page took the drag.
 */
function dragFiles(target: Element, type: 'dragenter' | 'dragover' | 'dragleave' | 'drop', files: File[] = []) {
  const dataTransfer = new DataTransfer();
  for (const file of files) dataTransfer.items.add(file);
  const event = new DragEvent(type, { bubbles: true, cancelable: true, dataTransfer });
  target.dispatchEvent(event);
  return event;
}

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
  it('shows only the pane the consumer composes when it declares no tab strip', async () => {
    await render(
      <Picker defaultTab="upload" strip={false}>
        <UploadPane />
      </Picker>,
    );
    await openEditor();

    await expect.element(page.getByText('Upload an image')).toBeVisible();
    expect(page.getByRole('tab').elements()).toHaveLength(0);
  });

  it('switches panes through the tabs the consumer declares', async () => {
    await render(
      <Picker defaultTab="upload">
        <EmojiPane />
        <UploadPane />
        <ColorPane />
      </Picker>,
    );
    await openEditor();

    await expect.element(page.getByRole('tab', { name: 'Color' })).toBeVisible();
    expect(
      page
        .getByRole('tab')
        .elements()
        .map((tab) => tab.getAttribute('aria-label')),
    ).toEqual(['Emoji', 'Upload', 'Color']);
    await userEvent.click(page.getByRole('tab', { name: 'Color' }));
    await expect.element(page.getByRole('button', { name: '#6366f1' })).toBeVisible();
  });

  it('shows "No emoji found" when a search in the emoji pane matches nothing', async () => {
    await render(
      <Picker defaultTab="emoji">
        <EmojiPane />
      </Picker>,
    );
    await openEditor();

    await userEvent.fill(page.getByLabelText('Search emoji'), 'zzzznotanemoji');

    await expect.element(page.getByText('No emoji found')).toBeVisible();
  });

  it('keeps a pane wrapped in a consumer component reachable through its tab', async () => {
    function UploadWrapper({ children }: { children: ReactNode }) {
      return <div>{children}</div>;
    }
    await render(
      <Picker defaultTab="emoji">
        <EmojiPane />
        <UploadWrapper>
          <UploadPane />
        </UploadWrapper>
        <ColorPane />
      </Picker>,
    );
    await openEditor();

    await expect.element(page.getByRole('tab', { name: 'Upload' })).toBeVisible();
    await expect.element(page.getByText('Upload an image')).not.toBeInTheDocument();
    await userEvent.click(page.getByRole('tab', { name: 'Upload' }));
    await expect.element(page.getByText('Upload an image')).toBeVisible();
  });

  it('renders the copy the consumer composes in the upload pane', async () => {
    await render(
      <Picker defaultTab="upload">
        <AvatarPickerUploadContent>
          <EmptyTitle>Upload a photo</EmptyTitle>
          <AvatarPickerUploadTrigger>Browse</AvatarPickerUploadTrigger>
        </AvatarPickerUploadContent>
      </Picker>,
    );
    await openEditor();

    await expect.element(page.getByText('Upload a photo')).toBeVisible();
    await expect.element(page.getByRole('button', { name: 'Browse' })).toBeVisible();
  });

  it('opens the file picker from its trigger', async () => {
    // The real click would open a file chooser the run cannot dismiss.
    const click = vi.spyOn(HTMLInputElement.prototype, 'click').mockImplementation(() => {});
    await render(
      <Picker defaultTab="upload">
        <UploadPane />
      </Picker>,
    );
    await openEditor();

    await userEvent.click(page.getByRole('button', { name: 'Choose image' }));
    expect(click).toHaveBeenCalledTimes(1);
    click.mockRestore();
  });

  it('reads a picked image inline as the avatar, and empties the input so the same file can be picked again', async () => {
    const onChange = vi.fn();
    await render(
      <Picker defaultTab="upload" onValueChange={onChange}>
        <UploadPane />
      </Picker>,
    );
    await openEditor();
    await expect.element(pane).toBeVisible();

    await userEvent.upload(fileInput(), pngFile());

    await expect
      .poll(() => onChange.mock.calls.at(-1)?.[0])
      .toEqual({ emoji: null, imageUrl: expect.stringMatching(/^data:image\/png;base64,/) });
    // A browser fires no change for a pick matching the input's value. Playwright's upload fires one
    // regardless, so the value is what says a second pick of this file would reach the picker.
    expect(fileInput().value).toBe('');
  });

  it('names the custom colour input by the label the consumer composes', async () => {
    await render(
      <Picker defaultTab="color">
        <AvatarPickerColorContent>
          <AvatarPickerColorField>Pick any</AvatarPickerColorField>
        </AvatarPickerColorContent>
      </Picker>,
    );
    await openEditor();

    await expect.element(page.getByLabelText('Pick any')).toHaveAttribute('type', 'color');
  });

  it('is busy, with its trigger disabled, until onUpload settles, then adopts the resolved URL', async () => {
    let resolve: (url: string) => void = () => {};
    const onUpload = vi.fn(() => new Promise<string>((r) => (resolve = r)));
    const onChange = vi.fn();
    await render(
      <Picker defaultTab="upload" onValueChange={onChange}>
        <UploadPane onUpload={onUpload} />
      </Picker>,
    );
    await openEditor();
    await expect.element(pane).toBeVisible();

    await userEvent.upload(fileInput(), pngFile());

    expect(onUpload).toHaveBeenCalledWith(expect.objectContaining({ name: 'a.png', type: 'image/png' }));
    await expect.element(pane).toHaveAttribute('aria-busy', 'true');
    await expect.element(page.getByRole('button', { name: 'Choose image' })).toBeDisabled();

    resolve('https://cdn.example/a.png');
    await expect.element(pane).toHaveAttribute('aria-busy', 'false');
    await expect.element(page.getByRole('button', { name: 'Choose image' })).toBeEnabled();
    expect(onChange).toHaveBeenCalledWith({ imageUrl: 'https://cdn.example/a.png', emoji: null });
  });

  it('leaves the busy state once a rejected onUpload settles, without adopting a URL', async () => {
    let reject: (reason: unknown) => void = () => {};
    const onUpload = vi.fn(() => new Promise<string | null>((_resolve, r) => (reject = r)));
    const onChange = vi.fn();
    await render(
      <Picker defaultTab="upload" onValueChange={onChange}>
        <UploadPane onUpload={onUpload} />
      </Picker>,
    );
    await openEditor();
    await expect.element(pane).toBeVisible();

    await userEvent.upload(fileInput(), pngFile());
    await expect.element(pane).toHaveAttribute('aria-busy', 'true');

    reject(new Error('upload failed'));
    await expect.element(pane).toHaveAttribute('aria-busy', 'false');
    expect(onChange).not.toHaveBeenCalled();
  });

  it('reads an image dropped on the pane inline as the avatar, clearing the emoji', async () => {
    const onChange = vi.fn();
    await render(
      <Picker defaultTab="upload" value={{ emoji: '\u{1F600}' }} onValueChange={onChange}>
        <UploadPane />
      </Picker>,
    );
    await openEditor();
    await expect.element(pane).toBeVisible();

    dragFiles(pane.element(), 'drop', [pngFile()]);

    await expect
      .poll(() => onChange.mock.calls.at(-1)?.[0])
      .toEqual({ emoji: null, imageUrl: expect.stringMatching(/^data:image\/png;base64,/) });
  });

  it('hands a dropped image to onUpload', async () => {
    const onUpload = vi.fn(() => null);
    await render(
      <Picker defaultTab="upload">
        <UploadPane onUpload={onUpload} />
      </Picker>,
    );
    await openEditor();
    await expect.element(pane).toBeVisible();

    const file = pngFile();
    dragFiles(pane.element(), 'drop', [file]);

    expect(onUpload).toHaveBeenCalledWith(file);
  });

  it('ignores a dropped file that is not an image', async () => {
    const onUpload = vi.fn(() => null);
    await render(
      <Picker defaultTab="upload">
        <UploadPane onUpload={onUpload} />
      </Picker>,
    );
    await openEditor();
    await expect.element(pane).toBeVisible();

    dragFiles(pane.element(), 'drop', [new File(['x'], 'a.pdf', { type: 'application/pdf' })]);

    expect(onUpload).not.toHaveBeenCalled();
  });

  it('marks the pane dragging while files are held over it, until they leave or drop', async () => {
    await render(
      <Picker defaultTab="upload">
        <UploadPane onUpload={() => null} />
      </Picker>,
    );
    await openEditor();
    await expect.element(pane).toBeVisible();

    dragFiles(pane.element(), 'dragenter', [pngFile()]);
    await expect.element(pane).toHaveAttribute('data-dragging');
    dragFiles(pane.element(), 'dragleave');
    await expect.element(pane).not.toHaveAttribute('data-dragging');

    dragFiles(pane.element(), 'dragenter', [pngFile()]);
    await expect.element(pane).toHaveAttribute('data-dragging');
    dragFiles(pane.element(), 'drop', [pngFile()]);
    await expect.element(pane).not.toHaveAttribute('data-dragging');
  });

  it('keeps the pane dragging while the drag moves between its own children', async () => {
    await render(
      <Picker defaultTab="upload">
        <UploadPane />
      </Picker>,
    );
    await openEditor();
    await expect.element(pane).toBeVisible();
    const title = page.getByText('Upload an image').element();

    dragFiles(pane.element(), 'dragenter', [pngFile()]);
    dragFiles(title, 'dragenter', [pngFile()]);
    dragFiles(pane.element(), 'dragleave');
    await expect.element(pane).toHaveAttribute('data-dragging');
    dragFiles(title, 'dragleave');
    await expect.element(pane).not.toHaveAttribute('data-dragging');
  });

  it('shows the current image in the preview, and marks the pane, only while the avatar is an image', async () => {
    const imageUrl = URL.createObjectURL(pngFile());
    const screen = await render(
      <Picker defaultTab="upload" value={{ imageUrl }}>
        <AvatarPickerUploadContent>
          <AvatarPickerUploadPreview alt="Current avatar" />
        </AvatarPickerUploadContent>
      </Picker>,
    );
    await openEditor();

    await expect.element(page.getByRole('img', { name: 'Current avatar' })).toHaveAttribute('src', imageUrl);
    await expect.element(pane).toHaveAttribute('data-has-image');

    await screen.rerender(
      <Picker defaultTab="upload" value={{ emoji: '\u{1F600}' }}>
        <AvatarPickerUploadContent>
          <AvatarPickerUploadPreview alt="Current avatar" />
        </AvatarPickerUploadContent>
      </Picker>,
    );
    await expect.element(page.getByRole('img', { name: 'Current avatar' })).not.toBeInTheDocument();
    await expect.element(pane).not.toHaveAttribute('data-has-image');
    URL.revokeObjectURL(imageUrl);
  });

  it('takes a drop while an upload is pending, so the browser does not open the file, and ignores it', async () => {
    const onUpload = vi.fn(() => new Promise<string | null>(() => {}));
    await render(
      <Picker defaultTab="upload">
        <UploadPane onUpload={onUpload} />
      </Picker>,
    );
    await openEditor();
    await expect.element(pane).toBeVisible();
    dragFiles(pane.element(), 'drop', [pngFile()]);
    await expect.element(pane).toHaveAttribute('data-uploading');

    dragFiles(pane.element(), 'dragenter', [pngFile()]);
    await expect.element(pane).not.toHaveAttribute('data-dragging');
    expect(dragFiles(pane.element(), 'dragover', [pngFile()]).defaultPrevented).toBe(true);
    expect(dragFiles(pane.element(), 'drop', [pngFile()]).defaultPrevented).toBe(true);
    expect(onUpload).toHaveBeenCalledTimes(1);
  });

  it('lets children replace the remove button icon', async () => {
    await render(
      <AvatarPicker value={{}} onValueChange={vi.fn()} defaultOpen>
        <AvatarPickerContent>
          <AvatarPickerRemoveButton>
            <span>clear</span>
          </AvatarPickerRemoveButton>
        </AvatarPickerContent>
      </AvatarPicker>,
    );

    await expect.element(page.getByRole('button', { name: 'Remove avatar' })).toHaveTextContent('clear');
  });

  it("clears emoji and image on Remove and still runs the consumer's onClick", async () => {
    const onChange = vi.fn();
    const onRemove = vi.fn();
    await render(
      <Picker defaultTab="upload" value={{ emoji: 'x' }} onValueChange={onChange} onRemove={onRemove}>
        <UploadPane />
      </Picker>,
    );
    await openEditor();

    await userEvent.click(page.getByRole('button', { name: 'Remove avatar' }));
    expect(onChange).toHaveBeenCalledWith({ emoji: null, imageUrl: null });
    expect(onRemove).toHaveBeenCalledTimes(1);
  });

  it("skips remove when the consumer's onClick prevents default, but still runs it", async () => {
    const onChange = vi.fn();
    const onRemove = vi.fn((event: MouseEvent<HTMLButtonElement>) => event.preventDefault());
    await render(
      <Picker defaultTab="upload" value={{ emoji: 'x' }} onValueChange={onChange} onRemove={onRemove}>
        <UploadPane />
      </Picker>,
    );
    await openEditor();

    await userEvent.click(page.getByRole('button', { name: 'Remove avatar' }));
    expect(onRemove).toHaveBeenCalledTimes(1);
    expect(onChange).not.toHaveBeenCalled();
  });

  it('marks the current colour swatch pressed and sets the colour on a click', async () => {
    const onChange = vi.fn();
    await render(
      <Picker defaultTab="color" value={{ color: '#ec4899' }} onValueChange={onChange}>
        <ColorPane />
      </Picker>,
    );
    await openEditor();

    await expect.element(page.getByRole('button', { name: '#ec4899' })).toHaveAttribute('aria-pressed', 'true');
    await expect.element(page.getByRole('button', { name: '#6366f1' })).toHaveAttribute('aria-pressed', 'false');
    await userEvent.click(page.getByRole('button', { name: '#6366f1' }));
    expect(onChange).toHaveBeenCalledWith({ color: '#6366f1' });
  });

  it.each(['#f59e0b', '#84cc16', '#6366f1'])(
    // 3:1 is WCAG's contrast for a graphic, which the check is.
    'draws the pressed %s swatch with a check that stands out from it at 3:1 or more',
    async (color) => {
      await render(
        <Picker defaultTab="color" value={{ color }} onValueChange={vi.fn()}>
          <ColorPane />
        </Picker>,
      );
      await openEditor();

      const button = page.getByRole('button', { name: color });
      await expect.element(button).toBeVisible();
      const swatch = getComputedStyle(button.element());
      expect(contrastRatio(swatch.color, swatch.backgroundColor)).toBeGreaterThanOrEqual(3);
    },
  );

  it('hands upstream Popover the root props it does not read', async () => {
    const actionsRef = createRef<PopoverPrimitive.Root.Actions>();
    await render(
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
    await expect.element(page.getByRole('button', { name: '#6366f1' })).toBeVisible();

    actionsRef.current?.close();

    await expect.element(page.getByRole('button', { name: '#6366f1' })).not.toBeInTheDocument();
  });
});
