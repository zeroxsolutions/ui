import type { Meta, StoryObj } from '@storybook/react-vite';
import { ArrowUp } from 'lucide-react';
import { useState } from 'react';

import { ChatComposerAttachments } from '@zeroxsolutions/ui/chat-composer-attachments';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupTextarea,
} from '@zeroxsolutions/ui/input-group';

/**
 * `ChatComposerAttachments` is the block-start row of attachment chips for an
 * `InputGroup` composer. It renders nothing while `attachments` is empty (so the
 * box keeps its single-line height), then a wrapping row of compact
 * `ChatAttachmentChip`s once the host adds files. The host owns the list and the
 * remove handler.
 */
const meta: Meta<typeof ChatComposerAttachments> = {
  title: 'Chat/ComposerAttachments',
  component: ChatComposerAttachments,
};
export default meta;

type Story = StoryObj<typeof ChatComposerAttachments>;

/**
 * The attachment row mounted inside a real `InputGroup` composer — the
 * block-start of the box, above the textarea and send button — so its wrapping
 * behaviour reads in context.
 */
export const InComposer: Story = {
  render: () => {
    const [attachments, setAttachments] = useState([
      { id: '1', name: 'hero.png', kind: 'image' as const },
      { id: '2', name: 'spec.txt', kind: 'text' as const },
    ]);
    return (
      <InputGroup className="w-[28rem]">
        <ChatComposerAttachments
          attachments={attachments}
          onRemove={(id) =>
            setAttachments((prev) => prev.filter((a) => a.id !== id))
          }
        />
        <InputGroupTextarea
          placeholder="Ask, create, or start a task…"
          rows={2}
        />
        <InputGroupAddon align="block-end">
          <InputGroupButton
            size="icon-sm"
            aria-label="Send"
            className="ml-auto"
          >
            <ArrowUp />
          </InputGroupButton>
        </InputGroupAddon>
      </InputGroup>
    );
  },
};

/**
 * With an empty `attachments` array the component renders nothing, so the
 * composer collapses to just its textarea with no attachment row.
 */
export const Empty: Story = {
  render: () => (
    <InputGroup className="w-[28rem]">
      <ChatComposerAttachments attachments={[]} onRemove={() => {}} />
      <InputGroupTextarea placeholder="No attachments yet…" rows={2} />
    </InputGroup>
  ),
};
