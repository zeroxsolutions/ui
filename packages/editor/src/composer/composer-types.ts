import type { ReactNode } from 'react';

/**
 * Shared shapes for the chat composer surface (`ChatInput` + `ChatMessageView`).
 * These are presentational / data contracts only — a host app's richer domain
 * types (a directory record, a command registry entry) are structurally
 * assignable to them, so the surface imports no app state.
 */

/** A person offered in the `@` mention menu, and carried by an inserted pill. */
export interface ChatPerson {
  id: string;
  label: string;
  /** Optional secondary line shown in the menu (a handle, email, or role). */
  description?: string;
  /** Optional leading glyph shown in the menu row. */
  icon?: ReactNode;
}

/** A command offered in the `/` menu. Invoked by typing its `name` slug after
 *  `/` (or picking it from the menu); the inline pill then reads `/name`. */
export interface ChatCommand {
  id: string;
  label: string;
  /** The invocation slug typed after `/` and shown in the pill — e.g.
   *  `image-gen`. Defaults to `id` when omitted (and is matched case-insensitively
   *  alongside the label). */
  name?: string;
  /** Optional secondary line shown in the menu (what the command does). */
  description?: string;
  /** Optional leading glyph shown in the menu row (not the inline pill). */
  icon?: ReactNode;
}

/** A resolved mention in a submitted message — identity plus its display label. */
export interface ChatMention {
  id: string;
  label: string;
}

/** The resolved command carried by a submitted message — the identity, its
 *  human label, and the `/name` slug the inline pill renders. A lightweight ref
 *  (no `icon`/`description`): a consumer maps back to its registry by `id`. */
export interface ChatCommandRef {
  id: string;
  label: string;
  name: string;
}

/**
 * One ordered piece of a message body: a run of plain text, a mention, or a
 * leading `/command` token. Positional, so a reader can place each pill exactly
 * where it sits in the line (a command only ever leads).
 */
export type ChatSegment =
  | { text: string }
  | { mention: ChatMention }
  | { command: ChatCommandRef };

/** The structured payload emitted on submit and consumed by the view. */
export interface ChatMessagePayload {
  /** The leading command, or `null` when the message carries none. A convenience
   *  derived from the leading `command` segment (like `mentions`). */
  command: ChatCommandRef | null;
  /** Resolved mentions, de-duplicated by `id`, in first-seen order. */
  mentions: ChatMention[];
  /** Ordered text / mention / command segments; a flat text is derivable. */
  segments: ChatSegment[];
}

/** Derive a flat, human-readable string from a message's positional segments —
 *  `/name` for a command, `@label` for a mention, the run for text. A leading
 *  command is separated from its argument by a space (the composer keeps no
 *  literal space in the document — the pill's gap is visual), so the flat string
 *  reads as a typed command line. */
export function segmentsToText(segments: ChatSegment[]): string {
  return segments
    .map((segment, index) => {
      if ('text' in segment) return segment.text;
      if ('mention' in segment) return `@${segment.mention.label}`;
      const trailing = index < segments.length - 1 ? ' ' : '';
      return `/${segment.command.name}${trailing}`;
    })
    .join('');
}
