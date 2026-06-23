import type { ComponentType, ReactNode } from 'react';

/**
 * Shared shapes for the chat component group. These are presentational
 * contracts only — a host app's richer domain types (a store's message,
 * a pending-upload record) are structurally assignable to them, so the
 * kit never imports app state.
 */

/** Sender of a message row. */
export type ChatRole = 'user' | 'assistant' | 'system' | 'tool';

/** The owning agent of an assistant message — drives the identity row and
 *  the streaming-accent colour. */
export interface ChatAgentIdentity {
  name?: string;
  /** Any CSS colour; used for the identity dot and the streaming accent. */
  color?: string;
}

/**
 * Minimal attachment shape the chip renders. A host's pending-attachment
 * type (extra fields, a narrower `kind` union) satisfies this structurally,
 * so callers pass their own record without a cast.
 */
export interface ChatAttachmentLike {
  id: string;
  name: string;
  /** `'image'` renders a thumbnail; any other value renders a file chip. */
  kind: string;
  /** `data:` URL for the image thumbnail (ignored for non-image kinds). */
  dataUrl?: string;
}

/** One empty-state suggestion card. `prompt` is reported back through
 *  `onSelectPrompt`; the rest is display. */
export interface ChatSuggestion {
  /** Leading glyph (a lucide icon component, or any icon taking `className`). */
  icon?: ComponentType<{ className?: string }>;
  title: ReactNode;
  description?: ReactNode;
  prompt: string;
}
