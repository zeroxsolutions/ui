import { z } from 'zod';
import { LayoutPanelTopIcon } from '@/registry/bases/base-ui/icons/lucide/layout-panel-top-icon';
import { presetContent, type BlockPreset } from '@zeroxsolutions/editor-core/blocks/index';
import {
  Extension,
  facadeFor,
  Fragment,
  Plugin,
  PluginKey,
  Selection,
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
 * After `block`, or in place of it when it is an empty line no host has saved, which the slash menu and the "+"
 * leave behind them.
 */
function beside(block: { node: ProseMirrorNode; pos: number }): Target {
  const end = block.pos + block.node.nodeSize;
  const blank = block.node.type.name === 'paragraph' && block.node.content.size === 0 && !block.node.attrs.id;
  return blank ? { from: block.pos, to: end } : { from: end, to: end };
}

/** Beside the block holding the selection, at its level. */
function caretTarget(state: EngineState): Target | null {
  const block = holdingBlock(state);
  return block ? beside(block) : null;
}

/**
 * Beside the top-level block holding the selection, or beside the document's last block while the editor has never
 * had the focus, when its selection is only where the engine started it rather than a spot the author picked.
 */
function topTarget(state: EngineState, placed: boolean): Target | null {
  const { selection, doc } = state;
  const last = doc.lastChild;
  if (!placed) return last ? beside({ node: last, pos: doc.content.size - last.nodeSize }) : { from: 0, to: 0 };
  const { $from } = selection;
  if ($from.depth >= 1) return beside({ node: $from.node(1), pos: $from.before(1) });
  const picked = (selection as { node?: ProseMirrorNode }).node;
  return picked ? beside({ node: picked, pos: $from.pos }) : { from: $from.pos, to: $from.pos };
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

/**
 * The boundaries a drop at `pointer` may land on, innermost level first: at each level that is the document or a
 * lane, the side of the block under the pointer nearer to `top`, read from the block's drawn box.
 */
function dropBoundaries(view: EditorView, pointer: { pos: number; inside: number }, top: number): number[] {
  const { doc } = view.state;
  const $pos = doc.resolve(pointer.pos);
  // An atom the pointer is over resolves to a boundary beside it; it is the block under the pointer there.
  const atom = pointer.inside >= 0 ? doc.resolve(pointer.inside) : null;
  const found: number[] = [];
  for (let depth = $pos.depth; depth >= 0; depth -= 1) {
    if (depth > 0 && !$pos.node(depth).type.spec.container) continue;
    let start: number;
    if (depth < $pos.depth) start = $pos.before(depth + 1);
    else if (atom?.depth === depth && atom.parent === $pos.parent) start = pointer.inside;
    else {
      found.push($pos.pos);
      continue;
    }
    const block = doc.nodeAt(start);
    const drawn = view.nodeDOM(start);
    if (!block) continue;
    const box = drawn instanceof HTMLElement ? drawn.getBoundingClientRect() : null;
    const below = box ? top > box.top + box.height / 2 : pointer.pos > start + block.nodeSize / 2;
    found.push(below ? start + block.nodeSize : start);
  }
  return found;
}

/**
 * Whether a drag left the editor with `event`. Safari leaves `relatedTarget` null on a dragleave between two
 * elements inside the editor, so a leave with none is read from where the pointer is.
 */
function leftEditor(view: EditorView, event: DragEvent): boolean {
  const to = event.relatedTarget;
  if (to instanceof Node) return !view.dom.contains(to);
  const box = view.dom.getBoundingClientRect();
  const { clientX: x, clientY: y } = event;
  return x < box.left || x > box.right || y < box.top || y > box.bottom;
}

/** The line a preset's drag draws at the boundary it would drop on, in the place and look of the editor's own. */
function dropCursorOf(): { show(view: EditorView, at: number): void; hide(): void } {
  let line: HTMLElement | null = null;
  const hide = () => {
    line?.remove();
    line = null;
    document.removeEventListener('dragend', hide, true);
  };
  const show = (view: EditorView, at: number) => {
    const $at = view.state.doc.resolve(at);
    const before = $at.nodeBefore ? view.nodeDOM(at - $at.nodeBefore.nodeSize) : null;
    const after = $at.nodeAfter ? view.nodeDOM(at) : null;
    const above = before instanceof HTMLElement ? before.getBoundingClientRect() : null;
    const below = after instanceof HTMLElement ? after.getBoundingClientRect() : null;
    const edge = above ?? below;
    const parent = view.dom.offsetParent;
    if (!edge || !(parent instanceof HTMLElement)) return hide();
    const y = above && below ? (above.bottom + below.top) / 2 : above ? above.bottom : edge.top;
    const origin =
      parent === document.body && getComputedStyle(parent).position === 'static'
        ? { left: -window.scrollX, top: -window.scrollY }
        : (() => {
            const box = parent.getBoundingClientRect();
            return { left: box.left - parent.scrollLeft, top: box.top - parent.scrollTop };
          })();
    if (!line) {
      line = parent.appendChild(document.createElement('div'));
      line.className = 'prosemirror-dropcursor-block';
      line.style.cssText = 'position: absolute; z-index: 50; pointer-events: none; background-color: currentColor;';
      // A drag cancelled over the editor ends at its source with no dragleave here.
      document.addEventListener('dragend', hide, true);
    }
    line.style.left = `${edge.left - origin.left}px`;
    line.style.top = `${y - 0.5 - origin.top}px`;
    line.style.width = `${edge.right - edge.left}px`;
    line.style.height = '1px';
  };
  return { show, hide };
}

const insertArgs = z.object({
  id: z.string().min(1),
  at: z.number().int().min(0).optional(),
  level: z.literal('top').optional(),
});
type InsertArgs = z.infer<typeof insertArgs>;

/**
 * The presets a product declared, inserted by the `insertPreset` command, picked from the slash menu under
 * Presets, and dropped from a presets panel onto the document. A preset is offered where the schema holds
 * every node of it and `options.fits` agrees. Inserted blocks are new ones: no id, no key, nothing tying them
 * back to the preset; one insert is one undo step.
 *
 * `insertPreset` takes `{ id, at?, level? }`: at the block boundary `at`; with `level: 'top'`, after the top-level
 * block holding the selection, or after the document's last block while the editor has never had the focus;
 * otherwise after the block holding the selection, at its level, a column's block included. Either of the last
 * two takes the place of an empty line no host has saved instead of going after it.
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
  // The engines whose view has had the focus, so a selection in them is one the author placed.
  const placed = new WeakSet<Editor>();
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
    const target =
      args.at !== undefined
        ? { from: args.at, to: args.at }
        : args.level === 'top'
          ? topTarget(state, placed.has(engine))
          : caretTarget(state);
    if (!nodes || !target || !takes(state.doc, target, nodes)) return null;
    if (options.fits && !options.fits(preset, editor, target.from)) return null;
    return { engine, nodes, target };
  };

  /**
   * Where a preset dropped at the pointer of `event` lands: the boundary nearest the pointer beside the block it
   * is over, at the innermost level that is the document or a lane and takes the preset, as a click would.
   */
  const dropTarget = (engine: Editor, view: EditorView, event: DragEvent, id: string): number | null => {
    const facade = facadeFor(engine as unknown as EngineHandle);
    const pointer = view.posAtCoords({ left: event.clientX, top: event.clientY });
    if (!facade || !pointer) return null;
    return dropBoundaries(view, pointer, event.clientY).find((at) => facade.can('insertPreset', { id, at })) ?? null;
  };

  const dropPlugin = (engine: Editor) => {
    const cursor = dropCursorOf();
    return new Plugin({
      key: new PluginKey('presetDrop'),
      view: () => ({ destroy: cursor.hide }),
      props: {
        handleDOMEvents: {
          focus() {
            placed.add(engine);
            return false;
          },
          dragover(view, event) {
            const id = draggedPreset(event.dataTransfer);
            if (id === null) return false;
            // The editor's own drop cursor snaps to the innermost level the schema takes, a table cell or a
            // list item, so a preset's drag draws this one instead.
            event.stopImmediatePropagation();
            const at = dropTarget(engine, view, event, id);
            if (at === null) {
              // Not prevented, so the browser refuses the drop.
              cursor.hide();
              return true;
            }
            event.preventDefault();
            if (event.dataTransfer) event.dataTransfer.dropEffect = 'copy';
            cursor.show(view, at);
            return true;
          },
          dragleave(view, event) {
            if (leftEditor(view, event)) cursor.hide();
            return false;
          },
          drop(view, event) {
            const id = draggedPreset(event.dataTransfer);
            if (id === null) return false;
            cursor.hide();
            event.preventDefault();
            const facade = facadeFor(engine as unknown as EngineHandle);
            const at = dropTarget(engine, view, event, id);
            if (facade && at !== null) {
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
