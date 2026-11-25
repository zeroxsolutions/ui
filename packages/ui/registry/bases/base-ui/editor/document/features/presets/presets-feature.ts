import { z } from 'zod';
import { LayoutPanelTopIcon } from '@/registry/bases/base-ui/icons/lucide/layout-panel-top-icon';
import { presetContent, type BlockPreset } from '@zeroxsolutions/editor-core/blocks/index';
import {
  dropPoint,
  Extension,
  facadeFor,
  Fragment,
  Plugin,
  PluginKey,
  Selection,
  Slice,
  type Editor,
  type EditorView,
  type EngineHandle,
  type ProseMirrorNode,
} from '@zeroxsolutions/editor-core/document/advanced';
import {
  defineFeature,
  EditorError,
  type EditorFeature,
  type IEditor,
} from '@zeroxsolutions/editor-core/document/core/index';
import { presetFits } from '@zeroxsolutions/editor-core/profiles/core/index';

/** The drag type a preset travels under; its data is the preset's id. */
export const PRESET_MIME = 'application/x-zui-preset';

/**
 * A second drag type carrying the id in its name. A page reads a drag's data only on the drop, and its types
 * all along, so this is how the editor knows which preset is over it while it decides where it may land.
 */
const PRESET_TYPE_PREFIX = `${PRESET_MIME};id=`;

/** What `presetsFeature` takes besides the presets. */
export interface PresetsFeatureOptions {
  /**
   * Whether `editor` takes `preset` with its first block at the document position `at`, checked after the
   * schema holds every node of it and `at` takes them. Every such preset fits when absent.
   */
  fits?(preset: BlockPreset, editor: IEditor, at: number): boolean;
  /** The slash menu's heading over the presets. Default: `Presets`. */
  group?: string;
}

/** Puts `id` on a drag starting at a presets panel's row, so an editor with the preset takes the drop. */
export function startPresetDrag(data: DataTransfer, id: string): void {
  data.setData(PRESET_MIME, id);
  data.setData(`${PRESET_TYPE_PREFIX}${id}`, id);
  data.effectAllowed = 'copy';
}

/** The id of the preset a drag carries, or null for any other drag. */
function draggedPreset(data: DataTransfer | null): string | null {
  if (!data) return null;
  const typed = [...data.types].find((type) => type.startsWith(PRESET_TYPE_PREFIX));
  if (typed !== undefined) return typed.slice(PRESET_TYPE_PREFIX.length);
  return data.types.includes(PRESET_MIME) ? data.getData(PRESET_MIME) || null : null;
}

type EngineState = Editor['state'];

/** Where an insert goes: a block boundary, or the empty line it takes the place of. */
interface Target {
  from: number;
  to: number;
}

/**
 * The block holding the selection at its level: the innermost one that is a top-level block or a block of a
 * lane. A list, a quote or a table holding the caret is that block, not the line inside it.
 */
function holdingBlock(state: EngineState): { node: ProseMirrorNode; pos: number } | null {
  const { selection, doc } = state;
  const { $from } = selection;
  const picked = (selection as { node?: ProseMirrorNode }).node;
  const chain: { node: ProseMirrorNode; pos: number; parent: ProseMirrorNode }[] = [];
  if (picked?.isBlock) chain.push({ node: picked, pos: $from.pos, parent: $from.parent });
  for (let depth = $from.depth; depth >= 1; depth -= 1) {
    chain.push({ node: $from.node(depth), pos: $from.before(depth), parent: $from.node(depth - 1) });
  }
  const found = chain.find(({ parent }) => parent === doc || Boolean(parent.type.spec.container));
  return found ? { node: found.node, pos: found.pos } : null;
}

/**
 * After the block holding the selection, or in place of it when it is an empty line no host has saved, which
 * the slash menu and the "+" leave behind them.
 */
