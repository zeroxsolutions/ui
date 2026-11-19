/** The shadcn CLI command that adds the registry item `item` through an app's `@zui` registry entry. */
export function installLine(item: string): string {
  return `pnpm dlx shadcn@latest add @zui/${item}`;
}
