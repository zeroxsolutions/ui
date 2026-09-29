import { ChatMessage } from '@/registry/bases/base-ui/components/data-display/chat-message';
import { Bubble, BubbleContent } from '@/registry/bases/base-ui/ui/bubble';
import { MessageContent, MessageHeader } from '@/registry/bases/base-ui/ui/message';
import { AiProviderPicker, type AiProviderPickerEntry } from '@/registry/bases/base-ui/blocks/ai-provider-picker';

export interface DemoPageProps {
  /** Tile data forwarded to the picker; defaults to the picker's own sample. */
  entries?: AiProviderPickerEntry[];
  className?: string;
}

/**
 * A `registry:page` - a small page region composing one block
 * (`AiProviderPicker`) and one documented component (`ChatMessage`) to show
 * pages assemble blocks and components into a real interface. The host renders
 * the picker; a sample exchange below shows the chosen provider in chat.
 */
export function DemoPage({ entries, className }: DemoPageProps) {
  return (
    <div data-slot="demo-page" className={className ?? 'mx-auto flex w-full max-w-3xl flex-col gap-6'}>
      <section data-slot="demo-page-picker">
        <header className="mb-3 flex flex-col gap-1">
          <h2 className="text-lg font-semibold">Choose a provider</h2>
          <p className="text-muted-foreground text-sm">Pick the model backend for this conversation.</p>
        </header>
        <AiProviderPicker entries={entries} />
      </section>
      <section data-slot="demo-pane-chat" className="flex flex-col gap-2">
        <ChatMessage align="end">
          <MessageContent>
            <Bubble variant="muted">
              <BubbleContent>Which provider should we use?</BubbleContent>
            </Bubble>
          </MessageContent>
        </ChatMessage>
        <ChatMessage>
          <MessageContent>
            <MessageHeader>Assistant</MessageHeader>
            <Bubble variant="ghost">
              <BubbleContent>
                Pick any tile above - each card is one provider; the picker calls back with its key when you choose.
              </BubbleContent>
            </Bubble>
          </MessageContent>
        </ChatMessage>
      </section>
    </div>
  );
}
