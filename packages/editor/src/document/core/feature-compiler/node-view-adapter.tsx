import {
  NodeViewContent,
  NodeViewWrapper,
  type NodeViewProps as EngineNodeViewProps,
} from '@tiptap/react';
import type { ReactNode } from 'react';
import { facadeFor } from '../engine/facade-registry.js';
import type { EngineHandle } from '../engine/engine-handle.js';
import type { NodeSpec } from '../types/node-spec.js';
import type { NodeViewProps } from '../types/node-view.js';

/**
 * Wrap a feature's engine-free `render(props)` into an engine node-view
 * component (task 3.3). The engine's node-view props are translated into our
 * `NodeViewProps` — validated-at-boundary attrs, `updateAttrs`, selection, the
 * façade handle, and a content slot — so the view never imports the engine.
 *
 * The return type is `unknown`: the concrete component type is a `@tiptap/react`
 * type that must not leak into any `.d.ts`. The compiler hands the result
 * straight to `ReactNodeViewRenderer`.
 */
export function buildNodeViewComponent(spec: NodeSpec): unknown {
  function EditorNodeView(engineProps: EngineNodeViewProps): ReactNode {
    const facade = facadeFor(engineProps.editor as unknown as EngineHandle);
    const props: NodeViewProps = {
      // Attributes entered the document already validated at their boundary
      // (import/consumer API); the hot render path trusts them (design D6).
      attrs: engineProps.node.attrs as Record<string, unknown>,
      updateAttrs: (patch) => engineProps.updateAttributes(patch),
      selected: engineProps.selected ?? false,
      editable: engineProps.editor.isEditable,
      editor: facade as NodeViewProps['editor'],
      deleteNode: () => engineProps.deleteNode(),
      children: spec.content ? <NodeViewContent /> : undefined,
    };
    // An inline node (a mention atom) must render inline; the default wrapper is
    // a block <div>, which breaks the paragraph line before and after the pill.
    return (
      <NodeViewWrapper
        as={spec.group === 'inline' ? 'span' : 'div'}
        data-type={spec.name}
      >
        {spec.render?.(props)}
      </NodeViewWrapper>
    );
  }
  return EditorNodeView;
}
