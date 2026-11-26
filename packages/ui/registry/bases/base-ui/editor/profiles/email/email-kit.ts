import { createElement, type ReactNode } from 'react';
import { z } from 'zod';
import { AtSignIcon } from '@/registry/bases/base-ui/icons/lucide/at-sign-icon';
import { ChevronsUpDownIcon } from '@/registry/bases/base-ui/icons/lucide/chevrons-up-down-icon';
import { Heading2Icon } from '@/registry/bases/base-ui/icons/lucide/heading-2-icon';
import { IdCardIcon } from '@/registry/bases/base-ui/icons/lucide/id-card-icon';
import { ImageIcon } from '@/registry/bases/base-ui/icons/lucide/image-icon';
import { LayoutPanelTopIcon } from '@/registry/bases/base-ui/icons/lucide/layout-panel-top-icon';
import { MailboxIcon } from '@/registry/bases/base-ui/icons/lucide/mailbox-icon';
import { TableIcon } from '@/registry/bases/base-ui/icons/lucide/table-icon';
import { TextAlignStartIcon } from '@/registry/bases/base-ui/icons/lucide/text-align-start-icon';
import { TextQuoteIcon } from '@/registry/bases/base-ui/icons/lucide/text-quote-icon';
import {
  CONTENT_LOAD_META,
  Extension,
  isHistoryTransaction,
  Plugin,
  PluginKey,
  type Editor,
  type ProseMirrorNode,
} from '@zeroxsolutions/editor-core/document/advanced';
import {
  defineFeature,
  EditorError,
  type BlockMenuItem,
  type EditorFeature,
  type IEditor,
  type NodeJSON,
  type SlashItem,
  type ToolbarItem,
} from '@zeroxsolutions/editor-core/document/core/index';
import { blockIdentity, type BlockIdentityOptions } from '@zeroxsolutions/editor-core/profiles/editor/index';
import {
  CONTENT_WIDTH,
  defaultBlocks,
  emailAlignOf,
  layoutAlignOf,
  libraryBlocks,
  type Align,
  type DefaultBlockType,
  type LibraryBlockType,
} from '@zeroxsolutions/editor-core/template/email/index';
import {
  ALIGNS as LAYOUT_ALIGNS,
  LAYOUT_NODES,
  ratioFractions,
  TEXT_ALIGN_NODES,
  type LayoutAlign,
} from '@zeroxsolutions/editor-core/template/layout/index';
import {
  EMAIL_LAYOUT_ATTRIBUTES,
  EMAIL_KINDS,
  type EditorProfile,
  type EmailBlockKind,
  type VariableDeclaration,
} from '@zeroxsolutions/editor-core/profiles/index';
import { callout } from '../../document/features/callout/index';
import { codeBlock } from '../../document/features/code-block/index';
import { image } from '../../document/features/image/index';
import {
  standardBlockMenuItems,
  standardKit,
  standardSlashItems,
  standardToolbarItems,
} from '../../document/features/standard/index';
import { table } from '../../document/features/table/index';
import {
  DEFAULT_PROFILE_MESSAGES,
  type EmailBlockAttribute,
  type EmailBlockAttributeValue,
  type ProfileEditorMessages,
} from '../messages';
import { heldMarks } from '../held-marks';
import { codeMirrorVariables } from '../variables/code-mirror-variables';
import { variableFeature, variableIcon, type VariableFeature } from '../variables/variable';
import { emailBlockFeature, type EmailBlockViewProps } from './email-block-feature';
import { EmailFeatureView } from './email-feature-view';
import { EmailLegalFooterView } from './email-legal-footer-view';
import { EmailSocialLinksView } from './email-social-links-view';
import { EmailSpacerView } from './email-spacer-view';
import {
  blockAt,
  cellAt,
  columnsAt,
  contexts,
  contextOf,
  emailLinkAt,
  emailLinkTarget,
  laneAt,
  hasEmailLinkPopover,
  ownBlockMenus,
  type OwnBlockMenu,
  requestEmailLink,
  type EngineState,
  type Found,
  type KitContext,
} from './kit-context';
import { emailMarks, LINK_ITEM_ID, UNLINK_ITEM_ID } from './marks';
import { button } from '../../document/features/button/index';
import { columns } from '../../document/features/columns/index';
import { EmailButtonLabelField, emailButtonSlashItem } from './nodes/button';
import { emailColumnsSlashItem } from './nodes/columns';
import { emailHtmlNode, emailHtmlSlashItem } from './nodes/html';
import { emailSection } from './nodes/section';
import { emailUnknownNode } from './nodes/unknown';
import { emailAddressProblems } from './email-address-popover';
import type { KitUploads } from './kit-context';

/** The node each email kind is: the document's own block, or the email profile's where the document has none. */
export const EMAIL_KIND_NODES: Readonly<Record<EmailBlockKind, string>> = {
  paragraph: 'paragraph',
  button: 'button',
  code: 'codeBlock',
  list: 'bulletList',
  callout: 'callout',
  divider: 'horizontalRule',
  columns: 'columns',
  html: 'emailHtml',
  heading: 'heading',
  quote: 'blockquote',
  image: 'image',
  table: 'table',
  spacer: 'spacer',
  socialLinks: 'socialLinks',
  hero: 'hero',
  card: 'card',
  legalFooter: 'legalFooter',
  section: 'section',
};

/**
 * The document blocks the export folds into a paragraph or a list, by the kind each folds into, where the
 * profile does not hold the block's own kind. One arrives only by a paste or a drop, keeps its text, and is a
 * `block-not-carried` problem; nothing offers one.
 */
const FOLDED_BLOCKS: Readonly<Record<string, EmailBlockKind>> = {
  heading: 'paragraph',
  blockquote: 'paragraph',
  orderedList: 'list',
  taskList: 'list',
};

const ALIGNS = ['left', 'center', 'right'] as const;
const SPACES = ['small', 'medium', 'large'] as const;

/** The values each attribute the block menu sets takes. */
const ATTRIBUTE_VALUES: Readonly<Record<EmailBlockAttribute, readonly EmailBlockAttributeValue[]>> = {
  align: ALIGNS,
  spaceAfter: SPACES,
  tone: ['default', 'muted'],
  width: ['inline', 'full'],
  level: ['1', '2', '3'],
};

