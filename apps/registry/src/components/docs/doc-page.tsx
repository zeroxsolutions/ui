import type { ReactNode } from 'react';

import { DarkModeToggle } from './dark-mode-toggle';
import { DocTabs } from './doc-tabs';

export interface DocPageProps {
  /** The item title - rendered as the page `<h1>`. */
  title: string;
  /** One-line description under the title. */
  description: string;
  /** Live preview node - typically `<ComponentPreview>...</ComponentPreview>`. */
  preview: ReactNode;
  /** Code/Usage node - typically `<UsageCode>`. */
  code: ReactNode;
  /** Props node - typically `<PropsTable>`. */
  propsTable: ReactNode;
  /** Composition node - typically `<CompositionTree>`. */
  composition: ReactNode;
}

/**
 * The shared doc-page shell every documented item composes (Decision 2). The
 * header carries the title + description + the dark-mode toggle; the body is
 * the Preview / Code / Props / Composition `DocTabs`. Each item page supplies
 * its own content; this shell stays layout-only.
 */
export function DocPage({
  title,
  description,
  preview,
  code,
  propsTable,
  composition,
}: DocPageProps) {
  return (
    <main
      data-slot="doc-page"
      className="mx-auto max-w-5xl p-8"
    >
      <header className="mb-6 flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold">{title}</h1>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        <DarkModeToggle />
      </header>
      <DocTabs
        preview={preview}
        code={code}
        propsTable={propsTable}
        composition={composition}
      />
    </main>
  );
}
