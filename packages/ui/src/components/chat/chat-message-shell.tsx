import { type CSSProperties, type ReactNode } from 'react';

import { cn } from '@/lib/utils';
import type { ChatAgentIdentity, ChatRole } from './chat-types';

/**
 * ChatMessageShell — the wrapper for one message row, agnostic to how the
 * body is rendered.
 *
 * `user` → a soft `bg-muted` bubble pinned to the inline-end, capped at 85%
 * width. Every other role → full-width plain prose with an optional agent
 * identity row (colour dot + name) above and an agent-coloured leading-edge
 * accent while streaming. The host decides when to show the identity row
 * (typically only on the first message of a contiguous same-agent run) and
 * supplies the message body as `children` (markdown, tool cards, thinking —
 * none of which this shell knows about).
 *
 * Presentational only: no app state, no router. `className`/`...props` is not
 * spread here because the shell renders distinct user vs assistant trees;
 * place and size it from the consumer's surrounding container.
 */
export interface ChatMessageShellProps {
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
   * Live-streaming flag — adds a subtle leading-edge accent in the agent's
   * colour while text is still arriving. No-op without `agent.color`.
   */
  streaming?: boolean;
}

export function ChatMessageShell({
  role,
  agent,
  showAgentLabel,
  streaming,
  children,
  className,
}: ChatMessageShellProps) {
  const isUser = role === 'user';

  if (isUser) {
    // Right-pinned bubble. `bg-muted` reads softer than `bg-secondary` next to
    // assistant prose (secondary is the sidebar's interactive surface and felt
    // over-emphatic here).
    return (
      <div
        data-role="user"
        className={cn('group ml-auto w-fit max-w-[85%]', className)}
      >
        <div
          className={cn(
            'flex min-w-0 max-w-full flex-col gap-1.5 overflow-hidden rounded-2xl bg-muted px-3.5 py-2 text-sm text-foreground',
            '[&>*]:min-w-0 [&>*]:max-w-full',
          )}
        >
          {children}
        </div>
      </div>
    );
  }

  // Assistant (and system/tool) — full-width plain prose. A definite width on
  // the body keeps wide tool cards / code blocks inside the panel; `w-fit`
  // would let an inner pre's intrinsic width grow the parent past the edge.
  const accent = agent?.color;
  const accentStyle: CSSProperties | undefined =
    streaming && accent ? { borderInlineStartColor: accent } : undefined;

  return (
    <div data-role={role} className={cn('group flex w-full flex-col', className)}>
      {showAgentLabel && agent?.name && (
        <div className="mb-1.5 flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <span
            className="size-1.5 shrink-0 rounded-full"
            style={accent ? { backgroundColor: accent } : undefined}
            aria-hidden
          />
          <span className="truncate font-medium tracking-tight">
            {agent.name}
          </span>
        </div>
      )}
      <div
        className={cn(
          'flex min-w-0 max-w-full flex-col gap-2 overflow-hidden text-sm text-foreground',
          '[&>*]:min-w-0 [&>*]:max-w-full',
          // While streaming, render an agent-coloured accent on the leading
          // edge. A border (not a separate element) leaves the layout intact.
          streaming && accent && 'border-l-2 pl-3 -ml-3',
        )}
        style={accentStyle}
      >
        {children}
      </div>
    </div>
  );
}
