import type { ReactNode } from 'react';
import type { DocJSON } from '../document/core/index.js';

/**
 * Shared shapes for the chat composer surface (`ChatInput` + `ChatMessageView`).
 * These are presentational / data contracts only - a host app's richer domain
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
  /** The invocation slug typed after `/` and shown in the pill - e.g.
   *  `image-gen`. Defaults to `id` when omitted. */
  name?: string;
  /** Optional secondary line shown in the menu (what the command does). */
  description?: string;
  /** Optional leading glyph shown in the menu row (not the inline pill). */
  icon?: ReactNode;
}

/** A channel offered in the `#` menu, and carried by an inserted pill. */
export interface ChatChannel {
  id: string;
  label: string;
  /** Optional secondary line shown in the menu (the channel's topic). */
  description?: string;
  /** Optional leading glyph shown in the menu row. */
  icon?: ReactNode;
}

/** A resolved mention in a submitted message - identity plus its display label. */
export interface ChatMention {
  id: string;
  label: string;
}

/** A resolved channel in a submitted message - identity plus its display label. */
export interface ChatChannelRef {
  id: string;
  label: string;
}

/** The resolved command carried by a submitted message - the identity, its
 *  human label, and the `/name` slug the inline pill renders. */
export interface ChatCommandRef {
  id: string;
  label: string;
  name: string;
}

/**
 * The registry of trigger kinds a submitted payload can carry, keyed by the
 * token's `kind` and mapped to its payload ref shape. The library declares its
 * shipped kinds here; a host adds its own with declaration merging:
 *
 * ```ts
 * declare module '@zeroxsolutions/editor/composer/composer-types' {
 *   interface ComposerTokenRegistry { channel: ChatChannelRef }
 * }
 * ```
 *
 * `ChatMessagePayload['tokens']` is derived from this interface, so a host reads
 * `payload.tokens.mention` / `.command` with per-kind types - a typed registry,
 * not a hand-maintained union (the Slate `CustomTypes` pattern).
 */
export interface ComposerTokenRegistry {
  mention: ChatMention;
  channel: ChatChannelRef;
  command: ChatCommandRef;
}

/** Each registered kind as a typed collection of its refs. */
export type ComposerTokens = {
  [Kind in keyof ComposerTokenRegistry]: ComposerTokenRegistry[Kind][];
};

/**
 * The structured payload emitted on submit and consumed by the read-only view.
 * `doc` is the canonical single-block document (the positional source of truth
 * `ChatMessageView` renders); `text` is the flattened human-readable line (each
 * pill as its literal token); `tokens` groups the committed tokens by kind,
 * typed from `ComposerTokenRegistry` and only carrying the kinds registered.
 */
export interface ChatMessagePayload {
  /** Flattened text - a pill renders as its literal token (`@Alice`, `/image-gen`). */
  text: string;
  /** Committed tokens grouped by kind, typed and derived from the registry. */
  tokens: Partial<ComposerTokens>;
  /** The canonical single-block document - what `ChatMessageView` renders. */
  doc: DocJSON;
}
