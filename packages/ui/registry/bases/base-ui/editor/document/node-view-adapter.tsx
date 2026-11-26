import {
  NodeViewContent,
  NodeViewWrapper,
  ReactNodeViewRenderer,
  type NodeViewProps as EngineNodeViewProps,
} from '@tiptap/react';
import { useCallback, useSyncExternalStore, type ReactNode } from 'react';
import { facadeFor } from '@zeroxsolutions/editor-core/document/advanced';
import type { EngineHandle } from '@zeroxsolutions/editor-core/document/advanced';
import type { NodeSpec, NodeViewRenderer, NodeViewProps } from '@zeroxsolutions/editor-core/document/core/index';

/**
 * Wrap a feature's engine-free `render(props)` into an engine node-view
 * component. The engine's node-view props are translated into the engine-free
 * `NodeViewProps` (validated-at-boundary attrs, `updateAttrs`, selection, the
 * façade handle, a content slot) so the view never imports the engine. Relocated
 * from editor-core so core imports no `@tiptap/react`.
 */
export function buildNodeViewComponent(spec: NodeSpec): unknown {
  function EditorNodeView(engineProps: EngineNodeViewProps): ReactNode {
    const engine = engineProps.editor;
    const facade = facadeFor(engine as unknown as EngineHandle);
    // The engine draws a node view again only when its node changes; `setEditable` emits `update` instead.
    const subscribe = useCallback(
      (listener: () => void) => {
        engine.on('update', listener);
        return () => {
          engine.off('update', listener);
        };
      },
      [engine],
    );
    const editable = useSyncExternalStore(
      subscribe,
      () => engine.isEditable,
      () => engine.isEditable,
    );
    const props: NodeViewProps = {
      attrs: engineProps.node.attrs as Record<string, unknown>,
      updateAttrs: (patch) => engineProps.updateAttributes(patch),
      selected: engineProps.selected ?? false,
      editable,
      editor: facade as NodeViewProps['editor'],
      deleteNode: () => engineProps.deleteNode(),
      getPos: () => engineProps.getPos(),
      children: spec.content ? <NodeViewContent /> : undefined,
    };
    return (
      <NodeViewWrapper as={spec.group === 'inline' ? 'span' : 'div'} data-type={spec.name}>
        {spec.render?.(props) as ReactNode}
      </NodeViewWrapper>
    );
  }
  return EditorNodeView;
}

/**
 * The chrome's `NodeViewRenderer` implementation: wraps a feature's React view
 * in Tiptap's `ReactNodeViewRenderer` + the `NodeViewWrapper` host, honoring the
 * inline-`<span>` override. Inject this into `createDocumentEditor` /
 * `EditorBuilder` so editor-core stays free of `@tiptap/react`.
 */
export function createNodeViewRenderer(): NodeViewRenderer {
  return (spec, opts) =>
    ReactNodeViewRenderer(
      buildNodeViewComponent(spec) as Parameters<typeof ReactNodeViewRenderer>[0],
      {
        ...(opts.as === 'span' ? { as: 'span' } : {}),
        attrs: dataAttributes,
      } as Parameters<typeof ReactNodeViewRenderer>[1],
    );
}

/**
 * The node's `data-*` HTML attributes, which a React node view's host otherwise never carries, so one a feature
 * adds to another's node (a profile's `data-align`) reaches the styles. The node's own attributes are left off
 * the host: one can hold a whole block's text, such as a code block's.
 */
function dataAttributes({ HTMLAttributes }: { HTMLAttributes: Record<string, unknown> }): Record<string, string> {
  return Object.fromEntries(
    Object.entries(HTMLAttributes)
      .filter(([name, value]) => name.startsWith('data-') && value != null)
      .map(([name, value]) => [name, String(value)]),
  );
}
