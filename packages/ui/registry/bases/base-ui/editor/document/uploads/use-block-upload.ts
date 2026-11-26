'use client';

import { useCallback, useSyncExternalStore } from 'react';
import type { IEditor } from '@zeroxsolutions/editor-core/document/core/index';
import type { UploadMessages } from './upload';
import { uploadStoreOf, type UploadEntry, type UploadRequest } from './upload-store';

/** Where a block is: the editor it is in and its position there, read when it is needed. */
export interface BlockPlace {
  readonly editor: IEditor;
  getPos(): number | undefined;
}

/** One address of a block that a file uploads into. */
export interface BlockUpload {
  /** The upload in flight or failed for it, or null. */
  readonly entry: UploadEntry | null;
  /** The types its file picker offers. */
  readonly accept: string;
  /** Uploads `file`; answers why it is refused before it is sent, or null once it started. */
  start(file: File): string | null;
  /** Stops the upload, or drops a failed one; the block is left as it was. */
  cancel(): void;
  retry(): void;
}

/** An upload into one address of a block, with the words its controls draw, handed to a control drawing it. */
export interface BlockUploadControl {
  readonly upload: BlockUpload;
  readonly messages: UploadMessages;
}

const NO_STORE = (): (() => void) => () => {};

function positionOf(place: BlockPlace): number | undefined {
  try {
    return place.getPos();
  } catch {
    return undefined;
  }
}

/** The upload in flight or failed into `slot` of the block at `place`, for a view that only draws it; null for none. */
export function useUploadEntry(place: BlockPlace | null, slot: string): UploadEntry | null {
  const store = place ? uploadStoreOf(place.editor) : null;
  const subscribe = useCallback((listener: () => void) => store?.subscribe(listener) ?? NO_STORE(), [store]);
  return useSyncExternalStore(
    subscribe,
    () => (store && place ? store.find(positionOf(place), slot) : null),
    () => null,
  );
}

/**
 * The upload into `slot` of the block at `place`, drawn again as it moves; null where the block does not upload:
 * no `request`, as for a feature given no `upload`, or no place, as in the Viewer.
 */
export function useBlockUpload(
  place: BlockPlace | null,
  slot: string,
  request: UploadRequest | null,
): BlockUpload | null {
  const store = place && request ? uploadStoreOf(place.editor) : null;
  const subscribe = useCallback((listener: () => void) => store?.subscribe(listener) ?? NO_STORE(), [store]);
  const entry = useSyncExternalStore(
    subscribe,
    () => (store && place ? store.find(positionOf(place), slot) : null),
    () => null,
  );
  if (!store || !place || !request) return null;
  return {
    entry,
    accept: request.limits.accept ?? request.accept,
    start: (file) => {
      const pos = positionOf(place);
      return pos === undefined ? null : store.start(pos, slot, file, request);
    },
    cancel: () => {
      if (entry) store.cancel(entry.id);
    },
    retry: () => {
      if (entry) store.retry(entry.id);
    },
  };
}
