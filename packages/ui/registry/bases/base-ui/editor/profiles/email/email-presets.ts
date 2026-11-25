import type { BlockPreset } from '@zeroxsolutions/editor-core/blocks/index';
import type { DocJSON, IEditor } from '@zeroxsolutions/editor-core/document/core/index';
import { docProblems, presetFits, type EditorProfile } from '@zeroxsolutions/editor-core/profiles/index';
import { contextOf } from './kit-context';

/** The blocks a lane never holds: a lane is too narrow for a hero or a card, and holds no columns of its own. */
const LANELESS: ReadonlySet<string> = new Set(['columns', 'hero', 'card']);

/**
 * Whether the email editor offers `preset` with its first block at `at`, for `presetsFeature`'s `fits`: every
 * kind it exports as is one `profile()` allows, none of its blocks is one the export folds, the structure is
 * not locked, and it lands at the top level or in a lane, a lane taking none of a columns block, a hero and a
 * card. The profile is read each time, as the editor's own checks read it.
 */
export function emailPresetFits(
  profile: () => EditorProfile,
): (preset: BlockPreset, editor: IEditor, at: number) => boolean {
  return (preset, editor, at) => {
    const found = contextOf(editor);
    if (!found || found.context.locked()) return false;
    const { kinds } = profile();
    const { doc, schema } = found.engine.state;
    if (!presetFits(preset, { nodes: new Set(Object.keys(schema.nodes)), kinds: new Set(kinds) })) return false;
    const content: DocJSON = { type: 'doc', content: [...preset.content] };
    if (docProblems(content, { kinds }).some((problem) => problem.kind === 'block-not-carried')) return false;
    const parent = doc.resolve(at).parent;
    if (parent === doc) return true;
    return parent.type.name === 'column' && !preset.content.some((node) => LANELESS.has(node.type));
  };
}