/** The attributes the block menu sets on each block node. */
const BLOCK_ATTRIBUTES: Readonly<Record<string, readonly EmailBlockAttribute[]>> = {
  paragraph: ['align', 'spaceAfter', 'tone'],
  button: ['align', 'spaceAfter', 'width'],
  codeBlock: ['align', 'spaceAfter'],
  bulletList: ['align', 'spaceAfter'],
  callout: ['align', 'spaceAfter'],
  horizontalRule: ['spaceAfter'],
  emailHtml: ['spaceAfter'],
  columns: ['spaceAfter'],
  heading: ['level', 'align', 'spaceAfter'],
  blockquote: ['align', 'spaceAfter'],
  image: ['align', 'spaceAfter'],
  table: ['spaceAfter'],
};

/**
 * The blocks whose Align aligns their text: a paragraph's and a heading's own lines, and the lines a quote, a list
 * or a callout holds, each as `textAlign`. Every other block's Align places the block itself, as the layout's
 * `align`.
 */
const TEXT_ALIGNED: ReadonlySet<string> = new Set(['paragraph', 'heading', 'blockquote', 'bulletList', 'callout']);

const isTextLine = (node: ProseMirrorNode): boolean => (TEXT_ALIGN_NODES as readonly string[]).includes(node.type.name);

/** The lines whose alignment a block's Align sets and reads: the block itself where it is one, else those it holds. */
function alignedLines(node: ProseMirrorNode, pos: number): { node: ProseMirrorNode; pos: number }[] {
  if (isTextLine(node)) return [{ node, pos }];
  const lines: { node: ProseMirrorNode; pos: number }[] = [];
  node.descendants((child, offset) => {
    if (isTextLine(child)) lines.push({ node: child, pos: pos + 1 + offset });
    return !isTextLine(child);
  });
  return lines;
}

/** The wire's name of a stored alignment: the layout's names, or the wire's own a document written before them holds. */
function wireAlignOf(value: unknown): Align | undefined {
  if (value === 'left' || value === 'right') return value;
  if (value === 'justify') return 'left';
  return (LAYOUT_ALIGNS as readonly unknown[]).includes(value) ? emailAlignOf(value as LayoutAlign) : undefined;
}

/** What the block menu's Align reads on `node`: its first line's alignment on a block of text, else its own. */
function blockAlign(node: ProseMirrorNode): Align | undefined {
  if (!TEXT_ALIGNED.has(node.type.name)) return wireAlignOf(node.attrs.align);
  return wireAlignOf(alignedLines(node, 0)[0]?.node.attrs.textAlign);
}

/** The attributes a node stores as a number, which the block menu offers as text. */
const NUMBER_ATTRIBUTES: ReadonlySet<EmailBlockAttribute> = new Set(['level']);

/** What an attribute reads as while the block does not set it: the house renderer's own default. */
const ATTRIBUTE_DEFAULTS: Readonly<Record<EmailBlockAttribute, EmailBlockAttributeValue>> = {
  align: 'left',
  spaceAfter: 'medium',
  tone: 'default',
  width: 'inline',
  level: '2',
};

/**
 * The blocks Turn into rewrites without losing what they hold, since their content is text. `turnBlockInto`
 * keeps only a block's lines, so a button, code, html, a divider or columns would lose what they are.
 */
const TURNABLE_BLOCKS = new Set(['paragraph', 'bulletList', 'callout', ...Object.keys(FOLDED_BLOCKS)]);

/** The order the slash menu lists the kinds in. */
const SLASH_ORDER: readonly EmailBlockKind[] = [
  'paragraph',
  'list',
  'callout',
  'code',
  'divider',
  'button',
  'columns',
  'section',
  'html',
  'heading',
  'quote',
  'image',
  'table',
  'hero',
  'card',
  'socialLinks',
  'spacer',
  'legalFooter',
];

/** The slash item that inserts each kind: the document's own where the kind is a document block. */
const KIND_SLASH_ITEMS: Readonly<Record<EmailBlockKind, string>> = {
  paragraph: 'email-paragraph',
  list: 'bulletList',
  callout: 'callout',
  code: 'codeBlock',
  divider: 'divider',
  button: 'email-button',
  columns: 'email-columns',
  html: 'email-html',
  heading: 'email-heading',
  quote: 'email-quote',
  image: 'email-image',
  table: 'email-table',
  spacer: 'email-block-spacer',
  socialLinks: 'email-block-socialLinks',
  hero: 'email-block-hero',
  card: 'email-block-card',
  legalFooter: 'email-block-legalFooter',
  section: 'email-section',
};

/** The library's blocks the kit offers, each as a product's block is offered, and the icon its slash item shows. */
const LIBRARY_ICONS: Readonly<Record<LibraryBlockType, unknown>> = {
  spacer: ChevronsUpDownIcon,
  socialLinks: AtSignIcon,
  hero: LayoutPanelTopIcon,
  card: IdCardIcon,
  legalFooter: MailboxIcon,
};

/** How the editor draws each library block: as the email draws it, each field written in place or in a popover. */
const LIBRARY_VIEWS: Readonly<Record<LibraryBlockType, (props: EmailBlockViewProps) => ReactNode>> = {
  spacer: EmailSpacerView,
  socialLinks: EmailSocialLinksView,
  hero: (props) => createElement(EmailFeatureView, { ...props, variant: 'hero' }),
  card: (props) => createElement(EmailFeatureView, { ...props, variant: 'card' }),
  legalFooter: EmailLegalFooterView,
};

/** The toolbar and bubble items of the marks an email stores, by the words each is drawn in. */
const MARK_ITEMS: Readonly<Record<string, 'bold' | 'italic' | 'link' | 'removeLink'>> = {
  bold: 'bold',
  italic: 'italic',
  [LINK_ITEM_ID]: 'link',
  [UNLINK_ITEM_ID]: 'removeLink',
};

