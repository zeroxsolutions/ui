import { cn } from '@/registry/bases/base-ui/lib/utils';
import { createCodecRegistry } from '@zeroxsolutions/editor-core/document/serialize/index';
import { renderToReact } from '../document/serialize/render-to-react';
import { defaultComposerTriggers, type ComposerTrigger } from './composer-triggers';
import type { ChatMessagePayload } from '@zeroxsolutions/editor-core/composer/composer-types';

/**
 * The read-only render of a submitted message - the matching half of `ChatInput`.
 * It renders the payload's canonical `doc` through the **same** codecs the input
 * uses (via `renderToReact` / `toReact`), so every pill is the identical
 * component - one shared render path, no look-alike, no drift. A leading
 * `/command` is an inline node in the doc, so it renders inline in place (no
 * separate badge). No editing engine is instantiated (like the static `Viewer`),
 * so the view renders on the server; the ProseMirror-derived markup rides the
 * design tokens under the `.chat-composer` scope (the foreign-engine exception).
 */
export interface ChatMessageViewProps {
  message: ChatMessagePayload;
  /** The triggers whose codecs render the pills; defaults to the shipped
   *  `@mention` + `/command`. Pass this to render host-registered triggers. */
  triggers?: ComposerTrigger[];
  className?: string;
}

// The default codec registry (shipped mention + command pills plus the built-in
// doc/paragraph/text substrate) is stateless and pure, so it is built once and
// shared across every rendered message rather than per-render.
const defaultRegistry = createCodecRegistry(
  defaultComposerTriggers().map((trigger) => trigger.feature),
);

export function ChatMessageView({
  message,
  triggers,
  className,
}: ChatMessageViewProps) {
  const registry = triggers
    ? createCodecRegistry(triggers.map((trigger) => trigger.feature))
    : defaultRegistry;
  const body = renderToReact(message.doc, registry);
  return (
    <div
      className={cn(
        'chat-composer inline-flex flex-wrap items-baseline gap-1.5 text-sm text-foreground [&_p]:m-0 [&_p]:inline',
        className,
      )}
    >
      {body}
    </div>
  );
}
