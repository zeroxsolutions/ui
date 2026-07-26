"use client"

import { CodeBlock } from "@/components/code-block"

export interface UsageProps {
  /** Import snippet - the `import { X } from '@zeroxsolutions/ui/...'` line. */
  importSnippet: string
  /** Inline usage example - the JSX the consumer writes. */
  exampleSnippet: string
}

/**
 * The Usage section - the import snippet followed by an inline usage example,
 * each rendered as a copyable `CodeBlock`. `'use client'` because `CodeBlock`
 * runs its Shiki highlighter in an effect (the dist ships no directive of its
 * own, so the boundary rides on the importer).
 */
export function Usage({ importSnippet, exampleSnippet }: UsageProps) {
  return (
    <section id="usage" data-slot="usage" className="scroll-mt-20">
      <h2 className="mb-3 text-xl font-semibold tracking-tight">Usage</h2>
      <div className="flex flex-col gap-4">
        <CodeBlock code={importSnippet} language="ts" />
        <CodeBlock code={exampleSnippet} language="tsx" />
      </div>
    </section>
  )
}