/** The document's own items; the ones above aside, each offers what an email cannot store. */
const DOCUMENT_ITEMS = new Set([...standardSlashItems, ...standardToolbarItems].map((item) => item.id));

/** The marks the email's inline markup stores. */
const EMAIL_MARKS = new Set(['bold', 'italic', 'emailLink']);

const paragraphSlashItem: SlashItem = {
  id: 'email-paragraph',
  title: DEFAULT_PROFILE_MESSAGES.blocks.paragraph.title,
  description: DEFAULT_PROFILE_MESSAGES.blocks.paragraph.description,
  icon: TextAlignStartIcon,
  group: DEFAULT_PROFILE_MESSAGES.blockGroup,
  keywords: ['text', 'paragraph'],
  command: 'insertEmailBlock',
  args: { kind: 'paragraph' },
};

/** A slash item inserting `kind` through the kit's own command, in the default words, which `emailUi` rewords. */
function kindSlashItem(kind: EmailBlockKind, icon: SlashItem['icon'], keywords: string[]): SlashItem {
  return {
    id: KIND_SLASH_ITEMS[kind],
    ...DEFAULT_PROFILE_MESSAGES.blocks[kind],
    icon,
    group: DEFAULT_PROFILE_MESSAGES.blockGroup,
    keywords,
    command: 'insertEmailBlock',
    args: { kind },
  };
}

/** The email profile's own slash items; the document's features offer the rest. */
const OWN_SLASH_ITEMS: Partial<Record<EmailBlockKind, SlashItem>> = {
  paragraph: paragraphSlashItem,
  button: emailButtonSlashItem,
  columns: emailColumnsSlashItem,
  html: emailHtmlSlashItem,
  heading: kindSlashItem('heading', Heading2Icon, ['heading', 'title', 'h1', 'h2', 'h3']),
  quote: kindSlashItem('quote', TextQuoteIcon, ['quote', 'blockquote']),
  image: kindSlashItem('image', ImageIcon, ['image', 'picture', 'banner', 'photo']),
  table: kindSlashItem('table', TableIcon, ['table', 'rows', 'grid']),
};

/** The items the chrome draws: the slash menu's, the toolbar's and the bubble's. */
export interface EmailUi {
  slash: SlashItem[];
  toolbar: ToolbarItem[];
  bubble: ToolbarItem[];
}

/**
 * The kit's slash, toolbar and bubble items narrowed to what `profile` holds, in `messages`' words: the
 * kinds it allows, in the slash menu's order, and the bold, italic and link marks. A document item for what an
 * email cannot store is left out; an item of a host's own feature keeps its place and its words.
 */
export function emailUi(
  contributions: EmailUi,
  profile: EditorProfile,
  messages: ProfileEditorMessages = DEFAULT_PROFILE_MESSAGES,
): EmailUi {
  const kindItems = new Set(Object.values(KIND_SLASH_ITEMS));
  const offered = SLASH_ORDER.filter((kind) => profile.kinds.includes(kind)).flatMap((kind) =>
    contributions.slash
      .filter((item) => item.id === KIND_SLASH_ITEMS[kind])
      .map((item) => ({ ...item, ...messages.blocks[kind], group: messages.blockGroup })),
  );
  const hosted = contributions.slash.filter((item) => !kindItems.has(item.id) && !DOCUMENT_ITEMS.has(item.id));
  const marks = (items: readonly ToolbarItem[]) =>
    items.flatMap((item) => {
      const words = MARK_ITEMS[item.id];
      if (words) return [{ ...item, title: messages[words] }];
      return DOCUMENT_ITEMS.has(item.id) ? [] : [item];
    });
  return { slash: [...offered, ...hosted], toolbar: marks(contributions.toolbar), bubble: marks(contributions.bubble) };
}

const lane = (): NodeJSON => ({ type: 'column', content: [{ type: 'paragraph' }] });
const tableCell = (type: 'tableHeader' | 'tableCell'): NodeJSON => ({ type, content: [{ type: 'paragraph' }] });

/** What each kind inserts, empty, so the author fills it in place. */
const NEW_BLOCKS: Readonly<Record<Exclude<EmailBlockKind, 'paragraph' | LibraryBlockType>, () => NodeJSON>> = {
  button: () => ({ type: 'button' }),
  code: () => ({ type: 'codeBlock', attrs: { language: 'text', code: '' } }),
  list: () => ({ type: 'bulletList', content: [{ type: 'listItem', content: [{ type: 'paragraph' }] }] }),
  callout: () => ({ type: 'callout', attrs: { variant: 'info' }, content: [{ type: 'paragraph' }] }),
  divider: () => ({ type: 'horizontalRule' }),
  columns: () => ({ type: 'columns', attrs: { ratio: [1, 1] }, content: [lane(), lane()] }),
  html: () => ({ type: 'emailHtml' }),
  heading: () => ({ type: 'heading', attrs: { level: 2 } }),
  quote: () => ({ type: 'blockquote', content: [{ type: 'paragraph' }] }),
  image: () => ({ type: 'image', attrs: { src: '', alt: '' } }),
  table: () => ({
    type: 'table',
    content: [
      { type: 'tableRow', content: [tableCell('tableHeader'), tableCell('tableHeader')] },
      { type: 'tableRow', content: [tableCell('tableCell'), tableCell('tableCell')] },
    ],
  }),
  section: () => ({ type: 'section', content: [{ type: 'paragraph' }] }),
};

export interface EmailKitOptions extends BlockIdentityOptions {
  /**
   * The declarations the chips and the link popover read; the profile's own when absent. A getter, so a host
   * changes them live.
   */
  declarations?: () => readonly VariableDeclaration[];
  /** The variable feature the host also hands its trigger layer; one is built on `declarations` when absent. */
  variables?: VariableFeature;
  /** The hint an empty line shows; `messages`' `emptyLine` when absent. */
  placeholder?: string;
  /**
   * The words the kit draws. The block menu's titles and the hint are read once, when the kit is built; the
   * reasons an item is disabled are read each time the menu opens. The English when absent.
   */
  messages?: () => ProfileEditorMessages;
  /**
   * The host's upload and its limits: every image field, the image block's, a hero's, a card's, a product
   * block's and each social icon's, uploads a file beside taking an address, and a pasted or dropped image file
   * becomes an image block. Address only when absent.
   */
  uploads?: KitUploads;
}

