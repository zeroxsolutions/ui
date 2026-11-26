import type { EditorUpload } from './upload';

export interface SimulatedUploadOptions {
  /** The address each file answers with. It must already serve something, since nothing stores the file. */
  address(file: File): string;
  /** Whether the upload of `file` fails once its progress is full, to show a failure and its retry. */
  fails?(file: File): boolean;
  /** How long a file takes to upload, in ms. Default 2000. */
  duration?: number;
}

/**
 * An upload that sends nothing, for a demo or a prototype: it reports progress in ten steps over `duration`, then
 * answers `address(file)` or fails. The file never leaves the page.
 */
export function simulatedUpload({
  address,
  fails = () => false,
  duration = 2000,
}: SimulatedUploadOptions): EditorUpload {
  const STEPS = 10;
  return (file, { signal, onProgress }) =>
    new Promise((resolve, reject) => {
      let step = 0;
      const timer = setInterval(() => {
        step += 1;
        onProgress(step / STEPS);
        if (step < STEPS) return;
        clearInterval(timer);
        if (fails(file)) reject(new Error('The simulated upload failed.'));
        else resolve({ url: address(file) });
      }, duration / STEPS);
      signal.addEventListener(
        'abort',
        () => {
          clearInterval(timer);
          reject(signal.reason);
        },
        { once: true },
      );
    });
}
