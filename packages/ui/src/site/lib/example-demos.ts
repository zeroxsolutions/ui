import { Index } from '../../../registry/bases/base-ui/examples/__index__';

/**
 * The demos one zone previews: the entries of the examples index whose files are all examples, as
 * opposed to the items themselves, in the editor set or outside it. Each has a page of its own that a
 * preview's full page button opens. It reads the index alone, so a server module may call it.
 */
export function exampleDemos({ editor }: { editor: boolean }): string[] {
  return Object.values(Index)
    .filter((entry) => entry.editor === editor && entry.files.every((file) => file.includes('/examples/')))
    .map((entry) => entry.name);
}