function holdsRequired(node: ProseMirrorNode, required: readonly string[]): boolean {
  if (required.length === 0) return false;
  let found = required.includes(node.attrs.id as string);
  node.descendants((child) => {
    if (required.includes(child.attrs.id as string)) found = true;
    return !found;
  });
  return found;
}

/**
 * Gives a columns block `ratio.length` lanes. An added lane holds an empty line; a removed lane's blocks move,
 * in order, to the end of the last lane kept, so no text is lost and each keeps its id. An empty line the host
 * has no id for is dropped instead, since it holds nothing.
 */
function setRatio(engine: Editor, { node, pos }: Found, ratio: number[]): boolean {
  const tr = engine.state.tr;
  const have = node.childCount;
  const want = ratio.length;
  if (want > have) {
    const laneType = engine.state.schema.nodes.column;
    const added = Array.from({ length: want - have }, () => laneType.createAndFill());
    tr.insert(
      pos + node.nodeSize - 1,
      added.filter((lane): lane is ProseMirrorNode => lane !== null),
    );
  } else if (want < have) {
    const starts: number[] = [];
    node.forEach((_lane, offset) => starts.push(pos + 1 + offset));
    const moved: ProseMirrorNode[] = [];
    for (let index = want; index < have; index += 1) {
      node.child(index).forEach((child) => {
        if (!(child.isTextblock && child.content.size === 0 && child.attrs.id == null)) moved.push(child);
      });
    }
    tr.delete(starts[want], pos + node.nodeSize - 1);
    if (moved.length > 0) tr.insert(starts[want - 1] + node.child(want - 1).nodeSize - 1, moved);
  }
  tr.setNodeAttribute(pos, 'ratio', ratio);
  const before = engine.state.doc;
  engine.view.dispatch(tr);
  return engine.state.doc !== before;
}

/** Whether a node spec's group, a space-separated list, names `group`. */
function inGroup(spec: { group?: string }, group: string): boolean {
  return (spec.group ?? '').split(' ').includes(group);
}

/** How many nodes of each block type outside `admitted` a document holds. */
function outsiders(doc: ProseMirrorNode, admitted: ReadonlySet<string>): Map<string, number> {
  const counts = new Map<string, number>();
  doc.descendants((node) => {
    const name = node.type.name;
    const block = inGroup(node.type.spec, 'block');
    if (block && !admitted.has(name)) counts.set(name, (counts.get(name) ?? 0) + 1);
    return true;
  });
  return counts;
}

/**
 * Refuses a feature whose node or mark the email export cannot carry: every block it declares or encodes needs
 * a codec with `toEmailBlock` and `fromEmailBlock`, and an inline node or a mark has no place in the stored text.
 * Refuses two features that hold one node, as a block given both in `blocks` and in `features`, and a feature
 * holding a library block's node, which the kit holds itself.
 */
function assertEmailCodecs(extra: readonly EditorFeature[]): void {
  const named = new Set<string>();
  for (const node of extra.flatMap((feature) => feature.nodes ?? [])) {
    if (Object.hasOwn(libraryBlocks, node.name)) {
      throw new EditorError(
        'editor.profile.library_node',
        `The email kit already holds the library block "${node.name}"; leave it out of the features.`,
      );
    }
    if (named.has(node.name)) {
      throw new EditorError('editor.profile.duplicate_node', `Two of the features hold the node "${node.name}".`);
    }
    named.add(node.name);
  }
  for (const feature of extra) {
    const inline = (feature.nodes ?? []).find((node) => inGroup(node, 'inline'));
    if (inline) {
      throw new EditorError(
        'editor.profile.no_email_codec',
        `Feature "${feature.id}" holds the inline node "${inline.name}", which an email's text cannot store.`,
      );
    }
    const codecs = new Map((feature.codecs ?? []).map((codec) => [codec.node, codec]));
    const parts = new Set(
      (feature.nodes ?? [])
        .filter((node) => !inGroup(node, 'block') && !inGroup(node, 'inline'))
        .map((node) => node.name),
    );
    const names = [...(feature.nodes ?? []).map((node) => node.name), ...codecs.keys()].filter(
      (name) => !parts.has(name),
    );
    for (const name of new Set(names)) {
      const codec = codecs.get(name);
      if (!codec?.toEmailBlock || !codec.fromEmailBlock) {
        throw new EditorError(
          'editor.profile.no_email_codec',
          `Feature "${feature.id}" holds "${name}", which has no email codec (toEmailBlock and fromEmailBlock).`,
        );
      }
    }
    const marks = [...(feature.marks ?? []).map((mark) => mark.name), ...(feature.markCodecs ?? []).map((c) => c.mark)];
    if (marks.length > 0) {
      throw new EditorError(
        'editor.profile.no_email_codec',
        `Feature "${feature.id}" holds the mark "${marks[0]}", which an email's text cannot store.`,
      );
    }
  }
}

/** Whether the block's own id is one the host requires. */
function isRequired(node: ProseMirrorNode, required: readonly string[]): boolean {
  return typeof node.attrs.id === 'string' && required.includes(node.attrs.id);
}

function validAttributes(type: string, attrs: Record<string, string>): boolean {
  const allowed = BLOCK_ATTRIBUTES[type];
  return (
    allowed !== undefined &&
    Object.entries(attrs).length > 0 &&
    Object.entries(attrs).every(
      ([name, value]) =>
        allowed.includes(name as EmailBlockAttribute) &&
        ATTRIBUTE_VALUES[name as EmailBlockAttribute].includes(value as EmailBlockAttributeValue),
    )
  );
}

const DATA_NAMES: Readonly<Record<string, string>> = { align: 'align', spaceAfter: 'space-after', tone: 'tone' };

/** The nodes whose own specs declare their attributes, so no global attribute repeats one. */
const OWN_SPEC_NODES: ReadonlySet<string> = new Set(['button', 'columns', 'emailHtml', 'section']);

