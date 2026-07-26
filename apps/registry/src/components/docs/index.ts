// Doc primitives live in the SDK (packages/ui/src/components/docs). The package
// exports map is file-per-subpath, so each is re-exported by its explicit
// subpath; the preview pages keep a single `@/components/docs` import.
export { DocPage } from '@zeroxsolutions/ui/components/docs/doc-page';
export type { DocPageProps, DocNavLink } from '@zeroxsolutions/ui/components/docs/doc-page';
export { Installation } from '@zeroxsolutions/ui/components/docs/installation';
export type { InstallationProps } from '@zeroxsolutions/ui/components/docs/installation';
export { OnThisPage } from '@zeroxsolutions/ui/components/docs/on-this-page';
export type { TocItem, OnThisPageProps } from '@zeroxsolutions/ui/components/docs/on-this-page';
export { PreviewCode } from '@zeroxsolutions/ui/components/docs/preview-code';
export type { PreviewCodeProps } from '@zeroxsolutions/ui/components/docs/preview-code';
export { Usage } from '@zeroxsolutions/ui/components/docs/usage';
export type { UsageProps } from '@zeroxsolutions/ui/components/docs/usage';

// App-local chrome + catalog.
export { SiteHeader } from './site-header';
export { DarkModeToggle } from './dark-mode-toggle';
export { AnimatedBackdrop } from './animated-backdrop';
export { SectionList } from './section-list';
export { EntryDetail } from './entry-detail';
export {
  CATALOG,
  CATALOG_KINDS,
  KIND_META,
  entriesByKind,
  findEntry,
  previewParams,
} from './doc-catalog';
export type { CatalogEntry, CatalogKind } from './doc-catalog';
