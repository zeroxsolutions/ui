import {
  NodeViewContent,
  NodeViewWrapper,
  ReactNodeViewRenderer,
  type NodeViewProps as EngineNodeViewProps,
} from '@tiptap/react';
import type { ReactNode } from 'react';
import { facadeFor } from '@zeroxsolutions/editor-core/document/core/engine/facade-registry';
import type { EngineHandle } from '@zeroxsolutions/editor-core/document/core/engine/engine-handle';
import type {
  NodeSpec,
  NodeViewRenderer,
} from '@zeroxsolutions/editor-core/document/core/types/node-spec';
import type { NodeViewProps } from '@zeroxsolutions/editor-core/document/core/types/node-view';

/**
 * Wrap a feature's engine-free `render(props)` into an engine node-view
 * component. The engine's node-view props are translated into the engine-free
 * `NodeViewProps` (validated-at-boundary attrs, `updateAttrs`, selection, the
 * façade handle, a content slot) so the view never imports the engine. Relocated
 * from editor-core so core imports no `@tiptap/react`.
 */
export function buildNodeViewComponent(spec: NodeSpec): unknown {
  function EditorNodeView(engineProps: EngineNodeViewProps): ReactNode {
    const facade = facadeFor(engineProps.editor as unknown as EngineHandle);
    const props: NodeViewProps = {
      attrs: engineProps.node.attrs as Record<string, unknown>,
      updateAttrs: (patch) => engineProps.updateAttributes(patch),
      selected: engineProps.selected ?? false,
      editable: engineProps.editor.isEditable,
      editor: facade as NodeViewProps['editor'],
      deleteNode: () => engineProps.deleteNode(),
      children: spec.content ? <NodeViewContent /> : undefined,
    };
    return (
      <NodeViewWrapper
        as={spec.group === 'inline' ? 'span' : 'div'}
        data-type={spec.name}
      >
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
      opts.as === 'span'
        ? ({ as: 'span' } as Parameters<typeof ReactNodeViewRenderer>[1])
        : undefined,
    );
}