const dataName = (attribute: string): string =>
  DATA_NAMES[attribute] ?? attribute.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);

const dataAttribute = (attribute: string) => ({
  default: null,
  parseHTML: (element: HTMLElement) => element.getAttribute(`data-${dataName(attribute)}`),
  renderHTML: (attrs: Record<string, unknown>) =>
    attrs[attribute] ? { [`data-${dataName(attribute)}`]: attrs[attribute] } : {},
});

// The stored text, or the stored block, an import keeps beside the nodes; a copy must not carry it to another block.
const sourceAttribute = { default: null, rendered: false, keepOnSplit: false, parseHTML: () => null };

/**
 * Whether `blockLayout` declares `name` on `type`, as it reads `LAYOUT_NODES` and `TEXT_ALIGN_NODES`: the layout's
 * keys, a line's `textAlign`, a paragraph's `size` and a table's `columnWidths`.
 */
function declaredByLayout(type: string, name: string): boolean {
  return (
    ((LAYOUT_NODES as Readonly<Record<string, readonly string[]>>)[type] ?? []).includes(name) ||
    (name === 'textAlign' && (TEXT_ALIGN_NODES as readonly string[]).includes(type)) ||
    (name === 'size' && type === 'paragraph') ||
    (name === 'columnWidths' && type === 'table')
  );
}

/**
 * The email's own attributes on the document's nodes, as global attributes: a paragraph's tone, a code block's
 * alignment, the stored text or block an import keeps. The layout's, `blockLayout` declares.
 */
function emailGlobalAttributes() {
  return Object.entries(EMAIL_LAYOUT_ATTRIBUTES)
    .filter(([type]) => !OWN_SPEC_NODES.has(type))
    .map(([type, names]) => ({
      types: [type],
      attributes: Object.fromEntries(
        names
          .filter((name) => !declaredByLayout(type, name))
          .map((name) => [name, name === 'source' || name === 'stored' ? sourceAttribute : dataAttribute(name)]),
      ),
    }))
    .filter(({ attributes }) => Object.keys(attributes).length > 0);
}

/**
 * Refuses a change that adds a block of a type outside `admitted`, such as a pasted or dropped button in a mail
 * layout; a paste or a drop may also bring one of `carried`, which the export folds and marks. A stored block
 * stays, moves and goes, showing its problem; a host's load and an undo pass.
 */
function admittedBlocks(admitted: ReadonlySet<string>, carried: ReadonlySet<string>): Plugin {
  const pastable = new Set([...admitted, ...carried]);
  const counted = new WeakMap<ProseMirrorNode, Map<string, number>>();
  const countsOf = (doc: ProseMirrorNode) => {
    let counts = counted.get(doc);
    if (!counts) counted.set(doc, (counts = outsiders(doc, admitted)));
    return counts;
  };
  return new Plugin({
    key: new PluginKey('emailAdmittedBlocks'),
    filterTransaction(tr, state: EngineState) {
      // Undo and redo put back what the author removed, a stored block of a left-out kind included.
      if (!tr.docChanged || tr.getMeta(CONTENT_LOAD_META) || isHistoryTransaction(tr)) return true;
      const pasted = tr.getMeta('uiEvent') === 'paste' || tr.getMeta('uiEvent') === 'drop';
      const before = countsOf(state.doc);
      for (const [name, count] of countsOf(tr.doc)) {
        if (count > (before.get(name) ?? 0) && !(pasted && pastable.has(name))) return false;
      }
      return true;
    },
  });
}

/** How many blocks in `doc`'s table cells are not a line: each one the export loses or flattens. */
function cellBlocks(doc: ProseMirrorNode): number {
  let count = 0;
  doc.descendants((node) => {
    if (node.type.name !== 'tableCell' && node.type.name !== 'tableHeader') return true;
    node.forEach((child) => {
      if (child.type.name !== 'paragraph') count += 1;
    });
    return false;
  });
  return count;
}

/**
 * Refuses a change that adds a block other than a line to a table cell, as a typed `# ` or a shortcut does, since
 * the export writes a cell as one line. A paste or a drop may bring one, which `docProblems` marks; a host's load
 * and an undo pass.
 */
function cellLines(): Plugin {
  const counted = new WeakMap<ProseMirrorNode, number>();
  const countOf = (doc: ProseMirrorNode) => {
    let count = counted.get(doc);
    if (count === undefined) counted.set(doc, (count = cellBlocks(doc)));
    return count;
  };
  return new Plugin({
    key: new PluginKey('emailCellLines'),
    filterTransaction(tr, state: EngineState) {
      if (!tr.docChanged || tr.getMeta(CONTENT_LOAD_META) || isHistoryTransaction(tr)) return true;
      if (tr.getMeta('uiEvent') === 'paste' || tr.getMeta('uiEvent') === 'drop') return true;
      return countOf(tr.doc) <= countOf(state.doc);
    },
  });
}

/** How many blocks drawn at the card's whole width sit in `doc`'s lanes. */
function wideInLanes(doc: ProseMirrorNode): number {
  let count = 0;
  doc.descendants((node) => {
    if (node.type.name !== 'column') return true;
    node.forEach((child) => {
      if (defaultBlocks[child.type.name as DefaultBlockType]?.wide === true) count += 1;
    });
    return false;
  });
  return count;
}

/**
 * Refuses a change that puts a hero or a card in a lane, by an insert, a paste or a drop: each is drawn at the
 * card's width, which Outlook would push the lane past. A host's load and an undo pass, and a stored one shows
 * its problem.
 */
function laneWidths(): Plugin {
  const counted = new WeakMap<ProseMirrorNode, number>();
  const countOf = (doc: ProseMirrorNode) => {
    let count = counted.get(doc);
    if (count === undefined) counted.set(doc, (count = wideInLanes(doc)));
    return count;
  };
  return new Plugin({
    key: new PluginKey('emailLaneWidths'),
    filterTransaction(tr, state: EngineState) {
      if (!tr.docChanged || tr.getMeta(CONTENT_LOAD_META) || isHistoryTransaction(tr)) return true;
      return countOf(tr.doc) <= countOf(state.doc);
    },
  });
}

