import type { ComponentType, ReactNode } from 'react';

/**
 * Shared shapes for the chat component group. These are presentational
 * contracts only - a host app's richer domain types (a store's message,
 * a pending-upload record) are structurally assignable to them, so the
 * kit never imports app state.
 */

/** Sender of a message row. */
export type ChatRole = 'user' | 'assistant' | 'system' | 'tool';

/** The owning agent of an assistant message. Drives the identity row and the
 *  streaming-accent colour. */
export interface ChatAgentIdentity {
  name?: string;
  /** Any CSS colour; used for the identity dot and the streaming accent. */
  color?: string;
  /** Optional brand/avatar glyph rendered in place of the colour dot (e.g. a
   *  provider mark). Takes `className` for sizing. */
  icon?: ComponentType<{ className?: string }>;
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
