import { fileSizeText } from '@zeroxsolutions/editor-core/blocks/library/index';

/** What the host's upload is handed beside the file. */
export interface EditorUploadOptions {
  /** Aborts when the author cancels, the block is deleted or the editor unmounts; the upload stops then. */
  readonly signal: AbortSignal;
  /** Reports how much is sent, from 0 to 1; a value outside that range is clamped. */
  onProgress(fraction: number): void;
}

/**
 * The host's upload: stores `file` where the host keeps files and answers the web address it is read from. The
 * editor stores that address and nothing else; a rejection shows the block's failure, with retry.
 */
export type EditorUpload = (file: File, options: EditorUploadOptions) => Promise<{ readonly url: string }>;

/** What a host narrows a block's uploads to. */
export interface UploadLimits {
  /**
   * The files taken, as an `<input accept>` lists them: types such as `image/png`, groups such as `image/*`, or
   * extensions such as `.pdf`, comma-separated. Narrows the block's own types; the block's own when absent.
   */
  readonly accept?: string;
  /** The largest file taken, in bytes; a larger one is refused before it is uploaded. No cap when absent. */
  readonly maxBytes?: number;
}

/** Every string an upload control and an upload in flight draw. */
export interface UploadMessages {
  /** The tab that uploads a file. */
  readonly upload: string;
  /** The tab that takes an address. */
  readonly link: string;
  /** The button that opens the file picker. */
  readonly chooseFile: string;
  /** The line under it, inviting a drop. */
  readonly dropHint: string;
  /** The name of an upload's progress. */
  uploading(fileName: string): string;
  /** Stops an upload, or drops a failed one, and leaves the block as it was. */
  readonly cancel: string;
  readonly retry: string;
  /** What a failed upload says. */
  readonly failed: string;
  /** What a file over the host's cap is told, naming the cap. */
  tooLarge(maxBytes: number): string;
  /** What a file of a type the block does not take is told. */
  readonly notAccepted: string;
  /** What an upload is told when the host answered an address that is not a web one. */
  readonly addressRefused: string;
}

export const DEFAULT_UPLOAD_MESSAGES: UploadMessages = {
  upload: 'Upload',
  link: 'Link',
  chooseFile: 'Choose a file',
  dropHint: 'or drop one here',
  uploading: (fileName) => `Uploading ${fileName}`,
  cancel: 'Cancel upload',
  retry: 'Retry',
  failed: 'The upload failed',
  tooLarge: (maxBytes) => `The file is larger than ${fileSizeText(maxBytes)}`,
  notAccepted: 'This kind of file is not taken here',
  addressRefused: 'The upload answered an address the block cannot load',
};

/** Whether `file` is one of the types `accept` lists; an empty list takes any file. */
export function acceptsFile(accept: string, file: File): boolean {
  const entries = accept
    .split(',')
    .map((entry) => entry.trim().toLowerCase())
    .filter((entry) => entry !== '');
  if (entries.length === 0) return true;
  const type = file.type.toLowerCase();
  const name = file.name.toLowerCase();
  return entries.some((entry) => {
    if (entry.startsWith('.')) return name.endsWith(entry);
    if (entry.endsWith('/*')) return type.startsWith(entry.slice(0, -1));
    return type === entry;
  });
}

/**
 * How closely `accept` names `file`'s type: 3 for the type itself, 2 for its group, 1 for an empty list that takes
 * any file, 0 for a list that does not take it. A pasted or dropped file goes to the block that names it closest.
 */
export function acceptScore(accept: string, file: File): number {
  if (!acceptsFile(accept, file)) return 0;
  const entries = accept.split(',').map((entry) => entry.trim().toLowerCase());
  if (entries.every((entry) => entry === '')) return 1;
  const type = file.type.toLowerCase();
  return entries.includes(type) ? 3 : 2;
}

/** Why `file` is refused before it is uploaded, or null: a type `accept` does not list, or a size over `maxBytes`. */
export function uploadRefusal(
  file: File,
  accept: string,
  limits: UploadLimits,
  messages: UploadMessages,
): string | null {
  if (!acceptsFile(accept, file) || !acceptsFile(limits.accept ?? '', file)) return messages.notAccepted;
  if (limits.maxBytes !== undefined && file.size > limits.maxBytes) return messages.tooLarge(limits.maxBytes);
  return null;
}
