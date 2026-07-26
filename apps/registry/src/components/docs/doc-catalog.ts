import type { ComponentType } from 'react';

import { AiProviderPickerHero } from '@zeroxsolutions/ui/examples/ai-provider-picker-hero';
import { ChatMessageHero } from '@zeroxsolutions/ui/examples/chat-message-hero';
import { DemoPageHero } from '@zeroxsolutions/ui/examples/demo-page-hero';
import { FieldGroupHero } from '@zeroxsolutions/ui/examples/field-group-hero';
import { MenuButtonHero } from '@zeroxsolutions/ui/examples/menu-button-hero';
import { SplitButtonHero } from '@zeroxsolutions/ui/examples/split-button-hero';
import { TreeHero } from '@zeroxsolutions/ui/examples/tree-hero';

/**
 * The docs catalog - the single source for the section list pages, the detail
 * pages, the standalone preview route, and `generateStaticParams`. `kind` is the
 * URL segment (`components` / `blocks` / `pages`), so a section route is
 * `/<kind>` and a standalone preview is `/preview/<kind>/<slug>`.
 *
 * shadcn primitives are NOT documented here - only the registry's own composed
 * components, blocks, and pages. (Primitives stay installable in `registry.json`
 * as dependencies; they just have no doc page.)
 */
export type CatalogKind = 'components' | 'blocks' | 'pages';

export interface CatalogEntry {
  kind: CatalogKind;
  slug: string;
  title: string;
  description: string;
  /** Registry item name - the `<name>` in `/r/<name>.json` (Installation). */
  itemName: string;
  /** Registry example name - the Code tab fetches `/r/<exampleName>.json`. */
  exampleName: string;
  /** The example component, rendered live by the standalone preview route. */
  Example: ComponentType;
  /** Import snippet for the Usage section. */
  importSnippet: string;
}

export const KIND_META: Record<CatalogKind, { label: string; blurb: string }> = {
  components: {
    label: 'Components',
    blurb: 'Composed controls built on the shadcn primitives.',
  },
  blocks: {
    label: 'Blocks',
    blurb: 'Larger reusable surfaces composed from components.',
  },
  pages: {
    label: 'Pages',
    blurb: 'Full interface regions assembled from blocks and components.',
  },
};

export const CATALOG: CatalogEntry[] = [
  {
    kind: 'components',
    slug: 'split-button',
    title: 'SplitButton',
    description:
      'A single divided control - a primary action segment plus a caret that opens a menu of related variants. Composes ButtonGroup for the seamed outline.',
    itemName: 'split-button',
    exampleName: 'split-button-hero',
    Example: SplitButtonHero,
    importSnippet: `import {
  SplitButton,
  SplitButtonAction,
  SplitButtonContent,
  SplitButtonItem,
  SplitButtonMenu,
  SplitButtonTrigger,
} from '@zeroxsolutions/ui/components/split-button';`,
  },
  {
    kind: 'components',
    slug: 'menu-button',
    title: 'MenuButton',
    description:
      'A remembered-default split control - the primary repeats the currently-selected action and the caret opens a menu that changes which action is current. Composes ButtonGroup for the seamed outline.',
    itemName: 'menu-button',
    exampleName: 'menu-button-hero',
    Example: MenuButtonHero,
    importSnippet: `import {
  MenuButton,
  MenuButtonAction,
  MenuButtonContent,
  MenuButtonMenu,
  MenuButtonRadioGroup,
  MenuButtonRadioItem,
  MenuButtonTrigger,
} from '@zeroxsolutions/ui/components/menu-button';`,
  },
  {
    kind: 'components',
    slug: 'field-group',
    title: 'FieldGroup',
    description:
      'A field grid plus a fixed trailing action slot. Use it for any property row that mixes inputs with a side action - the slot is always reserved at one icon-button width so every row shares the same right edge.',
    itemName: 'field-group',
    exampleName: 'field-group-hero',
    Example: FieldGroupHero,
    importSnippet: `import { FieldGroup } from '@zeroxsolutions/ui/components/layouts/field-group';`,
  },
  {
    kind: 'components',
    slug: 'chat-message',
    title: 'ChatMessage',
    description:
      'The wrapper for one chat message row - agnostic to how the body is rendered. User messages pin right as a bubble; assistant messages lay out as full-width prose with an optional agent identity row.',
    itemName: 'chat-message',
    exampleName: 'chat-message-hero',
    Example: ChatMessageHero,
    importSnippet: `import { ChatMessage } from '@zeroxsolutions/ui/components/chat/chat-message';`,
  },
  {
    kind: 'components',
    slug: 'tree',
    title: 'TreeItem',
    description:
      'One row of a hierarchy tree - the layer above TreeIndent. Owns the clickable name region, inline-rename, trailing actions, and an optional context menu; TreeIndent owns the indent + disclosure chevron.',
    itemName: 'tree-item',
    exampleName: 'tree-hero',
    Example: TreeHero,
    importSnippet: `import { TreeItem } from '@zeroxsolutions/ui/components/tree-item';`,
  },
  {
    kind: 'blocks',
    slug: 'ai-provider-picker',
    title: 'AiProviderPicker',
    description:
      'A registry:block - a responsive grid of AiProviderCard tiles, each showing one AI provider via an AiProviderIcon in the card icon slot.',
    itemName: 'ai-provider-picker',
    exampleName: 'ai-provider-picker-hero',
    Example: AiProviderPickerHero,
    importSnippet: `import {
  AiProviderPicker,
  DEFAULT_AI_PROVIDER_ENTRIES,
} from '@zeroxsolutions/ui/components/blocks/ai-provider-picker';`,
  },
  {
    kind: 'pages',
    slug: 'demo-page',
    title: 'DemoPage',
    description:
      'A registry:page - a small page region composing the ai-provider-picker block and the chat-message component. Pages assemble blocks and components into a full interface region.',
    itemName: 'demo-page',
    exampleName: 'demo-page-hero',
    Example: DemoPageHero,
    importSnippet: `import { DemoPage } from '@zeroxsolutions/ui/components/pages/demo-page';`,
  },
];

export const CATALOG_KINDS: CatalogKind[] = ['components', 'blocks', 'pages'];

export function entriesByKind(kind: CatalogKind): CatalogEntry[] {
  return CATALOG.filter((entry) => entry.kind === kind);
}

export function findEntry(
  kind: CatalogKind,
  slug: string,
): CatalogEntry | undefined {
  return CATALOG.find((entry) => entry.kind === kind && entry.slug === slug);
}

/** Params for the standalone preview route's `generateStaticParams`. */
export function previewParams(): { kind: CatalogKind; slug: string }[] {
  return CATALOG.map((entry) => ({ kind: entry.kind, slug: entry.slug }));
}
