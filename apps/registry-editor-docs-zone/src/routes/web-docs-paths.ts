/**
 * The web docs sections the sidebar lists above the editor's, which registry-ui answers on the same host.
 * This zone may not import `@zeroxsolutions/ui-docs-web`, so they are written again here, in the order
 * its docs list them; a link to one is a plain anchor, since this app has no page at any of them.
 */
export const webDocsSections: { title: string; url: string }[] = [
  { title: 'Introduction', url: '/docs' },
  { title: 'Installation', url: '/docs/installation' },
  { title: 'Components', url: '/docs/components' },
  { title: 'Blocks', url: '/docs/blocks' },
  { title: 'Packages', url: '/docs/packages' },
];
