/**
 * The web docs sections the sidebar lists above the editor's, which registry-ui answers on the same host.
 * This zone may not import `@zeroxsolutions/ui-docs-web`, so they are written again here, in the order
 * its docs list them; a link to one is a plain anchor, since this app has no page at any of them.
 */
export const webDocsSections: { title: string; url: string }[] = [
  { title: 'Introduction', url: '/docs' },
  { title: 'Installation', url: '/docs/installation' },
  // The final addresses: `/docs/components` redirects to its default base, and `/docs/packages` has no page of
  // its own, so the section is listed by its one page.
  { title: 'Components', url: '/docs/components/base' },
  { title: 'Packages', url: '/docs/packages/icons' },
];