function caretTarget(state: EngineState): Target | null {
  const block = holdingBlock(state);
  if (!block) return null;
  const end = block.pos + block.node.nodeSize;
  const blank = block.node.type.name === 'paragraph' && block.node.content.size === 0 && !block.node.attrs.id;
  return blank ? { from: block.pos, to: end } : { from: end, to: end };
}

/** Whether `nodes` may stand in `target`: a boundary between blocks whose parent takes them there. */
function takes(doc: ProseMirrorNode, target: Target, nodes: readonly ProseMirrorNode[]): boolean {
  if (target.from < 0 || target.to > doc.content.size) return false;
  const $from = doc.resolve(target.from);
  if ($from.parent.inlineContent) return false;
  const index = $from.index();
  const replaced = target.to > target.from ? 1 : 0;
  return $from.parent.canReplace(index, index + replaced, Fragment.from([...nodes]));
}

const insertArgs = z.object({ id: z.string().min(1), at: z.number().int().min(0).optional() });
type InsertArgs = z.infer<typeof insertArgs>;

/**
 * The presets a product declared, inserted by the `insertPreset` command, picked from the slash menu under
 * Presets, and dropped from a presets panel onto the document. A preset is offered where the schema holds
 * every node of it and `options.fits` agrees. Inserted blocks are new ones: no id, no key, nothing tying them
 * back to the preset; one insert is one undo step.
 *
 * @throws {EditorError} `editor.presets.duplicate_id` for two presets with one id, which a slash item and a drag
 * could not tell apart
 */
