import type { Meta, StoryObj } from '@storybook/react-vite';
import { useRef, useState } from 'react';

import { ChatComposerGhostText } from '@chiselart/ui/chat-composer-ghost-text';

const meta: Meta<typeof ChatComposerGhostText> = {
  title: 'Chat/ComposerGhostText',
  component: ChatComposerGhostText,
};
export default meta;

type Story = StoryObj<typeof ChatComposerGhostText>;

function Demo() {
  const ref = useRef<HTMLTextAreaElement>(null);
  const [text, setText] = useState('Design a landing page for ');
  return (
    <div className="relative w-[28rem]">
      <textarea
        ref={ref}
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={3}
        className="w-full rounded-md border border-input bg-transparent p-3 text-sm outline-none"
      />
      <ChatComposerGhostText
        textareaRef={ref}
        text={text}
        suggestion="a specialty coffee brand"
      />
    </div>
  );
}

export const Typeahead: Story = {
  render: () => <Demo />,
};
