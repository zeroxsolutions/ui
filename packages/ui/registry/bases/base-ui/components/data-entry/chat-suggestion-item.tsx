import type { ComponentProps, ReactNode } from 'react';

import { Item } from '@/registry/bases/base-ui/ui/item';
import { cn } from '@/registry/bases/base-ui/lib/utils';

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

/**
 * ChatSuggestionItem - one starter prompt in an empty conversation, an upstream
 * `Item` rendered as a button. Picking it hands `prompt` to `onSelectPrompt`.
 * Upstream's example renders an interactive Item only as a link, and the Item
 * recipe's hover matches only `a`, so this button Item draws that same
 * `hover:bg-muted` itself, while it is enabled. `className` merges against the
 * Item recipe.
 * The consumer composes the item's content and the empty state around it:
 *
 *   <Empty>
 *     <EmptyHeader>
 *       <EmptyMedia variant="icon"><SparklesIcon /></EmptyMedia>
 *       <EmptyTitle>Start a conversation</EmptyTitle>
 *       <EmptyDescription>Ask anything</EmptyDescription>
 *     </EmptyHeader>
 *     <EmptyContent>
 *       <ItemGroup>
 *         <ChatSuggestionItem prompt="summarise this" onSelectPrompt={send}>
 *           <ItemMedia variant="icon"><FileTextIcon /></ItemMedia>
 *           <ItemContent><ItemTitle>Summarise</ItemTitle></ItemContent>
 *         </ChatSuggestionItem>
 *       </ItemGroup>
 *     </EmptyContent>
 *   </Empty>
 */
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
      className={cn('enabled:hover:bg-muted text-left', className)}
      render={
        <button
          type="button"
          data-slot="chat-suggestion-item"
          disabled={disabled ?? !onSelectPrompt}
          onClick={(event) => {
            onClick?.(event);
            if (!event.defaultPrevented) onSelectPrompt?.(prompt);
          }}
          {...props}
        />
      }
    />
  );
}

export { ChatSuggestionItem };
export type { ChatSuggestionItemProps };
