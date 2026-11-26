'use client';

import type { ReactNode } from 'react';
import { XIcon } from '@/registry/bases/base-ui/icons/lucide/x-icon';
import { Button } from '@/registry/bases/base-ui/ui/button';
import { Progress, ProgressLabel } from '@/registry/bases/base-ui/ui/progress';
import { cn } from '@/registry/bases/base-ui/lib/utils';
import type { UploadMessages } from './upload';
import type { UploadEntry } from './upload-store';

interface UploadStatusProps {
  entry: UploadEntry;
  messages: UploadMessages;
  onCancel(): void;
  onRetry(): void;
  /** Drawn in a read-only editor: how the upload stands, with no control that would change the document. */
  readOnly?: boolean;
  className?: string;
}

/**
 * How an upload into a block stands, drawn in the block: its progress and a cancel while it runs; once it failed,
 * why, a retry where a second try can succeed, and the cancel that leaves the block as it was. A read-only editor
 * draws the progress and the failure alone; the upload still lands.
 */
function UploadStatus({
  entry,
  messages,
  onCancel,
  onRetry,
  readOnly = false,
  className,
}: UploadStatusProps): ReactNode {
  const cancel = (
    <Button type="button" variant="ghost" size="icon-sm" aria-label={messages.cancel} onClick={onCancel}>
      <XIcon size={16} aria-hidden />
    </Button>
  );
  return (
    <div
      data-slot="upload-status"
      data-phase={entry.phase}
      contentEditable={false}
      // A press on its buttons is the author's on the upload, not a selection of the block.
      onMouseDown={(event) => event.stopPropagation()}
      className={cn('not-prose flex w-full items-center gap-2 text-sm', className)}
    >
      {entry.phase === 'uploading' ? (
        <Progress
          value={entry.progress === null ? null : Math.round(entry.progress * 100)}
          className="min-w-0 flex-1 gap-1"
        >
          <ProgressLabel className="text-muted-foreground truncate text-xs">
            {messages.uploading(entry.file.name)}
          </ProgressLabel>
        </Progress>
      ) : (
        <>
          <span role="alert" className="text-destructive min-w-0 flex-1">
            {entry.message}
          </span>
          {entry.retryable && !readOnly && (
            <Button type="button" variant="outline" size="sm" onClick={onRetry}>
              {messages.retry}
            </Button>
          )}
        </>
      )}
      {!readOnly && cancel}
    </div>
  );
}

export { UploadStatus, type UploadStatusProps };
