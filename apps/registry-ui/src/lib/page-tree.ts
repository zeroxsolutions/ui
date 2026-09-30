import type { Item, Node, Root } from 'fumadocs-core/page-tree';
import type { ReactNode } from 'react';

/** A run of pages under one label, as the docs navigation lists them. */
export interface PageTreeGroup {
  /** The separator's or the folder's name; none for pages the tree lists before either. */
  name?: ReactNode;
  pages: Item[];
}

/**
 * The tree's pages in the groups its `meta.json` files declare, in tree order. A separator opens a
 * group under its name; a folder is a group of its index page and its own pages, followed by the
 * groups of the folders inside it. A group with no page is dropped.
 */
export function pageTreeGroups(tree: Root): PageTreeGroup[] {
  const groups: PageTreeGroup[] = [];

  function collect(nodes: Node[], name?: ReactNode, index?: Item): void {
    let group: PageTreeGroup = { name, pages: index ? [index] : [] };
    groups.push(group);
    for (const node of nodes) {
      if (node.type === 'page') {
        group.pages.push(node);
        continue;
      }
      if (node.type === 'folder') collect(node.children, node.name, node.index);
      group = { name: node.type === 'separator' ? node.name : undefined, pages: [] };
      groups.push(group);
    }
  }

  collect(tree.children);
  return groups.filter((group) => group.pages.length > 0);
}

/**
 * Whether a page in the tree leaves the site: a `meta.json` link to another origin. Unmarked, it is
 * read off the URL as fumadocs' own link does, by a scheme or a leading `//`.
 */
export function isExternal(page: Item): boolean {
  return page.external ?? /^(\w+:|\/\/)/.test(page.url);
}