/**
 * The engine half: the email attributes on the document's nodes, the blocks and marks an author may add, the
 * input and paste rules of only what the email stores, and the context the commands read.
 */
function emailEngine(context: KitContext, carried: ReadonlySet<string>, rules: readonly string[]): Extension {
  return Extension.create({
    name: 'emailKit',
    onBeforeCreate() {
      contexts.set(this.editor, context);
      // The document's rules would turn `# ` into a heading, `1. ` into a numbered list and a pasted `~~x~~`
      // into a strike, which the email folds or drops; the engine reads the options when it builds its plugins,
      // after this.
      this.editor.options.enableInputRules = [...rules];
      this.editor.options.enablePasteRules = [...rules];
    },
    onDestroy() {
      contexts.delete(this.editor);
    },
    addGlobalAttributes: () => emailGlobalAttributes(),
    addProseMirrorPlugins: () => [
      // A block's width is a share of the card's content width, as the email draws it, wherever the editor is wider.
      new Plugin({
        key: new PluginKey('emailContentWidth'),
        props: { attributes: { style: `--layout-container: ${CONTENT_WIDTH}px` } },
      }),
      admittedBlocks(context.admitted, carried),
      cellLines(),
      laneWidths(),
      heldMarks(EMAIL_MARKS),
    ],
  });
}

/**
 * The email profile's features: the Document Editor's own blocks, frame and block menu (`standardKit`, the
 * callout, the code block, the button and the columns), and what the document has no block for (the html block,
 * the variable chip and the link to a url variable), with the email attributes on the
 * document's nodes and a block menu item for each. Every email node is in the schema, so a stored block of a
 * kind the profile leaves out still opens and shows its problem; none is offered, and a change that adds one is
 * refused. `extra` joins when each of its block nodes has an email codec, and its blocks carry an id and a key.
 * Narrow the chrome's items with `emailUi`.
 */
