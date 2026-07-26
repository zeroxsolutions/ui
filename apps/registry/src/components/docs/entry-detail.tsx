import { DocPage } from '@zeroxsolutions/ui/components/docs/doc-page';
import { Installation } from '@zeroxsolutions/ui/components/docs/installation';
import type { TocItem } from '@zeroxsolutions/ui/components/docs/on-this-page';
import { PreviewCode } from '@zeroxsolutions/ui/components/docs/preview-code';
import { Usage } from '@zeroxsolutions/ui/components/docs/usage';

import { CATALOG, type CatalogEntry } from './doc-catalog';

const TOC: TocItem[] = [
  { id: 'installation', title: 'Installation' },
  { id: 'usage', title: 'Usage' },
];

/**
 * A detail page (`/<kind>/<slug>`): the entry title + description, the iframe
 * PreviewCode, the Installation command, and the Usage snippets, inside the
 * `DocPage` shell with prev/next paging across the flat catalog.
 */
export function EntryDetail({ entry }: { entry: CatalogEntry }) {
  const index = CATALOG.findIndex((candidate) => candidate === entry);
  const prev = index > 0 ? CATALOG[index - 1] : undefined;
  const next = index < CATALOG.length - 1 ? CATALOG[index + 1] : undefined;

  return (
    <DocPage
      title={entry.title}
      description={entry.description}
      toc={TOC}
      prev={
        prev ? { href: `/${prev.kind}/${prev.slug}`, title: prev.title } : undefined
      }
      next={
        next ? { href: `/${next.kind}/${next.slug}`, title: next.title } : undefined
      }
    >
      <PreviewCode
        kind={entry.kind}
        slug={entry.slug}
        exampleName={entry.exampleName}
      />
      <Installation name={entry.itemName} />
      <Usage importSnippet={entry.importSnippet} exampleSnippet={`<${entry.title} />`} />
    </DocPage>
  );
}
