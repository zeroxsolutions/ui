import type { NodeSpec, NodeViewProps } from '@zeroxsolutions/editor-core/document/core/index';
import { emailSpec } from './block-style';

/** A stored block of a type no feature reads, kept as it came so the export writes it back unchanged. */
function EmailUnknownView({ attrs }: NodeViewProps<{ block?: { type?: unknown } | null }>) {
  const type = typeof attrs.block?.type === 'string' ? attrs.block.type : 'unknown';
  return (
    <div
      data-slot="email-unknown"
      contentEditable={false}
      className="cn-editor-block text-muted-foreground mb-4 border border-dashed p-3 text-sm"
    >
      A {type} block this editor cannot show
    </div>
  );
}

export function emailUnknownNode(): NodeSpec {
  return { ...emailSpec('emailUnknown'), render: EmailUnknownView };
}
