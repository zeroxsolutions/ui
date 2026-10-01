'use client';

import { useEffect, type ReactNode } from 'react';

import {
  AvatarPicker,
  AvatarPickerContent,
  AvatarPickerTrigger,
  AvatarPickerUploadContent,
  AvatarPickerUploadTrigger,
} from '@/registry/bases/base-ui/components/data-entry/avatar-picker';
import { Avatar, AvatarFallback } from '@/registry/bases/base-ui/ui/avatar';
import { EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/registry/bases/base-ui/ui/empty';
import { Spinner } from '@/registry/bases/base-ui/ui/spinner';
import { Tabs } from '@/registry/bases/base-ui/ui/tabs';
import { UploadIcon } from '@/registry/bases/base-ui/ui/upload';

/** Picks `input` as if the browser's own file dialog had, through the DOM it already renders. */
function pickFile(input: HTMLInputElement): void {
  const file = new File(['avatar'], 'avatar.png', { type: 'image/png' });
  Object.defineProperty(input, 'files', { value: [file], configurable: true });
  input.dispatchEvent(new Event('change', { bubbles: true }));
}

/**
 * The upload pane mid-upload: opened straight to it, with a file already picked through its own
 * hidden file input and `onUpload` never resolving, so the pane stays `aria-busy` and
 * `data-uploading` - a state the main demo's own interaction never reaches. The popover's Portal
 * mounts its content a tick after `defaultOpen`'s first render, so the file input is watched for
 * rather than queried once.
 */
function AvatarPickerUploadingDemo(): ReactNode {
  useEffect(() => {
    const existing = document.querySelector<HTMLInputElement>('input[type="file"]');
    if (existing) {
      pickFile(existing);
      return;
    }
    const observer = new MutationObserver(() => {
      const input = document.querySelector<HTMLInputElement>('input[type="file"]');
      if (!input) return;
      observer.disconnect();
      pickFile(input);
    });
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  return (
    <AvatarPicker value={{ color: '#6366f1' }} onValueChange={() => {}} defaultOpen>
      <AvatarPickerTrigger>
        <Avatar>
          <AvatarFallback style={{ backgroundColor: '#6366f1' }} />
        </Avatar>
      </AvatarPickerTrigger>
      <AvatarPickerContent>
        <Tabs defaultValue="upload">
          <AvatarPickerUploadContent onUpload={() => new Promise<string | null>(() => {})}>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <UploadIcon aria-hidden className="group-data-uploading/avatar-picker-upload:hidden" />
                <Spinner className="hidden group-data-uploading/avatar-picker-upload:block" />
              </EmptyMedia>
              <EmptyTitle>
                <span className="group-data-uploading/avatar-picker-upload:hidden">Upload an image</span>
                <span className="hidden group-data-uploading/avatar-picker-upload:inline">Uploading...</span>
              </EmptyTitle>
              <EmptyDescription>PNG, JPG or GIF</EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <AvatarPickerUploadTrigger>Choose image</AvatarPickerUploadTrigger>
            </EmptyContent>
          </AvatarPickerUploadContent>
        </Tabs>
      </AvatarPickerContent>
    </AvatarPicker>
  );
}

export { AvatarPickerUploadingDemo };