export function emailKit(
  profile: EditorProfile,
  extra: readonly EditorFeature[] = [],
  options: EmailKitOptions = {},
): EditorFeature[] {
  if (profile.id !== 'email') {
    throw new EditorError('editor.profile.not_email', `emailKit takes the email profile, not "${profile.id}".`);
  }
  assertEmailCodecs(extra);
  const kinds = EMAIL_KINDS.filter((kind) => profile.kinds.includes(kind));
  const declarations = options.declarations ?? (() => profile.variables);
  const variables = options.variables ?? variableFeature(declarations);
  const required = () => options.required?.() ?? [];
  const locked = () => options.structure?.() === 'locked';
  const messages = options.messages ?? (() => DEFAULT_PROFILE_MESSAGES);

  // In the schema whatever the profile allows, so a stored one opens; its slash item is offered where it is allowed.
  const library = (Object.keys(libraryBlocks) as LibraryBlockType[]).map((type) =>
    emailBlockFeature(libraryBlocks[type], {
      icon: LIBRARY_ICONS[type],
      view: LIBRARY_VIEWS[type],
      messages,
      inLanes: type !== 'hero' && type !== 'card',
    }),
  );
  const ownMenus = [...extra, ...library].flatMap((feature) => ownBlockMenus.get(feature) ?? []);
  const extraNodes = extra.flatMap((feature) => (feature.nodes ?? []).filter((node) => inGroup(node, 'block')));
  const extraBlocks = extraNodes.map((node) => node.name);
  // A lane holds no block of lanes, as it holds no columns block.
  const laneBlocks = extraNodes.filter((node) => !/\bcolumn\b/.test(node.content ?? '')).map((node) => node.name);
  // Every kind but columns and the section, whatever the profile allows, so a stored lane opens; adding is narrowed below.
  const laneContent = `(${[
    ...new Set([
      ...EMAIL_KINDS.filter((kind) => kind !== 'columns' && kind !== 'section').map((kind) => EMAIL_KIND_NODES[kind]),
      ...Object.keys(FOLDED_BLOCKS),
      'emailUnknown',
      ...laneBlocks,
    ]),
  ].join(' | ')})*`;
  // A list item's and a callout's lines are paragraphs, whatever the profile allows at the top.
  const admitted = new Set([
    'paragraph',
    ...kinds.map((kind) => EMAIL_KIND_NODES[kind]),
    'emailUnknown',
    ...extraBlocks,
  ]);
  const carried = new Set(
    Object.entries(FOLDED_BLOCKS)
      .filter(([, kind]) => admitted.has(EMAIL_KIND_NODES[kind]))
      .map(([name]) => name),
  );
  const context: KitContext = {
    locked,
    required,
    maxLanes: profile.bounds.lanes,
    admitted,
    declarations,
    variables,
    messages,
    linkListeners: new Set(),
    uploads: options.uploads ?? null,
  };
  const rules = [
    'zeroxEditorBehavior',
    'variableEngine',
    'bold',
    'italic',
    ...(kinds.includes('list') ? ['bulletList'] : []),
    ...(kinds.includes('divider') ? ['horizontalRule'] : []),
    ...(kinds.includes('heading') ? ['heading'] : []),
    ...(kinds.includes('quote') ? ['blockquote'] : []),
  ];

  const insertable = (editor: IEditor, kind: EmailBlockKind): boolean => {
    const found = contextOf(editor);
    if (!found || locked() || !kinds.includes(kind)) return false;
    if (kind !== 'paragraph' && cellAt(found.engine.state) !== undefined) return false;
    // A library block's own feature knows where it goes, as a lane holds no hero.
    if (Object.hasOwn(libraryBlocks, kind)) return editor.can(`insertEmailBlock:${kind}`);
    if (kind === 'section') return !editor.isActive('section') && !editor.isActive('column');
    return kind !== 'columns' || laneAt(found.engine.state) === undefined;
  };
  const attributable = (editor: IEditor, attrs: Record<string, string>) => {
    const found = contextOf(editor);
    const block = found && blockAt(found.engine.state);
    if (!found || !block || locked() || isRequired(block.node, required())) return undefined;
    return validAttributes(block.node.type.name, attrs) ? { engine: found.engine, block } : undefined;
  };
  const linkable = (editor: IEditor) => {
    const found = contextOf(editor);
    const block = found && blockAt(found.engine.state);
    if (!found || !block || block.node.type.name !== 'button' || locked()) return undefined;
    return isRequired(block.node, required()) ? undefined : { engine: found.engine, block };
  };
  const linkTarget = (editor: IEditor) => {
    const found = contextOf(editor);
    return found && emailLinkTarget(found.engine, (button) => refusal(context, button, false));
  };
  const columnsOf = (editor: IEditor, ratio: number[]) => {
    const found = contextOf(editor);
    const columns = found && columnsAt(found.engine.state);
    if (!found || !columns || locked() || isRequired(columns.node, required())) return undefined;
    return ratio.length <= profile.bounds.lanes ? { engine: found.engine, columns } : undefined;
  };

  // As the block menu refuses a change of attributes: in locked structure, and on a block the host requires.
  const changeable = (editor: IEditor, pos: number): boolean => {
    const found = contextOf(editor);
    const node = found?.engine.state.doc.nodeAt(pos);
    return !!found && !!node && refusal(context, { node, pos }, false) === null;
  };

  const blocks = defineFeature({
    id: 'emailBlocks',
    nodes: [emailHtmlNode(), emailUnknownNode()],
    commands: {
      insertEmailBlock: {
        args: z.object({ kind: z.enum(EMAIL_KINDS as [EmailBlockKind, ...EmailBlockKind[]]) }),
        run: (editor, { kind }: { kind: EmailBlockKind }) => {
          if (!insertable(editor, kind)) return false;
          if (kind === 'paragraph') return editor.run('setParagraph');
          // A library block is inserted by its own feature's command, as a product's block is.
          if (Object.hasOwn(libraryBlocks, kind)) return editor.run(`insertEmailBlock:${kind}`);
          return editor.run('insertContent', { content: NEW_BLOCKS[kind as keyof typeof NEW_BLOCKS]() });
        },
        can: (editor, { kind }: { kind: EmailBlockKind }) => insertable(editor, kind),
      },
      setBlockAttributes: {
        args: z.object({ attrs: z.record(z.string(), z.string()) }),
        run: (editor, { attrs }: { attrs: Record<string, string> }) => {
          const target = attributable(editor, attrs);
          if (!target) return false;
          const { engine, block } = target;
          const tr = engine.state.tr;
          for (const [name, value] of Object.entries(attrs)) {
            if (name === 'align') {
              const align = layoutAlignOf(value as Align);
              if (!TEXT_ALIGNED.has(block.node.type.name)) tr.setNodeAttribute(block.pos, 'align', align);
              else
                for (const line of alignedLines(block.node, block.pos))
                  tr.setNodeAttribute(line.pos, 'textAlign', align);
              continue;
            }
            const stored = NUMBER_ATTRIBUTES.has(name as EmailBlockAttribute) ? Number(value) : value;
            tr.setNodeAttribute(block.pos, name, stored);
          }
          const before = engine.state.doc;
          engine.view.dispatch(tr);
          return engine.state.doc !== before;
        },
        can: (editor, { attrs }: { attrs: Record<string, string> }) => attributable(editor, attrs) !== undefined,
      },
      // Here rather than with the marks: a caret inside a link removes the whole link, which needs the engine.
      unsetEmailLink: {
        run: (editor) => {
          const found = contextOf(editor);
          return !!found && found.engine.chain().focus().extendMarkRange('emailLink').unsetMark('emailLink').run();
        },
        can: (editor) => emailLinkAt(editor) !== null,
      },
      setButtonLink: {
        args: z.object({ href: z.string().trim().min(1) }),
        run: (editor, { href }: { href: string }) => {
          const target = linkable(editor);
          if (!target) return false;
          const { engine, block } = target;
          const before = engine.state.doc;
          engine.view.dispatch(engine.state.tr.setNodeAttribute(block.pos, 'href', href));
          return engine.state.doc !== before;
        },
        can: (editor) => linkable(editor) !== undefined,
      },
      // The popover is the host's: the toolbar, the bubble and a button's block menu all open it through here.
      editEmailLink: {
        run: (editor) => {
          const target = linkTarget(editor);
          return !!target && requestEmailLink(editor, target);
        },
        can: (editor) => hasEmailLinkPopover(editor) && linkTarget(editor) !== undefined,
      },
      setColumnsRatio: {
        args: z.object({ ratio: z.array(z.number().int().min(1).max(12)).min(2) }),
        run: (editor, { ratio }: { ratio: number[] }) => {
          const target = columnsOf(editor, ratio);
          return !!target && setRatio(target.engine, target.columns, ratio);
        },
        can: (editor, { ratio }: { ratio: number[] }) => columnsOf(editor, ratio) !== undefined,
      },
    },
    slash: kinds.flatMap((kind) => OWN_SLASH_ITEMS[kind] ?? []),
    advanced: { engineExtensions: [emailEngine(context, carried, rules)] },
  });

  // The document's own block menu, Turn into narrowed to the email's kinds, joins the email's below.
  const standard: EditorFeature = {
    ...standardKit({
      placeholder: options.placeholder ?? messages().emptyLine,
      trailingNode: false,
      // Refuses what an email cannot draw: a full width, justified text, a full section.
      layout: { email: true },
    }),
    blockMenu: [],
  };

  return [
    standard,
    callout({ variants: ['info'] }),
    codeBlock({
      languagePicker: false,
      extensions: () =>
        codeMirrorVariables({
          declarations,
          subscribe: variables.watchDeclarations,
          icon: (declaration) => variableIcon(declaration.type),
        }),
    }),
    blockIdentity({ required: options.required, structure: options.structure, types: extraBlocks }),
    variables.feature,
    emailMarks(),
    // The document's own button and columns, inserted only through the email's commands, which check the profile,
    // locked structure and lanes.
    { ...button({ labelField: EmailButtonLabelField, linkField: false }), slash: [], commands: {} },
    {
      ...columns({
        columnContent: laneContent,
        maxLanes: profile.bounds.lanes,
        messages: () => messages().layout,
        changeable,
      }),
      slash: [],
      commands: {},
    },
    emailSection(messages),
    // In the schema whatever the profile allows, so a stored image or table opens and shows its problem.
    {
      ...image({
        words: () => messages().imageBlock,
        layoutWords: () => messages().layout,
        ...(options.uploads
          ? {
              upload: options.uploads.upload,
              ...options.uploads.limits,
              messages: () => messages().uploads,
              // The image block loads over https only; an answer is checked as a typed address is.
              problems: (url: string) => emailAddressProblems(url, 'image', true, declarations(), messages()),
            }
          : {}),
      }),
      slash: [],
      commands: {},
    },
    { ...table({ messages: () => messages().layout, changeable }), slash: [], commands: {} },
    ...library,
    blocks,
    defineFeature({
      id: 'emailBlockMenu',
      // Drawn when the menu opens, so the words, the declarations and the block's own lanes are the current ones.
      blockMenu: [
        {
          id: 'email-block-menu',
          title: '',
          command: '',
          items: (editor) => emailBlockMenuItems(editor, kinds, ownMenus),
        },
      ],
    }),
    ...extra,
  ];
}

