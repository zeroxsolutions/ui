import { FileText, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { InputGroupAddon } from '@/components/ui/input-group';
import { cn } from '@/lib/utils';
import type { ChatAttachmentLike } from './chat-types';

/**
 * ChatComposerAttachments — the block-start row of attachment chips for an
 * `InputGroup` composer. Renders nothing when `attachments` is empty (so the
 * box keeps its single-line height until the user attaches something), then a
 * wrapping row of thumbnail / file chips, each with a remove button.
 *
 * Drop it as the first child of an `InputGroup`; the host owns the attachment
 * list and the remove handler.
 */
export interface ChatComposerAttachmentsProps {
  attachments: readonly ChatAttachmentLike[];
  onRemove: (id: string) => void;
  className?: string;
}

export function ChatComposerAttachments({
  attachments,
  onRemove,
  className,
}: ChatComposerAttachmentsProps) {
  if (attachments.length === 0) return null;
  return (
    <InputGroupAddon
      align="block-start"
      className={cn('flex-wrap gap-1.5', className)}
    >
      {attachments.map((a) => (
        <AttachmentChip key={a.id} attachment={a} onRemove={onRemove} />
      ))}
    </InputGroupAddon>
  );
}

/**
 * One pending-attachment chip — an internal part of the row, not exported. An
 * `image` kind shows its `dataUrl` thumbnail; any other kind shows a file icon
 * + name. The X reports removal; `onMouseDown` is prevented so focus stays on
 * the composer textarea (the host editor's keymap stays inert).
 */
function AttachmentChip({
  attachment,
  onRemove,
}: {
  attachment: ChatAttachmentLike;
  onRemove: (id: string) => void;
}) {
  const isImage = attachment.kind === 'image';
  return (
    <div
      className="relative flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-md bg-card text-muted-foreground"
      title={attachment.name}
    >
      {isImage ? (
        <img
          src={attachment.dataUrl}
          alt={attachment.name}
          className="size-full object-cover"
          draggable={false}
        />
      ) : (
        <div className="flex flex-col items-center justify-center gap-0.5 px-1 text-center">
          <FileText className="size-4 shrink-0" />
          <span className="w-full truncate text-[9px] leading-tight">
            {attachment.name}
          </span>
        </div>
      )}
      <Button
        variant="secondary"
        size="icon"
        aria-label={`Remove ${attachment.name}`}
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => onRemove(attachment.id)}
        className="absolute right-0.5 top-0.5 size-4 rounded-full opacity-90"
      >
        <X className="size-2.5" />
      </Button>
    </div>
  );
}
