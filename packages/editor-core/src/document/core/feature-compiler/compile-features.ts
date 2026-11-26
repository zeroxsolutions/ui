import {
  callOrReturn,
  Extension,
  flattenExtensions,
  getExtensionField,
  InputRule,
  Mark,
  Node,
  markInputRule,
  mergeAttributes,
  nodeInputRule,
  type AnyExtension,
  type Editor,
} from '@tiptap/core';
import type { Plugin } from '@tiptap/pm/state';
import type { EditorView } from '@tiptap/pm/view';
import { facadeFor } from '../engine/facade-registry.js';
import type { EngineExtensions, EngineHandle } from '../engine/engine-handle.js';
import type { EditorFeature } from '../types/feature.js';
import type { InputRuleSpec, MarkSpec, NodeSpec, NodeViewRenderer } from '../types/node-spec.js';
import { deriveAttributes } from './derive-attributes.js';

/**
 * The feature compiler (task 3.2): translate declarative `EditorFeature`s into
 * engine extensions — nodes, marks, input rules, keyboard shortcuts, and React
 * node views — entirely inside `core/`. Its only exported function returns the
 * opaque `EngineExtensions`, so no engine type reaches a public `.d.ts`.
 *
 * The minimal substrate (`doc`/`paragraph`/`text`) is defined here so an editor
 * always has a working schema; every other block/mark comes from a feature.
 *
 * The top node's `content` is parameterized (default `block+`) so a compact
 * surface — the chat composer — can constrain the document to a **single
 * textblock** (`paragraph`) at the schema level, making a second block
 * structurally impossible (ProseMirror's `splitBlock` no-ops) rather than
 * suppressed by behavior. The default keeps the block document unchanged.
 */

/** The top node, built per compile so its content expression is configurable. */
const makeDoc = (topContent: string): Node => Node.create({ name: 'doc', topNode: true, content: topContent });

const Paragraph = Node.create({
  name: 'paragraph',
  group: 'block',
  content: 'inline*',
  parseHTML: () => [{ tag: 'p' }],
  renderHTML: ({ HTMLAttributes }) => ['p', mergeAttributes(HTMLAttributes), 0],
});

const Text = Node.create({ name: 'text', group: 'inline' });

/**
 * The group a content expression may name for every block node of the editor but the section: what a section and a
 * lane hold, so neither holds a section. No feature can add a group to another feature's node, since a node's own
 * `group` replaces what another extension adds to its schema, so the compiler spells the group out by name.
 */
const SECTION_BLOCK = /\bsectionBlock\b/g;
/** The `block` group in a content expression, which an editor holding a section reads as `sectionBlock` below the top. */
const BLOCK_GROUP = /\bblock\b/g;
/** The section's node name, which `sectionBlock` leaves out. */
const SECTION_NODE = 'section';

function groupsOf(extension: AnyExtension, editor: Editor): string[] {
  const context = { name: extension.name, options: extension.options, storage: extension.storage, editor };
  const group = callOrReturn(getExtensionField<string | (() => string)>(extension, 'group', context));
  return typeof group === 'string' ? group.split(/\s+/) : [];
}

/**
 * `content` with `sectionBlock` spelled as the editor's block nodes but the section, read when the schema is built;
 * a schema built with no editor reads it as `block`.
 */
function contentOf(content: string | undefined): string | undefined | ((this: { editor?: Editor }) => string) {
  if (content === undefined || !content.match(SECTION_BLOCK)) return content;
  return function sectionContent(this: { editor?: Editor }): string {
    const editor = this.editor;
    if (!editor) return content.replace(SECTION_BLOCK, 'block');
    const names = new Set(
      flattenExtensions(editor.options.extensions)
        .filter((extension) => extension.type === 'node' && extension.name !== SECTION_NODE)
        .filter((extension) => groupsOf(extension, editor).includes('block'))
        .map((extension) => extension.name),
    );
    return content.replace(SECTION_BLOCK, `(${[...names].join(' | ')})`);
  };
}

