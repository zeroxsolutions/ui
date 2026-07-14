import {
  createCodecRegistry,
  renderToReact,
} from '../document/serialize/index.js';
import { mention } from '../document/features/mention/index.js';
import { slashCommand } from './command-node.js';
import type { ChatMessagePayload } from './composer-types.js';
import { segmentsToDoc } from './message-payload.js';

/**
 * The read-only render of a submitted message — the matching half of `ChatInput`.
 * It rebuilds the single-block document from the payload's positional `segments`
 * and renders it through the **same** `mention` + `command` codecs the input uses
 * (via `renderToReact` / `toReact`), so every pill is the identical component —
 * one shared render path, no look-alike, no drift. The leading `/command` is an
 * inline node in `segments`, so it renders inline in place (no separate badge).
 * No editing engine is instantiated (like the static `Viewer`), so the view
 * renders on the server; the ProseMirror-derived markup rides the design tokens
 * under the `.chat-composer` scope (the sanctioned foreign-engine exception).
 */
export interface ChatMessageViewProps {
  message: ChatMessagePayload;
  className?: string;
}

// The codec registry is stateless and pure (the `mention` + `command` toReact
// plus the built-in doc/paragraph/text substrate), so it is built once and shared
// across every rendered message rather than per-render.
const composerRegistry = createCodecRegistry([mention(), slashCommand()]);

export function ChatMessageView({ message, className }: ChatMessageViewProps) {
  const body = renderToReact(segmentsToDoc(message.segments), composerRegistry);
  return (
    <div
      className={[
        'chat-composer inline-flex flex-wrap items-baseline gap-1.5 text-sm text-foreground [&_p]:m-0 [&_p]:inline',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {body}
    </div>
  );
}
