import { type CSSProperties, type ReactNode } from 'react';

import { cn } from '@/registry/bases/base-ui/lib/utils';
import type { ChatAgentIdentity } from '@/registry/bases/base-ui/types/chat-agent-identity';
import type { ChatRole } from '@/registry/bases/base-ui/types/chat-role';

/**
 * ChatMessage - the wrapper for one message row, agnostic to how the
 * body is rendered.
 *
 * `user` -> a soft `bg-muted` bubble pinned to the inline-end, capped at 85%
 * width. Every other role -> full-width plain prose with an optional agent
 * identity row (colour dot + name) above and an agent-coloured leading-edge
 * accent while streaming. The host decides when to show the identity row
 * (typically only on the first message of a contiguous same-agent run) and
 * supplies the message body as `children` (markdown, tool cards, thinking -
 * none of which this wrapper knows about).
 *
 * Presentational only: no app state, no router. `className`/`...props` is not
 * spread here because the wrapper renders distinct user vs assistant trees;
 * place and size it from the consumer's surrounding container.
 */
interface ChatMessageProps {
  role: ChatRole;
  children: ReactNode;
  className?: string;
  /**
   * Owning agent for assistant messages. Drives the identity row and the
   * streaming-accent colour. Ignored for user/system/tool roles.
   */
  agent?: ChatAgentIdentity;
  /**
   * When true, render the agent identity row above the message body. The host
   * sets this only on the first message of a contiguous same-agent run.
   */
  showAgentLabel?: boolean;
  /**
   * Live-streaming flag - adds a subtle leading-edge accent in the agent's
   * colour while text is still arriving. No-op without `agent.color`.
   */
  streaming?: boolean;
}

function ChatMessage({ role, agent, showAgentLabel, streaming, children, className }: ChatMessageProps) {
  const isUser = role === 'user';

  if (isUser) {
    // Right-pinned bubble. `bg-muted` reads softer than `bg-secondary` next to
    // assistant prose (secondary is the sidebar's interactive surface and felt
    // over-emphatic here).
    return (
      <div data-slot="chat-message" data-role="user" className={cn('group ml-auto w-fit max-w-[85%]', className)}>
        <div
          className={cn(
            'bg-muted text-foreground flex max-w-full min-w-0 flex-col gap-1.5 overflow-hidden rounded-2xl px-3.5 py-2 text-sm',
            '[&>*]:max-w-full [&>*]:min-w-0',
          )}
        >
          {children}
        </div>
      </div>
    );
  }

  // Assistant (and system/tool) - full-width plain prose. A definite width on
  // the body keeps wide tool cards / code blocks inside the panel; `w-fit`
  // would let an inner pre's intrinsic width grow the parent past the edge.
  const accent = agent?.color;
  const accentStyle: CSSProperties | undefined = streaming && accent ? { borderInlineStartColor: accent } : undefined;

  return (
    <div data-slot="chat-message" data-role={role} className={cn('group flex w-full flex-col', className)}>
      {showAgentLabel && agent?.name && (
        <div className="text-muted-foreground mb-1.5 flex items-center gap-1.5 text-xs">
          {agent.icon ? (
            <agent.icon className="size-4 shrink-0" />
          ) : (
            <span
              className="size-1.5 shrink-0 rounded-full"
              style={accent ? { backgroundColor: accent } : undefined}
              aria-hidden
            />
          )}
          <span className="truncate font-medium tracking-tight">{agent.name}</span>
        </div>
      )}
      <div
        className={cn(
          'text-foreground flex max-w-full min-w-0 flex-col gap-2 overflow-hidden text-sm',
          '[&>*]:max-w-full [&>*]:min-w-0',
          // While streaming, render an agent-coloured accent on the leading
          // edge. A border (not a separate element) leaves the layout intact.
          streaming && accent && '-ml-3 border-l-2 pl-3',
        )}
        style={accentStyle}
      >
        {children}
      </div>
    </div>
  );
}

export { ChatMessage };