/** Whether two ratios draw the same shares, as a dragged `[8, 4]` draws `[2, 1]`. */
function sameShares(a: readonly number[], b: readonly number[]): boolean {
  return (
    a.length === b.length && ratioFractions(a).every((share, lane) => Math.abs(share - ratioFractions(b)[lane]) < 1e-9)
  );
}

/**
 * The lane shares offered for each lane count up to `maxLanes`, `current` among them when it draws as none of
 * them.
 */
function ratioChoices(maxLanes: number, current: readonly number[] | null): number[][] {
  const choices: number[][] = [];
  for (let lanes = 2; lanes <= maxLanes; lanes += 1) {
    choices.push(Array.from({ length: lanes }, () => 1));
    if (lanes === 2) choices.push([2, 1], [1, 2]);
    if (lanes === 3) choices.push([1, 2, 1]);
  }
  if (!current || choices.some((choice) => sameShares(choice, current))) return choices;
  return [...choices, [...current]];
}

/** Why a change to `block` is refused: locked structure, or a required block; `whole` counts the blocks inside it. */
function refusal(context: KitContext, block: Found, whole: boolean): string | null {
  const words = context.messages();
  if (context.locked()) return words.deleteLocked;
  const required = context.required();
  return (whole ? holdsRequired(block.node, required) : isRequired(block.node, required)) ? words.deleteRequired : null;
}

/**
 * The email's block menu for the block the grip picked, or the one the caret is in, read as the menu opens:
 * Turn into its text kinds, a submenu per attribute the block takes, a product block's own items, a button's
 * Link, which opens the link popover on it, the lanes of the columns it is or sits in, and the document's
 * Duplicate and Delete. Each is disabled, with its reason, in locked structure and on a block the host requires; Duplicate also on a block of
 * a kind the profile does not let the author add.
 */
function emailBlockMenuItems(
  editor: IEditor,
  kinds: readonly EmailBlockKind[],
  ownMenus: readonly OwnBlockMenu[],
): BlockMenuItem[] {
  const found = contextOf(editor);
  const block = found && blockAt(found.engine.state);
  if (!found || !block) return [];
  const { context } = found;
  const words = context.messages();
  const type = block.node.type.name;
  const own = () => refusal(context, block, false);
  const whole = () => refusal(context, block, true);

  const turnInto = TURNABLE_BLOCKS.has(type)
    ? (['paragraph', 'list'] as const)
        .filter((kind) => kinds.includes(kind))
        .map((kind): BlockMenuItem => ({
          id: `email-turn-into-${kind}`,
          title: words.blocks[kind].title,
          group: words.turnInto,
          command: 'turnBlockInto',
          args: { name: EMAIL_KIND_NODES[kind] },
          active: () => type === EMAIL_KIND_NODES[kind],
          disabledReason: whole,
        }))
    : [];

  const attributes = (BLOCK_ATTRIBUTES[type] ?? []).flatMap((attribute) =>
    ATTRIBUTE_VALUES[attribute].map((value): BlockMenuItem => ({
      id: `email-${attribute}-${value}`,
      title: words.attributeValues[value],
      group: words.attributes[attribute],
      command: 'setBlockAttributes',
      args: { attrs: { [attribute]: value } },
      active: () =>
        String(
          (attribute === 'align' ? blockAlign(block.node) : block.node.attrs[attribute]) ??
            ATTRIBUTE_DEFAULTS[attribute],
        ) === value,
      disabledReason: own,
    })),
  );

  // Always offered, so a locked button's link can be read; the popover disables its field with the reason.
  const link: BlockMenuItem[] =
    type === 'button' ? [{ id: LINK_ITEM_ID, title: words.link, command: 'editEmailLink' }] : [];

  const columns = columnsAt(found.engine.state);
  const stored = columns?.node.attrs.ratio as number[] | null | undefined;
  const current = columns
    ? stored && stored.length > 0
      ? stored
      : Array.from({ length: columns.node.childCount }, () => 1)
    : null;
  const lanes = columns
    ? ratioChoices(context.maxLanes, current).map((ratio): BlockMenuItem => ({
        id: `email-lanes-${ratio.join('-')}`,
        title: ratio.join(' : '),
        group: words.columns,
        command: 'setColumnsRatio',
        args: { ratio },
        active: () => current !== null && sameShares(current, ratio),
        disabledReason: () => refusal(context, columns, false),
      }))
    : [];

  const duplicateReason = () => whole() ?? (context.admitted.has(type) ? null : words.kindNotAllowed);
  const documentItem = (id: string, title: string, disabledReason: () => string | null): BlockMenuItem[] =>
    standardBlockMenuItems.filter((item) => item.id === id).map((item) => ({ ...item, title, disabledReason }));

  const product = ownMenus.flatMap((menu) => menu(editor, block, own));

  return [
    ...turnInto,
    ...attributes,
    ...product,
    ...link,
    ...lanes,
    ...documentItem('duplicate', words.duplicate, duplicateReason),
    ...documentItem('delete', words.delete, whole),
  ];
}