export function presetsFeature(presets: readonly BlockPreset[], options: PresetsFeatureOptions = {}): EditorFeature {
  const byId = new Map<string, BlockPreset>();
  for (const preset of presets) {
    if (byId.has(preset.id)) {
      throw new EditorError('editor.presets.duplicate_id', `Two of the presets have the id "${preset.id}".`);
    }
    byId.set(preset.id, preset);
  }
  // Commands receive the facade; this is how they reach the engine behind it.
  const engines = new Set<Editor>();
  const engineOf = (facade: IEditor) =>
    [...engines].find((engine) => facadeFor(engine as unknown as EngineHandle) === facade);
  // A preset's nodes per engine, read against its schema once; null when the schema refuses them.
  const parsed = new WeakMap<Editor, Map<string, ProseMirrorNode[] | null>>();

  const nodesOf = (engine: Editor, preset: BlockPreset): ProseMirrorNode[] | null => {
    let cache = parsed.get(engine);
    if (!cache) parsed.set(engine, (cache = new Map()));
    if (!cache.has(preset.id)) {
      let nodes: ProseMirrorNode[] | null = null;
      if (presetFits(preset, { nodes: new Set(Object.keys(engine.schema.nodes)) })) {
        try {
          nodes = presetContent(preset.content).map((json) => engine.schema.nodeFromJSON(json));
          for (const node of nodes) node.check();
        } catch {
          nodes = null;
        }
      }
      cache.set(preset.id, nodes);
    }
    return cache.get(preset.id) ?? null;
  };

  /** What `insertPreset` with `args` would insert and where, or null when it cannot. */
  const planOf = (editor: IEditor, args: InsertArgs) => {
    const preset = byId.get(args.id);
    const engine = engineOf(editor);
    if (!preset || !engine || !editor.isEditable()) return null;
    const nodes = nodesOf(engine, preset);
    const { state } = engine;
    const target = args.at === undefined ? caretTarget(state) : { from: args.at, to: args.at };
    if (!nodes || !target || !takes(state.doc, target, nodes)) return null;
    if (options.fits && !options.fits(preset, editor, target.from)) return null;
    return { engine, nodes, target };
  };

  /** Where a preset dropped at the pointer of `event` lands: the boundary the drop cursor snaps to. */
  const dropTarget = (engine: Editor, view: EditorView, event: DragEvent, id: string): number | null => {
    const preset = byId.get(id);
    const nodes = preset && nodesOf(engine, preset);
    const pointer = view.posAtCoords({ left: event.clientX, top: event.clientY });
    if (!nodes || !pointer) return null;
    return dropPoint(view.state.doc, pointer.pos, new Slice(Fragment.from(nodes), 0, 0)) ?? null;
  };

  const dropPlugin = (engine: Editor) => {
    // The drag the editor's drop cursor reads while a preset is over a spot that takes it.
    let shown: EditorView['dragging'] = null;
    const hide = (view: EditorView) => {
      if (shown === null) return;
      if (view.dragging === shown) view.dragging = null;
      shown = null;
      // The drop cursor clears itself on a drag leaving the editor and offers no other way to.
      view.dom.dispatchEvent(new DragEvent('dragleave', { relatedTarget: null }));
    };
    return new Plugin({
      key: new PluginKey('presetDrop'),
      props: {
        handleDOMEvents: {
          dragover(view, event) {
            const id = draggedPreset(event.dataTransfer);
            if (id === null) return false;
            const facade = facadeFor(engine as unknown as EngineHandle);
            const at = dropTarget(engine, view, event, id);
            if (at === null || !facade?.can('insertPreset', { id, at })) {
              // Not prevented, so the browser refuses the drop; and the drop cursor draws nothing.
              event.stopImmediatePropagation();
              hide(view);
              return true;
            }
            event.preventDefault();
            if (event.dataTransfer) event.dataTransfer.dropEffect = 'copy';
            const preset = byId.get(id)!;
            shown = { slice: new Slice(Fragment.from(nodesOf(engine, preset)!), 0, 0), move: false };
            view.dragging = shown;
            return true;
          },
          dragleave(view, event) {
            const to = event.relatedTarget;
            if (shown !== null && !(to instanceof Node && view.dom.contains(to))) {
              if (view.dragging === shown) view.dragging = null;
              shown = null;
            }
            return false;
          },
          drop(view, event) {
            const id = draggedPreset(event.dataTransfer);
            if (id === null) return false;
            if (view.dragging === shown) view.dragging = null;
            shown = null;
            event.preventDefault();
            const facade = facadeFor(engine as unknown as EngineHandle);
            const at = dropTarget(engine, view, event, id);
            if (facade && at !== null && facade.can('insertPreset', { id, at })) {
              facade.run('insertPreset', { id, at });
              view.focus();
            }
            return true;
          },
        },
      },
    });
  };

  return defineFeature({
    id: 'presets',
    commands: {
      insertPreset: {
        args: insertArgs,
        run: (editor, args: InsertArgs) => {
          const plan = planOf(editor, args);
          if (!plan) return false;
          const { engine, nodes, target } = plan;
          const before = engine.state.doc;
          const tr = engine.state.tr.replaceWith(target.from, target.to, nodes);
          const end = target.from + Fragment.from(nodes).size;
          tr.setSelection(Selection.near(tr.doc.resolve(end), -1)).scrollIntoView();
          engine.view.dispatch(tr);
          return engine.state.doc !== before;
        },
        can: (editor, args: InsertArgs) => planOf(editor, args) !== null,
      },
    },
    slash: presets.map((preset) => ({
      id: `preset-${preset.id}`,
      title: preset.label,
      ...(preset.description === null ? {} : { description: preset.description }),
      icon: preset.icon ?? LayoutPanelTopIcon,
      group: options.group ?? 'Presets',
      keywords: [...preset.keywords],
      command: 'insertPreset',
      args: { id: preset.id },
    })),
    advanced: {
      engineExtensions: [
        Extension.create({
          name: 'presets',
          onBeforeCreate() {
            engines.add(this.editor);
          },
          onDestroy() {
            engines.delete(this.editor);
          },
          addProseMirrorPlugins() {
            return [dropPlugin(this.editor)];
          },
        }),
      ],
    },
  });
}
