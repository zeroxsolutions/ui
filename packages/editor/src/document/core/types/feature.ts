import type { CommandMap } from './command.js';
import type { MarkCodec, NodeCodec } from './codec.js';
import type { InputRuleSpec, MarkSpec, NodeSpec } from './node-spec.js';
import type {
  BlockMenuItem,
  BubbleItem,
  SlashItem,
  ToolbarItem,
} from './ui-contribution.js';

/**
 * The single declarative unit of extension (see the `editor-feature-api` spec).
 * One `defineFeature` bundles a block/mark together with its behavior,
 * serialization, and UI — the "feature = four facets" idea: edit (nodes/marks/
 * input rules/shortcuts), export/import (codecs), read (the node view), and UI
 * (slash/toolbar/block-menu). Authoring a feature imports **only** this package;
 * no engine type appears anywhere below except the opt-in `advanced` escape.
 */

/**
 * The lone engine escape. Its arrays are typed `unknown[]` here so `EditorFeature`
 * stays engine-free; the typed helpers that build these live at the explicitly
 * **unstable** `advanced` subpath, outside the SemVer-stable contract.
 */
export interface AdvancedContribution {
  /** Raw ProseMirror plugins (typed only via the `advanced` subpath). */
  prosePlugins?: unknown[];
  /** Raw engine extensions (typed only via the `advanced` subpath). */
  engineExtensions?: unknown[];
}

export interface EditorFeature {
  /** Unique feature id (used for registration and `dependsOn`). */
  id: string;
  /** Other feature ids that MUST be registered for this one to work. */
  dependsOn?: string[];

  // ── Edit (schema + behavior) ──────────────────────────────────────────────
  nodes?: NodeSpec<any>[];
  marks?: MarkSpec<any>[];
  commands?: CommandMap;
  inputRules?: InputRuleSpec[];
  /** Keyboard shortcuts, keyed by an engine-agnostic combo → command name. */
  shortcuts?: Record<string, string>;

  // ── Export / import ───────────────────────────────────────────────────────
  codecs?: NodeCodec<any>[];
  markCodecs?: MarkCodec<any>[];

  // ── UI contributions ──────────────────────────────────────────────────────
  slash?: SlashItem[];
  toolbar?: ToolbarItem[];
  bubble?: BubbleItem[];
  blockMenu?: BlockMenuItem[];

  // ── Escape hatch ──────────────────────────────────────────────────────────
  advanced?: AdvancedContribution;
}
