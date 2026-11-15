import { publishedItems } from '@zeroxsolutions/ui-docs-web/lib/published-items';

import { withEditorSection } from '@/lib/editor-nav';
import { source } from '@/lib/source';

/**
 * The docs' page tree as every surface shows it: the written pages, and the editor section of links into
 * the editor zone. The sidebar, the phone menu and the search's page list read this one tree.
 */
export const docsTree = withEditorSection(source.pageTree, publishedItems);
