import type { Meta, StoryObj } from '@storybook/react-vite';
import { useRef, useState } from 'react';

import { ChatComposerGhostText } from '@zeroxsolutions/ui/components/chat/chat-composer-ghost-text';
import { Textarea } from '@zeroxsolutions/ui/components/ui/textarea';

/**
 * `ChatComposerGhostText` is an inline typeahead overlay that renders a
 * predicted continuation as muted ghost text positioned right after the user's
 * draft inside a composer textarea. It mounts as an absolutely positioned,
 * click-through sibling of the textarea and mirrors its measured typography and
 * padding, so the host computes the suggestion while this only positions it.
 */
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
      <Textarea
        ref={ref}
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={3}
      />
      <ChatComposerGhostText
        textareaRef={ref}
        text={text}
        suggestion="a specialty coffee brand"
      />
    </div>
  );
}

/**
 * A controlled `Textarea` with a fixed `suggestion`: the ghost continuation
 * appears in muted text immediately after the caret and stays aligned as the
 * draft is edited.
 */
export const Typeahead: Story = {
  render: () => <Demo />,
};