/**
 * `extension`, and the extensions it adds, with every node but the top one and the section holding `sectionBlock`
 * where its content names `block`: a section sits only at the top of the document, never in a callout, a quote, a
 * list item, a table cell or a toggle, whatever feature declared them. The schema then refuses a nested section on
 * load, and a paste or a drop places one at the top.
 */
function keepSectionsAtTop(extension: AnyExtension): AnyExtension {
  if (extension.type === 'node') {
    if (extension.name === SECTION_NODE || getExtensionField(extension, 'topNode') === true) return extension;
    return (extension as Node).extend({
      content() {
        const own = callOrReturn(this.parent);
        if (typeof own !== 'string' || !own.match(BLOCK_GROUP)) return own;
        const below = contentOf(own.replace(BLOCK_GROUP, 'sectionBlock'));
        return typeof below === 'function' ? below.call(this) : below;
      },
    });
  }
  if (getExtensionField(extension, 'addExtensions') === undefined) return extension;
  return (extension as Extension).extend({
    addExtensions() {
      return (this.parent?.() ?? []).map(keepSectionsAtTop);
    },
  });
}

function compileNode(spec: NodeSpec, renderer?: NodeViewRenderer): Node {
  const tag = spec.htmlTag ?? 'div';
  return Node.create({
    name: spec.name,
    group: spec.group,
    content: contentOf(spec.content),
    marks: spec.marks,
    inline: spec.group === 'inline',
    atom: spec.atom,
    selectable: spec.selectable,
    draggable: spec.draggable,
    defining: spec.defining,
    // Carried onto the schema's own spec, so `node.type.spec.container` reads it without a name list.
    extendNodeSchema: (extension) => (extension.name === spec.name && spec.container ? { container: true } : {}),
    addAttributes: () => deriveAttributes(spec.attrs),
    renderText: spec.text ? ({ node }) => spec.text?.(node.attrs) ?? '' : undefined,
    parseHTML: () => [{ tag: spec.htmlTag ?? `[data-type="${spec.name}"]` }],
    renderHTML: ({ HTMLAttributes }) => {
      const attrs = mergeAttributes({ 'data-type': spec.name }, HTMLAttributes);
      return spec.content ? [tag, attrs, 0] : [tag, attrs];
    },
    // The React node-view renderer is injected by the chrome (core imports no
    // `@tiptap/react`). An inline node (mention) needs a <span> host so the pill
    // stays in the inline flow instead of forcing a line break around it.
    addNodeView:
      spec.render && renderer
        ? () =>
            renderer(spec, {
              as: spec.group === 'inline' ? 'span' : 'div',
            }) as never
        : undefined,
  });
}

function compileMark(spec: MarkSpec): Mark {
  return Mark.create({
    name: spec.name,
    inclusive: spec.inclusive,
    excludes: spec.excludes?.join(' '),
    addAttributes: () => deriveAttributes(spec.attrs),
    parseHTML: () => [{ tag: spec.htmlTag ?? `[data-mark="${spec.name}"]` }],
    renderHTML: ({ HTMLAttributes }) => [
      spec.htmlTag ?? 'span',
      mergeAttributes(spec.className ? { class: spec.className } : {}, HTMLAttributes),
      0,
    ],
  });
}

function buildInputRule(rule: InputRuleSpec, editor: unknown): InputRule {
  const schema = (
    editor as {
      schema: {
        nodes: Record<string, unknown>;
        marks: Record<string, unknown>;
      };
    }
  ).schema;
  const getAttributes = rule.getAttrs ? (match: RegExpMatchArray) => rule.getAttrs?.(match) ?? undefined : undefined;

  if (rule.kind === 'command') {
    return new InputRule({
      find: rule.find,
      handler: ({ match }) => {
        const facade = facadeFor(editor as EngineHandle);
        facade?.run(rule.target, rule.getAttrs?.(match) ?? undefined);
      },
    });
  }
  if (rule.kind === 'node') {
    return nodeInputRule({
      find: rule.find,
      type: schema.nodes[rule.target] as never,
      getAttributes,
    });
  }
  return markInputRule({
    find: rule.find,
    type: schema.marks[rule.target] as never,
    getAttributes,
  });
}

