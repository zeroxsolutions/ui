import { ChatMessage } from '@zeroxsolutions/ui/components/chat/chat-message';

import { ComponentPreview } from '@/components/component-preview';

/**
 * Isolated preview for `ChatMessage` (the renamed ChatMessageShell). Renders a
 * user-role bubble and an assistant-role row. `registry-e2e` asserts the
 * `data-slot="chat-message"` attribute is present on each and that no console
 * errors fire.
 */
export default function ChatMessagePreviewPage() {
  return (
    <main className="mx-auto max-w-3xl p-8">
      <h1 className="mb-6 text-lg font-semibold">ChatMessage</h1>
      <ComponentPreview>
        <div className="flex w-full flex-col gap-3">
          <ChatMessage role="user">Hello - any updates?</ChatMessage>
          <ChatMessage
            role="assistant"
            showAgentLabel
            agent={{ name: 'Assistant', color: '#6366f1' }}
          >
            Looking now - will report back shortly.
          </ChatMessage>
        </div>
      </ComponentPreview>
    </main>
  );
}
