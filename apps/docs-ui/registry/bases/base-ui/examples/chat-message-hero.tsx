import { ChatMessage } from "@/registry/bases/base-ui/components/chat/chat-message"

/** A user bubble plus an assistant row - the ChatMessage hero (monochrome). */
export function ChatMessageHero() {
  return (
    <div className="flex w-full flex-col gap-3">
      <ChatMessage role="user">Hello - any updates?</ChatMessage>
      <ChatMessage role="assistant" showAgentLabel agent={{ name: "Assistant" }}>
        Looking now - will report back shortly.
      </ChatMessage>
    </div>
  )
}
