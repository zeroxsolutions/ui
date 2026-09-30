import { flattenTree, type Item, type Node, type Root } from 'fumadocs-core/page-tree';
import type { ReactNode } from 'react';

/** A run of pages under one label, as the docs navigation lists them. */
export interface PageTreeGroup {
  /** The separator's or the folder's name; none for pages the tree lists before either. */
  name?: ReactNode;
  pages: Item[];
}

/**
 * The tree's pages in the groups its `meta.json` files declare, in tree order. A separator opens a
 * group under its name; a folder is a group of its own pages, its index page first, followed by the
 * groups of the folders inside it. A folder's index page sits among its children only where the
 * folder's `meta.json` names `"index"`; otherwise, as with a `"..."` rest entry, fumadocs keeps it apart
 * as the folder's `index`, and it is put first here. A folder's index page is left out of its group
 * where that page's own name repeats the folder's and another page follows it in the group - a reader
 * already has the folder's name from the heading above it. Where it is the group's only page it stays,
 * or the group, its heading and the only link to the page would go. A group with no page is dropped.
 */
export function pageTreeGroups(tree: Root): PageTreeGroup[] {
  const groups: PageTreeGroup[] = [];

  function collect(nodes: Node[], name?: ReactNode): void {
    let group: PageTreeGroup = { name, pages: [] };
    groups.push(group);
    let leading = true;
    let repeated: Item | undefined;
    for (const node of nodes) {
      if (node.type === 'page') {
        if (leading && node.name === name) repeated = node;
        else group.pages.push(node);
        leading = false;
        continue;
      }
      leading = false;
      if (repeated && group.pages.length === 0) group.pages.push(repeated);
      repeated = undefined;
      if (node.type === 'folder') {
        const { index, children } = node;
        collect(index && !children.includes(index) ? [index, ...children] : children, node.name);
      }
      group = { name: node.type === 'separator' ? node.name : undefined, pages: [] };
      groups.push(group);
    }
    if (repeated && group.pages.length === 0) group.pages.push(repeated);
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

/**
 * The pages before and after `url` in the tree's reading order, stepping over a link to another site:
 * fumadocs' `findNeighbour` counts a `meta.json` link to another site as a page.
 */
export function pageNeighbours(tree: Root, url: string): { previous?: Item; next?: Item } {
  const pages = flattenTree(tree.children).filter((page) => !isExternal(page));
  const index = pages.findIndex((page) => page.url === url);
  if (index === -1) return {};
  return { previous: pages[index - 1], next: pages[index + 1] };
}
