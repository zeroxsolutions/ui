import { FileText, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { ChatAttachmentLike } from './chat-types';

/**
 * ChatAttachmentChip — a thumbnail chip for one pending attachment, shown above
 * a composer textarea before the message is sent. An `image` kind renders its
 * `dataUrl` thumbnail; any other kind renders a file icon + name. The X button
 * reports removal through `onRemove`; `onMouseDown` is prevented so focus stays
 * on the textarea (the host's editor keymap stays inert).
 *
 * The shared leaf: each composer surface arranges chips in its own row — the
 * `InputGroup` block-start row (`ChatComposerAttachments`) or a floating layer.
 * Presentational: the host owns the attachment list and its persistence.
 */
export interface ChatAttachmentChipProps {
  attachment: ChatAttachmentLike;
  onRemove: (id: string) => void;
  /** Smaller thumbnail for an input's top context strip (default off keeps the
   *  larger pre-send preview). */
  compact?: boolean;
  className?: string;
}

export function ChatAttachmentChip({
  attachment,
  onRemove,
  compact = false,
  className,
}: ChatAttachmentChipProps) {
  const isImage = attachment.kind === 'image';
  return (
    <div
      className={cn(
        'relative shrink-0 overflow-hidden rounded-md bg-card',
        'flex items-center justify-center text-muted-foreground',
        compact ? 'size-10' : 'size-14',
        className,
      )}
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
