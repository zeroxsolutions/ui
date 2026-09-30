'use client';

import { Lightbulb } from 'lucide-react';
import { useRef, useState, type ReactNode } from 'react';

import { ChatSuggestionItem } from '@/registry/bases/base-ui/components/data-entry/chat-suggestion-item';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/registry/bases/base-ui/ui/empty';
import { FileTextIcon, type FileTextIconHandle } from '@/registry/bases/base-ui/ui/file-text';
import { ItemContent, ItemGroup, ItemMedia, ItemTitle } from '@/registry/bases/base-ui/ui/item';
import { SparklesIcon } from '@/registry/bases/base-ui/ui/sparkles';

/** An empty conversation with two starter prompts; the first one's icon plays on the item's hover or focus. */
function ChatSuggestionItemDemo(): ReactNode {
  const [sent, setSent] = useState<string | null>(null);
  const fileIconRef = useRef<FileTextIconHandle>(null);

  return (
    <Empty className="w-full">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <SparklesIcon />
        </EmptyMedia>
        <EmptyTitle>Start a conversation</EmptyTitle>
        <EmptyDescription>{sent ? `Sent: "${sent}"` : 'Ask anything, or pick a starter'}</EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <ItemGroup>
          <ChatSuggestionItem
            prompt="Summarise this document"
            onSelectPrompt={setSent}
            onMouseEnter={() => fileIconRef.current?.startAnimation()}
            onMouseLeave={() => fileIconRef.current?.stopAnimation()}
            onFocus={() => fileIconRef.current?.startAnimation()}
            onBlur={() => fileIconRef.current?.stopAnimation()}
          >
            <ItemMedia variant="icon">
              <FileTextIcon ref={fileIconRef} />
            </ItemMedia>
            <ItemContent>
              <ItemTitle>Summarise this document</ItemTitle>
            </ItemContent>
          </ChatSuggestionItem>
          <ChatSuggestionItem prompt="Suggest three ideas" onSelectPrompt={setSent}>
            <ItemMedia variant="icon">
              <Lightbulb />
            </ItemMedia>
            <ItemContent>
              <ItemTitle>Suggest three ideas</ItemTitle>
            </ItemContent>
          </ChatSuggestionItem>
        </ItemGroup>
      </EmptyContent>
    </Empty>
  );
}

export { ChatSuggestionItemDemo };
