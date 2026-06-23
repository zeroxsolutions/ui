import { InputGroupAddon } from '@/components/ui/input-group';
import { cn } from '@/lib/utils';
import { ChatAttachmentChip } from './chat-attachment-chip';
import type { ChatAttachmentLike } from './chat-types';

/**
 * ChatComposerAttachments — the block-start row of attachment chips for an
 * `InputGroup` composer. Renders nothing when `attachments` is empty (so the
 * box keeps its single-line height until the user attaches something), then a
 * wrapping row of compact `ChatAttachmentChip`s.
 *
 * Drop it as the first child of an `InputGroup`; the host owns the attachment
 * list and the remove handler. A surface that isn't an `InputGroup` (e.g. a
 * floating chip layer) composes `ChatAttachmentChip` directly instead.
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
        <ChatAttachmentChip
          key={a.id}
          attachment={a}
          onRemove={onRemove}
          compact
        />
      ))}
    </InputGroupAddon>
  );
}
