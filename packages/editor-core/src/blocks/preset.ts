import type { NodeJSON } from '../document/core/types/index.js';
import { DOCUMENT_MARKS } from './define-block.js';

/** A preset's id: lowercase letters, digits and hyphens, starting with a letter or a digit. */
const PRESET_ID = /^[a-z0-9][a-z0-9-]*$/;

/**
 * The core's blocks whose content is inline. A paragraph holding only a mention has no text node to tell its
 * content is inline by, and the mention's id names a person, not a block.
 */
const TEXTBLOCKS: ReadonlySet<string> = new Set(['paragraph', 'heading']);

/** A ready-made group of blocks an author inserts as one, in either editor. */
export interface BlockPreset {
  /** Unique among an editor's presets; a slash item and a drag name the preset by it. */
  readonly id: string;
  readonly label: string;
  /** Drawn as it is by the editor's menus; null when absent. */
  readonly icon: unknown;
  readonly description: string | null;
  /** Words besides the label a slash search finds the preset by. */
  readonly keywords: readonly string[];
  /** The blocks inserted, with no block id, key or stored block. */
  readonly content: readonly NodeJSON[];
}

export interface PresetOptions {
  /** Lowercase letters, digits and hyphens, starting with a letter or a digit. */
  id: string;
  label: string;
  icon?: unknown;
  description?: string;
  keywords?: readonly string[];
  /** One block or more; a block's id is cleared and its key and stored block dropped. */
  content: readonly NodeJSON[];
}

/** A preset `definePreset` or `emailPreset` refuses to build, and why. */
export class PresetDefinitionInvalid extends Error {
  constructor(
    readonly id: string,
    readonly reason: string,
  ) {
    super(`Block preset ${id}: ${reason}`);
    this.name = 'PresetDefinitionInvalid';
  }
}

function withoutIdentity(node: NodeJSON): NodeJSON {
  const copy = structuredClone(node);
  if (copy.attrs !== undefined) {
    delete copy.attrs.key;
    delete copy.attrs.stored;
    if ('id' in copy.attrs) copy.attrs.id = null;
  }
  const inline = TEXTBLOCKS.has(copy.type) || (copy.content ?? []).some((child) => child.type === 'text');
  if (copy.content !== undefined && !inline) copy.content = copy.content.map(withoutIdentity);
  return copy;
}

/**
 * A copy of `content` to insert as new blocks: every block's `id` set to null and its `key` and `stored`
 * attributes dropped, at any depth, so the host names the blocks and the editor keys them afresh. An inline node,
 * one in a paragraph, a heading or beside a text node, keeps its `id`, which names what it points at.
 */
export function presetContent(content: readonly NodeJSON[]): NodeJSON[] {
  return content.map(withoutIdentity);
}

function deepFreeze<T>(value: T): T {
  if (typeof value === 'object' && value !== null && !Object.isFrozen(value)) {
    for (const entry of Object.values(value)) deepFreeze(entry);
    Object.freeze(value);
  }
  return value;
}

/**
 * A preset either editor offers, frozen to its nested nodes, its icon aside. Its content is copied through `presetContent`, so
 * content taken from a saved document carries none of that document's identities.
 *
 * @throws {PresetDefinitionInvalid} for an id not of lowercase letters, digits and hyphens, for no content, and for
 * a text node or a mark at the top level of the content
 */
export function definePreset(options: PresetOptions): BlockPreset {
  const refuse = (reason: string): never => {
    throw new PresetDefinitionInvalid(options.id, reason);
  };
  if (!PRESET_ID.test(options.id)) refuse('the id is not lowercase letters, digits and hyphens');
  if (options.content.length === 0) refuse('it holds no block');
  for (const node of options.content) {
    if (node.type === 'text') refuse('a text node is not a block');
    if (DOCUMENT_MARKS.has(node.type)) refuse(`"${node.type}" is a mark, not a block`);
  }
  // The icon is the host's own value, such as a drawn element, so it is left as it came.
  return Object.freeze({
    id: options.id,
    label: options.label,
    icon: options.icon ?? null,
    description: options.description ?? null,
    keywords: deepFreeze([...(options.keywords ?? [])]),
    content: deepFreeze(presetContent(options.content)),
  });
}
