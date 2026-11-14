'use client';

import { useState, type ReactNode } from 'react';

import type { ChatMessagePayload } from '@zeroxsolutions/editor-core/composer/composer-types';

import { ChatInput } from '@/registry/bases/base-ui/editor/composer/chat-input';

/** A one-line composer: Enter sends, and the text it sent is listed under it. */
function ChatInputDemo(): ReactNode {
  const [sent, setSent] = useState<string[]>([]);
  return (
    <div className="flex w-full max-w-md flex-col gap-3">
      <ChatInput
        placeholder="Message the group..."
        onSubmit={(payload: ChatMessagePayload) => setSent((current) => [...current, payload.text])}
      />
      <ul className="flex flex-col gap-1 text-sm">
        {sent.map((text, index) => (
          <li key={index}>{text}</li>
        ))}
      </ul>
    </div>
  );
}

export { ChatInputDemo };
