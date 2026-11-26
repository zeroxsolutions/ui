import { cdp, page, server, type Locator } from 'vitest/browser';
import { centreOf } from '../../test/pointer';
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

/**
 * Fires the paste event a paste of `files` would raise in `target`, with `data` as the clipboard's other types,
 * such as `text/html`. Nothing the browser's input reaches can put a file on the clipboard: the spec's frame has
 * no clipboard-write permission, and a copy takes a selection, never a file. So the event is fired by script,
 * and a case using it says so in its name. The event is answered, so a spec reads whether the editor handled it.
 */
export function firePastedFiles(
  target: Element,
  files: readonly File[],
  data: Record<string, string> = {},
): ClipboardEvent {
  const clipboardData = new DataTransfer();
  for (const file of files) clipboardData.items.add(file);
  for (const [type, value] of Object.entries(data)) clipboardData.setData(type, value);
  const event = new ClipboardEvent('paste', { clipboardData, bubbles: true, cancelable: true });
  target.dispatchEvent(event);
  return event;
}

/** A file in `src/test/files`, which a drop carries from the disk. */
export type DroppableFile = 'drop.png' | 'plan.pdf' | 'rain.mp3';

/**
 * Drags `files` from the disk onto the middle of `target` and drops them, through the browser's own drag input,
 * so the page reads the files' names and types as the browser gives them.
 */
export async function dropFiles(target: Element, files: readonly DroppableFile[]): Promise<void> {
  const { x, y } = centreOf(target);
  const frame = window.frameElement?.getBoundingClientRect();
  const scale = frame && window.innerWidth > 0 ? frame.width / window.innerWidth : 1;
  const at = { x: (frame?.left ?? 0) + x * scale, y: (frame?.top ?? 0) + y * scale };
  const data = {
    items: [],
    files: files.map((name) => `${server.config.root}/src/test/files/${name}`),
    dragOperationsMask: 1,
  };
  for (const type of ['dragEnter', 'dragOver', 'drop'] as const) {
    await cdp().send('Input.dispatchDragEvent', { type, ...at, data });
  }
}

/** The file input behind an upload tab's "Choose a file" button, which only the browser's picker reaches. */
export function fileInput(): Locator {
  return page.elementLocator(document.querySelector('[data-slot=upload-tabs-file-input]') as Element);
}
