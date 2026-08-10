"use client"

import { TreeItem } from "@/registry/bases/base-ui/components/tree-item"

/** A small hierarchy - the TreeItem hero. */
export function TreeHero() {
  return (
    <div className="flex w-full flex-col gap-1">
      <TreeItem depth={0} hasChildren expanded onToggleExpand={() => {}} name="src" />
      <TreeItem
        depth={1}
        hasChildren={false}
        expanded={false}
        onToggleExpand={() => {}}
        name="index.ts"
      />
      <TreeItem
        depth={1}
        hasChildren={false}
        expanded={false}
        onToggleExpand={() => {}}
        name="page.tsx"
      />
    </div>
  )
}
