'use client';

import { TreeItem } from '@zeroxsolutions/ui/components/tree-item';

import { ComponentPreview } from '@/components/component-preview';

/**
 * Isolated preview for `TreeItem` (composed with `TreeIndent`). `registry-e2e`
 * asserts each row carries `data-slot="tree-item"` and the inner skeleton
 * carries `data-slot="tree-indent"`, and that no console errors fire.
 */
export default function TreePreviewPage() {
  return (
    <main className="mx-auto max-w-3xl p-8">
      <h1 className="mb-6 text-lg font-semibold">TreeItem</h1>
      <ComponentPreview>
        <div className="flex w-full flex-col gap-1">
          <TreeItem
            depth={0}
            hasChildren
            expanded
            onToggleExpand={() => {}}
            name="src"
          />
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
      </ComponentPreview>
    </main>
  );
}