/**
 * Moves the caret to the start or the end of its line as drawn, or with `extend` moves the selection's head
 * there. ProseMirror leaves Home and End to the browser, and Chrome and Safari on macOS read them as keys that
 * scroll the nearest scroller, which on a page is the whole page, without moving the caret. The browser's own
 * line motion keeps a wrapped line and a chip at its edge as the reader sees them; the editor reads the moved
 * selection back as it does any other.
 */
function toLineBoundary(view: EditorView, direction: 'backward' | 'forward', extend: boolean): boolean {
  const selection = (view.root as Document).getSelection?.();
  if (!selection || selection.rangeCount === 0 || !view.hasFocus()) return false;
  selection.modify(extend ? 'extend' : 'move', direction, 'lineboundary');
  return true;
}

function compileBehavior(features: EditorFeature[]): Extension {
  const inputRules = features.flatMap((feature) => feature.inputRules ?? []);
  const shortcuts: Record<string, string> = {};
  for (const feature of features) Object.assign(shortcuts, feature.shortcuts ?? {});

  return Extension.create({
    name: 'zeroxEditorBehavior',
    addInputRules() {
      return inputRules.map((rule) => buildInputRule(rule, this.editor));
    },
    addKeyboardShortcuts() {
      // First, so a feature's own binding for one of these keys wins.
      const view = () => this.editor.view;
      const handlers: Record<string, () => boolean> = {
        Home: () => toLineBoundary(view(), 'backward', false),
        End: () => toLineBoundary(view(), 'forward', false),
        'Shift-Home': () => toLineBoundary(view(), 'backward', true),
        'Shift-End': () => toLineBoundary(view(), 'forward', true),
      };
      for (const [combo, command] of Object.entries(shortcuts)) {
        handlers[combo] = () => {
          const facade = facadeFor(this.editor as unknown as EngineHandle);
          return facade ? facade.run(command) : false;
        };
      }
      return handlers;
    },
  });
}

/** Options for the feature compiler. */
export interface CompileOptions {
  /** The top node's ProseMirror content expression. Defaults to `block+`; a
   *  compact surface passes `paragraph` for a single-textblock schema. */
  topContent?: string;
  /** React node-view renderer injected by the chrome. Omit for a headless build
   *  whose nodes have no React views (core then imports no `@tiptap/react`). */
  nodeViewRenderer?: NodeViewRenderer;
}

export function compileFeatures(features: EditorFeature[], options: CompileOptions = {}): EngineExtensions {
  const extensions: (Node | Mark | Extension)[] = [makeDoc(options.topContent ?? 'block+'), Paragraph, Text];
  for (const feature of features) {
    for (const node of feature.nodes ?? []) extensions.push(compileNode(node, options.nodeViewRenderer));
    for (const mark of feature.marks ?? []) extensions.push(compileMark(mark));
    compileAdvanced(feature, extensions);
  }
  extensions.push(compileBehavior(features));
  const holdsSection = features.some((feature) => feature.nodes?.some((node) => node.name === SECTION_NODE));
  return (holdsSection ? extensions.map(keepSectionsAtTop) : extensions) as unknown as EngineExtensions;
}

/**
 * The single engine escape (task 3.5). Raw engine extensions are spliced in
 * directly; raw ProseMirror plugins are wrapped in a per-feature extension. Only
 * `advanced` exposes engine primitives — the declarative path stays engine-free.
 */
function compileAdvanced(feature: EditorFeature, extensions: (Node | Mark | Extension)[]): void {
  const advanced = feature.advanced;
  if (!advanced) return;
  if (advanced.engineExtensions?.length) {
    extensions.push(...(advanced.engineExtensions as (Node | Mark | Extension)[]));
  }
  if (advanced.prosePlugins?.length) {
    const plugins = advanced.prosePlugins as Plugin[];
    extensions.push(
      Extension.create({
        name: `zeroxAdvanced_${feature.id}`,
        addProseMirrorPlugins: () => plugins,
      }),
    );
  }
}
