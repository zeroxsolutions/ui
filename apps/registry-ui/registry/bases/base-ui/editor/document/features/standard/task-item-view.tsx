'use client';

import type { ReactElement } from 'react';
import { NodeViewContent, NodeViewWrapper } from '@tiptap/react';
import { Checkbox } from '@/registry/bases/base-ui/ui/checkbox';

/**
 * React node view for a task-list item so its checkbox is the house design
 * system's `Checkbox` (Base UI) instead of a bare `<input>` (see
 * `ui-from-design-system`). `NodeViewWrapper`/`NodeViewContent` are imported as
 * values (used only in the body), and the props are typed **locally** to just
 * the two node-view fields this view reads — so nothing from the hidden engine
 * reaches this file's emitted `.d.ts` (the engine-free build guard). The
 * renderer is wired with a cast in `standard-kit.ts`.
 */
interface TaskItemViewProps {
  node: { attrs: { checked: boolean } };
  updateAttributes: (attrs: { checked: boolean }) => void;
  editor: { isEditable: boolean };
}

export function TaskItemView({ node, updateAttributes, editor }: TaskItemViewProps): ReactElement {
  const checked = node.attrs.checked;
  return (
    <NodeViewWrapper as="li" data-type="taskItem" data-checked={checked}>
      <label contentEditable={false}>
        <Checkbox
          checked={checked}
          onCheckedChange={(value) => updateAttributes({ checked: value === true })}
          disabled={!editor.isEditable}
        />
      </label>
      <NodeViewContent as="div" />
    </NodeViewWrapper>
  );
}
