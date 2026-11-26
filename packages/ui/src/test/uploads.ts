import { page, type Locator } from 'vitest/browser';
import type { EditorUpload } from '../../registry/bases/base-ui/editor/document/uploads/upload';

/** One call of a held upload, which the spec answers by hand. */
export interface HeldUploadCall {
  readonly file: File;
  readonly signal: AbortSignal;
  progress(fraction: number): void;
  answer(url: string): void;
  fail(): void;
}

/** An upload that sends nothing: each call waits until the spec answers it or fails it. */
export function heldUpload(): { upload: EditorUpload; calls: HeldUploadCall[] } {
  const calls: HeldUploadCall[] = [];
  const upload: EditorUpload = (file, { signal, onProgress }) =>
    new Promise((resolve, reject) => {
      calls.push({
        file,
        signal,
        progress: onProgress,
        answer: (url) => resolve({ url }),
        fail: () => reject(new Error('offline')),
      });
    });
  return { upload, calls };
}

/** A PNG file of `bytes` bytes; its content is never read. */
export function pngFile(name = 'cat.png', bytes = 4): File {
  return new File([new Uint8Array(bytes)], name, { type: 'image/png' });
}

function transferOf(files: readonly File[]): DataTransfer {
  const transfer = new DataTransfer();
  for (const file of files) transfer.items.add(file);
  return transfer;
}

/**
 * Pastes `files` into `target`, with `data` as the clipboard's other types, such as `text/html`. The browser's
 * input API types and clicks but cannot paste a file, so the paste event the browser would fire is fired here;
 * the event is answered, so a spec reads whether the editor handled it.
 */
export function pasteFiles(target: Element, files: readonly File[], data: Record<string, string> = {}): ClipboardEvent {
  const clipboardData = transferOf(files);
  for (const [type, value] of Object.entries(data)) clipboardData.setData(type, value);
  const event = new ClipboardEvent('paste', { clipboardData, bubbles: true, cancelable: true });
  target.dispatchEvent(event);
  return event;
}

/** Drops `files` onto the middle of `target`; the input API drags elements, not files from the desktop. */
export function dropFiles(target: Element, files: readonly File[]): void {
  const box = target.getBoundingClientRect();
  const at = { clientX: box.left + box.width / 2, clientY: box.top + box.height / 2 };
  const dataTransfer = transferOf(files);
  target.dispatchEvent(new DragEvent('dragover', { dataTransfer, bubbles: true, cancelable: true, ...at }));
  target.dispatchEvent(new DragEvent('drop', { dataTransfer, bubbles: true, cancelable: true, ...at }));
}

/** The file input behind an upload tab's "Choose a file" button, which only the browser's picker reaches. */
export function fileInput(): Locator {
  return page.elementLocator(document.querySelector('[data-slot=upload-tabs-file-input]') as Element);
}
