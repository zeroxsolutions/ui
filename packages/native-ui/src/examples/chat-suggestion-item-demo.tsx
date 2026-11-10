import { FileText, Lightbulb, Sparkles } from 'lucide-react-native';
import { useState, type ReactNode } from 'react';

import { ChatSuggestionItem } from '@/components/data-entry/chat-suggestion-item';
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty';
import { Icon } from '@/components/ui/icon';
import { ItemContent, ItemGroup, ItemMedia, ItemTitle } from '@/components/ui/item';

/**
 * An empty conversation with two starter prompts. No document is open, so the summary starter keeps its prompt
 * and says why instead.
 */
function ChatSuggestionItemDemo(): ReactNode {
  const [sent, setSent] = useState<string | null>(null);
  const [hint, setHint] = useState<string | null>(null);

  return (
    <Empty className="w-full">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <Icon as={Sparkles} />
        </EmptyMedia>
        <EmptyTitle>Start a conversation</EmptyTitle>
        <EmptyDescription>{sent ? `Sent: "${sent}"` : (hint ?? 'Ask anything, or pick a starter')}</EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <ItemGroup>
          <ChatSuggestionItem
            prompt="Summarise this document"
            onSelectPrompt={setSent}
            onPress={(event) => {
              event.preventDefault();
              setHint('Open a document to summarise it');
            }}
          >
            <ItemMedia variant="icon">
              <Icon as={FileText} />
            </ItemMedia>
            <ItemContent>
              <ItemTitle>Summarise this document</ItemTitle>
            </ItemContent>
          </ChatSuggestionItem>
          <ChatSuggestionItem prompt="Suggest three ideas" onSelectPrompt={setSent}>
            <ItemMedia variant="icon">
              <Icon as={Lightbulb} />
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
