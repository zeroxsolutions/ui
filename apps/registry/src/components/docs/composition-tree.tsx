import { Badge } from '@zeroxsolutions/ui/components/ui/badge';

export interface CompositionNode {
  name: string;
  /** Slot/role the node fills inside its parent (e.g. `Root`, `Trigger`). */
  slot?: string;
  /** Parts composed under this node; a leaf node has none. */
  children?: CompositionNode[];
}

export interface CompositionTreeProps {
  tree: CompositionNode;
}

/**
 * Renders the April-2026 shadcn composition shape - a `Parent -> Part` tree -
 * from an authored `CompositionNode`. A leaf item renders as a single line;
 * compound components walk the children indented under their parent.
 */
export function CompositionTree({ tree }: CompositionTreeProps) {
  return (
    <div data-slot="composition-tree" className="text-sm">
      <CompositionNodeRow node={tree} depth={0} />
    </div>
  );
}

function CompositionNodeRow({
  node,
  depth,
}: {
  node: CompositionNode;
  depth: number;
}) {
  const children = node.children ?? [];
  return (
    <div
      data-slot="composition-node"
      className="flex flex-col gap-1.5"
      style={{ paddingLeft: depth * 20 }}
    >
      <div className="flex items-center gap-2">
        <span className="font-mono text-sm">{node.name}</span>
        {node.slot ? <Badge variant="secondary">{node.slot}</Badge> : null}
      </div>
      {children.map((child) => (
        <CompositionNodeRow key={child.name} node={child} depth={depth + 1} />
      ))}
    </div>
  );
}
