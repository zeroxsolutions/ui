'use client';

import type { IEditor } from '@zeroxsolutions/editor-core/document/core/index';
import type { UploadRequest } from '../../document/uploads/upload-store';
import { useBlockUpload, type BlockPlace, type BlockUploadControl } from '../../document/uploads/use-block-upload';
import { emailAddressProblems } from './email-address-popover';
import { contextOf } from './kit-context';

/**
 * The request an image field of `editor`'s email uploads with, or null where the host gave no upload. The answered
 * address is checked as a typed one is, `https:` alone where `secure`, so the email never stores one it refuses.
 */
export function emailImageUploadRequest(
  editor: IEditor | null,
  secure: boolean,
  land: UploadRequest['land'],
): UploadRequest | null {
  const context = editor ? contextOf(editor)?.context : undefined;
  if (!context?.uploads) return null;
  const messages = context.messages();
  return {
    upload: context.uploads.upload,
    accept: 'image/*',
    limits: context.uploads.limits,
    messages: messages.uploads,
    preview: true,
    land,
    problems: (url) => emailAddressProblems(url, 'image', secure, context.declarations(), messages),
  };
}

/** The upload into the image field `slot` of the block at `place`, for its popover and its view; null for none. */
export function useEmailImageUpload(
  editor: IEditor | null,
  place: BlockPlace | null,
  slot: string,
  secure: boolean,
  land: UploadRequest['land'],
): BlockUploadControl | null {
  const request = emailImageUploadRequest(editor, secure, land);
  const upload = useBlockUpload(place, slot, request);
  return upload && request ? { upload, messages: request.messages } : null;
}
