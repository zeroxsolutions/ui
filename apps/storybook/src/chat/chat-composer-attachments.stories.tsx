import type { Meta, StoryObj } from '@storybook/react-vite';

import { ChatComposerAttachments } from '@chiselart/ui/chat-composer-attachments';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupTextarea,
} from '@chiselart/ui/input-group';

const meta: Meta<typeof ChatComposerAttachments> = {
  title: 'Chat/ComposerAttachments',
  component: ChatComposerAttachments,
};
export default meta;

type Story = StoryObj<typeof ChatComposerAttachments>;

// The attachment row is the block-start of an `InputGroup` composer — shown
// here inside one so the wrapping behaviour reads in context.
export const InComposer: Story = {
  render: () => (
    <InputGroup className="w-[28rem] rounded-xl">
      <ChatComposerAttachments
        attachments={[
          { id: '1', name: 'hero.png', kind: 'image' },
          { id: '2', name: 'spec.txt', kind: 'text' },
        ]}
        onRemove={() => {}}
      />
      <InputGroupTextarea placeholder="Ask, create, or start a task…" rows={2} />
      <InputGroupAddon align="block-end">
        <InputGroupButton size="icon-sm" className="ml-auto rounded-full">
          ↑
        </InputGroupButton>
      </InputGroupAddon>
    </InputGroup>
  ),
};

export const Empty: Story = {
  render: () => (
    <InputGroup className="w-[28rem] rounded-xl">
      <ChatComposerAttachments attachments={[]} onRemove={() => {}} />
      <InputGroupTextarea placeholder="No attachments yet…" rows={2} />
    </InputGroup>
  ),
};
