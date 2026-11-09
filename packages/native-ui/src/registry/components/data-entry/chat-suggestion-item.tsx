import type { ComponentProps, ReactNode } from 'react';
import { Pressable } from 'react-native';
import { cn } from '../../lib/utils';
import { Item } from '../../ui/item';

type ChatSuggestionItemProps = ComponentProps<typeof Pressable> & {
  /** The text handed to `onSelectPrompt` when the item is pressed. */
  prompt: string;
  /**
   * Receives `prompt` after the caller's `onPress`, unless that handler called `preventDefault()`. Without it
   * the item is disabled, a read-only preview, unless `disabled` says otherwise.
   */
  onSelectPrompt?: (prompt: string) => void;
};

/**
 * One starter prompt in an empty conversation, a small Item drawn as a button. Pressing it hands `prompt` to
 * `onSelectPrompt`, and the muted background shows while it is held down and enabled. Compose the item's content
 * and the empty state around it:
 *
 *   <Empty>
 *     <EmptyHeader>
 *       <EmptyMedia variant="icon"><Icon as={Sparkles} /></EmptyMedia>
 *       <EmptyTitle>Start a conversation</EmptyTitle>
 *       <EmptyDescription>Ask anything</EmptyDescription>
 *     </EmptyHeader>
 *     <EmptyContent>
 *       <ItemGroup>
 *         <ChatSuggestionItem prompt="summarise this" onSelectPrompt={send}>
 *           <ItemMedia variant="icon"><Icon as={FileText} /></ItemMedia>
 *           <ItemContent><ItemTitle>Summarise</ItemTitle></ItemContent>
 *         </ChatSuggestionItem>
 *       </ItemGroup>
 *     </EmptyContent>
 *   </Empty>
 *
 * A disabled Pressable stays an accessibility element announced as dimmed.
 */
function ChatSuggestionItem({
  prompt,
  onSelectPrompt,
  onPress,
  disabled,
  accessibilityState,
  className,
  ...props
}: ChatSuggestionItemProps): ReactNode {
  const off = disabled ?? !onSelectPrompt;
  return (
    <Item size="sm" asChild className={cn(!off && 'active:bg-muted', className)}>
      <Pressable
        role="button"
        disabled={off}
        accessibilityState={{ ...accessibilityState, disabled: off }}
        onPress={(event) => {
          onPress?.(event);
          if (!event.isDefaultPrevented()) onSelectPrompt?.(prompt);
        }}
        {...props}
      />
    </Item>
  );
}

export { ChatSuggestionItem };
export type { ChatSuggestionItemProps };
