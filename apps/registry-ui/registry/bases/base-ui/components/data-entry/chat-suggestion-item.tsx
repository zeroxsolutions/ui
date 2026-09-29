import type { ComponentProps, ReactNode } from 'react';

import { Item } from '@/registry/bases/base-ui/ui/item';
import { cn } from '@/registry/bases/base-ui/lib/utils';

/**
 * ChatSuggestionItem - one starter prompt in an empty conversation, an upstream
 * `Item` rendered as a button. Picking it hands `prompt` to `onSelectPrompt`.
 * The consumer composes the item's content and the empty state around it:
 *
 *   <Empty>
 *     <EmptyHeader>
 *       <EmptyMedia variant="icon"><Sparkles /></EmptyMedia>
 *       <EmptyTitle>Start a conversation</EmptyTitle>
 *       <EmptyDescription>Ask anything</EmptyDescription>
 *     </EmptyHeader>
 *     <EmptyContent>
 *       <ItemGroup>
 *         <ChatSuggestionItem prompt="summarise this" onSelectPrompt={send}>
 *           <ItemMedia><FileText /></ItemMedia>
 *           <ItemContent><ItemTitle>Summarise</ItemTitle></ItemContent>
 *         </ChatSuggestionItem>
 *       </ItemGroup>
 *     </EmptyContent>
 *   </Empty>
 */
interface ChatSuggestionItemProps extends ComponentProps<'button'> {
  /** The text handed to `onSelectPrompt` when the item is picked. */
  prompt: string;
  /**
   * Receives `prompt` after the caller's `onClick`, unless that handler
   * called `preventDefault()`. Without it the item renders disabled, a
   * read-only preview, unless `disabled` says otherwise.
   */
  onSelectPrompt?: (prompt: string) => void;
}

function ChatSuggestionItem({
  prompt,
  onSelectPrompt,
  onClick,
  disabled,
  className,
  ...props
}: ChatSuggestionItemProps): ReactNode {
  return (
    <Item
      size="sm"
      render={
        <button
          type="button"
          data-slot="chat-suggestion-item"
          disabled={disabled ?? !onSelectPrompt}
          onClick={(event) => {
            onClick?.(event);
            if (!event.defaultPrevented) onSelectPrompt?.(prompt);
          }}
          className={cn(
            'hover:bg-muted w-full cursor-pointer text-left disabled:cursor-default disabled:opacity-60',
            className,
          )}
          {...props}
        />
      }
    />
  );
}

export { ChatSuggestionItem };
export type { ChatSuggestionItemProps };
