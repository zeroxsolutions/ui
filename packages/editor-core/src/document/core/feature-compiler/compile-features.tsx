import {
  Extension,
  InputRule,
  Mark,
  Node,
  markInputRule,
  mergeAttributes,
  nodeInputRule,
} from '@tiptap/core';
import type { Plugin } from '@tiptap/pm/state';
import { facadeFor } from '../engine/facade-registry.js';
import type {
  EngineExtensions,
  EngineHandle,
} from '../engine/engine-handle.js';
import type { EditorFeature } from '../types/feature.js';
import type {
  InputRuleSpec,
  MarkSpec,
  NodeSpec,
  NodeViewRenderer,
} from '../types/node-spec.js';
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
const makeDoc = (topContent: string): Node =>
  Node.create({ name: 'doc', topNode: true, content: topContent });

const Paragraph = Node.create({
  name: 'paragraph',
  group: 'block',
  content: 'inline*',
  parseHTML: () => [{ tag: 'p' }],
  renderHTML: ({ HTMLAttributes }) => ['p', mergeAttributes(HTMLAttributes), 0],
});

const Text = Node.create({ name: 'text', group: 'inline' });

function compileNode(spec: NodeSpec, renderer?: NodeViewRenderer): Node {
  const tag = spec.htmlTag ?? 'div';
  return Node.create({
    name: spec.name,
    group: spec.group,
    content: spec.content,
    inline: spec.group === 'inline',
    atom: spec.atom,
    selectable: spec.selectable,
    draggable: spec.draggable,
    defining: spec.defining,
    addAttributes: () => deriveAttributes(spec.attrs),
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
      mergeAttributes(
        spec.className ? { class: spec.className } : {},
        HTMLAttributes,
      ),
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
  const getAttributes = rule.getAttrs
    ? (match: RegExpMatchArray) => rule.getAttrs?.(match) ?? undefined
    : undefined;

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

function compileBehavior(features: EditorFeature[]): Extension {
  const inputRules = features.flatMap((feature) => feature.inputRules ?? []);
  const shortcuts: Record<string, string> = {};
  for (const feature of features)
    Object.assign(shortcuts, feature.shortcuts ?? {});

  return Extension.create({
    name: 'zeroxEditorBehavior',
    addInputRules() {
      return inputRules.map((rule) => buildInputRule(rule, this.editor));
    },
    addKeyboardShortcuts() {
      const handlers: Record<string, () => boolean> = {};
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

export function compileFeatures(
  features: EditorFeature[],
  options: CompileOptions = {},
): EngineExtensions {
  const extensions: (Node | Mark | Extension)[] = [
    makeDoc(options.topContent ?? 'block+'),
    Paragraph,
    Text,
  ];
  for (const feature of features) {
    for (const node of feature.nodes ?? [])
      extensions.push(compileNode(node, options.nodeViewRenderer));
    for (const mark of feature.marks ?? []) extensions.push(compileMark(mark));
    compileAdvanced(feature, extensions);
  }
  extensions.push(compileBehavior(features));
  return extensions as unknown as EngineExtensions;
}

/**
 * The single engine escape (task 3.5). Raw engine extensions are spliced in
 * directly; raw ProseMirror plugins are wrapped in a per-feature extension. Only
 * `advanced` exposes engine primitives — the declarative path stays engine-free.
 */
function compileAdvanced(
  feature: EditorFeature,
  extensions: (Node | Mark | Extension)[],
): void {
  const advanced = feature.advanced;
  if (!advanced) return;
  if (advanced.engineExtensions?.length) {
    extensions.push(
      ...(advanced.engineExtensions as (Node | Mark | Extension)[]),
    );
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
