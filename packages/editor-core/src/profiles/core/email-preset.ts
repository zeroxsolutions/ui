import { definePreset, PresetDefinitionInvalid, type BlockPreset, type PresetOptions } from '../../blocks/preset.js';
import type { EmailBlockJSON, NodeJSON } from '../../document/core/types/index.js';
import { emailBlockCodec } from './email-block-codec.js';
import { fromEmailBlocks, toEmailBlocks } from './email-blocks.js';
import { EMAIL_KINDS } from './profile.js';
import type { EditorEmailBlock, EditorProfile } from './types.js';

/** What an editor holds, for `presetFits` to test a preset against. */
export interface PresetRules {
  /** The node names in the editor's schema. */
  readonly nodes: ReadonlySet<string>;
  /** The email profile's kinds; absent for an editor that writes no email. */
  readonly kinds?: ReadonlySet<string>;
}

function nodesIn(nodes: readonly NodeJSON[]): NodeJSON[] {
  return nodes.flatMap((node) => [node, ...nodesIn(node.content ?? [])]);
}

function blocksIn(blocks: readonly EmailBlockJSON[]): EmailBlockJSON[] {
  return blocks.flatMap((block) => [block, ...blocksIn((block.lanes ?? []).flat())]);
}

const EMAIL_KIND_NAMES: ReadonlySet<string> = new Set(EMAIL_KINDS);

/**
 * Whether an editor can hold `preset`: every node it holds, at any depth, is in `rules.nodes` (marks are not
 * checked), and with `rules.kinds`, every email kind its blocks export as (a heading, a blockquote as a quote, a
 * table, an image, a button, columns, a library block and the rest) is among them. A product block's kind is
 * not checked here, since only a profile holding it gives the schema its node. A preset holding an
 * `emailUnknown` block never fits.
 */
export function presetFits(preset: BlockPreset, rules: PresetRules): boolean {
  const nodes = nodesIn(preset.content);
  if (nodes.some((node) => node.type === 'emailUnknown' || !rules.nodes.has(node.type))) return false;
  const { kinds } = rules;
  if (kinds === undefined) return true;
  // Exported as every kind is carried, so a heading the profile lacks reads as a heading, not a folded paragraph.
  const exported = blocksIn(toEmailBlocks({ type: 'doc', content: [...preset.content] }));
  return exported.every((block) => !EMAIL_KIND_NAMES.has(block.type) || kinds.has(block.type));
}

/**
 * A preset from saved email blocks, read as `profile` reads them: a library block and the profile's own blocks
 * become their nodes. The saved blocks' ids, keys and stored copies do not reach the preset.
 *
 * @throws {PresetDefinitionInvalid} for a profile that is not an email one, for a block, top-level or in a lane,
 * that the profile has no codec for, and for what `definePreset` refuses
 */
export function emailPreset(
  profile: EditorProfile,
  options: Omit<PresetOptions, 'content'> & { readonly blocks: readonly EditorEmailBlock[] },
): BlockPreset {
  const { blocks, ...rest } = options;
  if (profile.id !== 'email') throw new PresetDefinitionInvalid(options.id, `profile "${profile.id}" is not email`);
  const codecs = (profile.blocks ?? []).map(emailBlockCodec);
  const content = fromEmailBlocks(blocks, codecs).content ?? [];
  const unknown = nodesIn(content).find((node) => node.type === 'emailUnknown');
  if (unknown !== undefined) {
    const block = unknown.attrs?.block as EditorEmailBlock;
    throw new PresetDefinitionInvalid(options.id, `the profile reads no block of type "${block.type}"`);
  }
  return definePreset({ ...rest, content });
}
