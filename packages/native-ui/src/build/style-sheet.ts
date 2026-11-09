/**
 * The module ids of `style`'s sheets, upstream's and then zui's own, whose slots together are every slot
 * an item may write in that style. The caller resolves them, from Node's module system or Jest's.
 */
export function styleSheetIds(style: string): readonly string[] {
  return [
    `@zeroxsolutions/shadcn-upstream/snapshot/style-${style}.css`,
    `@zeroxsolutions/ui/registry/styles/style-${style}.css`,
  ];
}
