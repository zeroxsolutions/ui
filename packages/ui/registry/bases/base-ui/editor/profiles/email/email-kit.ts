import { z } from 'zod';
import { TextAlignStartIcon } from '@/registry/bases/base-ui/icons/lucide/text-align-start-icon';
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
  EMAIL_GLOBAL_ATTRIBUTES,
  EMAIL_KINDS,
  type EditorProfile,
  type EmailBlockKind,
  type VariableDeclaration,
} from '@zeroxsolutions/editor-core/profiles/index';
import { callout } from '../../document/features/callout/index';
import { codeBlock } from '../../document/features/code-block/index';
import {
  standardBlockMenuItems,
  standardKit,
  standardSlashItems,
  standardToolbarItems,
} from '../../document/features/standard/index';
import {
  DEFAULT_PROFILE_MESSAGES,
  type EmailBlockAttribute,
  type EmailBlockAttributeValue,
  type ProfileEditorMessages,
} from '../messages';
import { heldMarks } from '../held-marks';
import { variableFeature, type VariableFeature } from '../variables/variable';
import {
  blockAt,
  columnsAt,
  contexts,
  contextOf,
  emailLinkAt,
  emailLinkTarget,
  laneAt,
  requestEmailLink,
  type EngineState,
  type Found,
  type KitContext,
} from './kit-context';
import { emailMarks, LINK_ITEM_ID, UNLINK_ITEM_ID } from './marks';
import { emailButtonNode, emailButtonSlashItem } from './nodes/button';
import { emailColumnsNodes, emailColumnsSlashItem } from './nodes/columns';
import { emailHtmlNode, emailHtmlSlashItem } from './nodes/html';
import { emailUnknownNode } from './nodes/unknown';

/** The node each email kind is: the document's own block, or the email profile's where the document has none. */
export const EMAIL_KIND_NODES: Readonly<Record<EmailBlockKind, string>> = {
  paragraph: 'paragraph',
  button: 'emailButton',
  code: 'codeBlock',
  list: 'bulletList',
  callout: 'callout',
  divider: 'horizontalRule',
  columns: 'emailColumns',
  html: 'emailHtml',
};

/**
 * The document blocks the export folds into a paragraph or a list, by the kind each folds into. One arrives
 * only by a paste or a drop, keeps its text, and is a `block-not-carried` problem; nothing offers one.
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
};

/** The attributes the block menu sets on each block node. */
const BLOCK_ATTRIBUTES: Readonly<Record<string, readonly EmailBlockAttribute[]>> = {
  paragraph: ['align', 'spaceAfter', 'tone'],
  emailButton: ['align', 'spaceAfter', 'width'],
  codeBlock: ['align', 'spaceAfter'],
  bulletList: ['align', 'spaceAfter'],
  callout: ['align', 'spaceAfter'],
  horizontalRule: ['spaceAfter'],
  emailHtml: ['spaceAfter'],
  emailColumns: ['spaceAfter'],
};

/** What an attribute reads as while the block does not set it: the house renderer's own default. */
const ATTRIBUTE_DEFAULTS: Readonly<Record<EmailBlockAttribute, EmailBlockAttributeValue>> = {
  align: 'left',
  spaceAfter: 'medium',
  tone: 'default',
  width: 'inline',
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
  'html',
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

/** The email profile's own slash items; the document's features offer the rest. */
const OWN_SLASH_ITEMS: Partial<Record<EmailBlockKind, SlashItem>> = {
  paragraph: paragraphSlashItem,
  button: emailButtonSlashItem,
  columns: emailColumnsSlashItem,
  html: emailHtmlSlashItem,
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

const lane = (): NodeJSON => ({ type: 'emailLane', content: [{ type: 'paragraph' }] });

/** What each kind inserts, empty, so the author fills it in place. */
const NEW_BLOCKS: Readonly<Record<Exclude<EmailBlockKind, 'paragraph'>, () => NodeJSON>> = {
  button: () => ({ type: 'emailButton' }),
  code: () => ({ type: 'codeBlock', attrs: { language: 'text', code: '' } }),
  list: () => ({ type: 'bulletList', content: [{ type: 'listItem', content: [{ type: 'paragraph' }] }] }),
  callout: () => ({ type: 'callout', attrs: { variant: 'info' }, content: [{ type: 'paragraph' }] }),
  divider: () => ({ type: 'horizontalRule' }),
  columns: () => ({ type: 'emailColumns', attrs: { ratio: [1, 1] }, content: [lane(), lane()] }),
  html: () => ({ type: 'emailHtml' }),
};

export interface EmailKitOptions extends BlockIdentityOptions {
  /** The declarations the chips and the link popover read; the profile's own when absent. A getter, so a host changes them live. */
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
    const laneType = engine.state.schema.nodes.emailLane;
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
 */
function assertEmailCodecs(extra: readonly EditorFeature[]): void {
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

const dataAttribute = (attribute: string) => ({
  default: null,
  parseHTML: (element: HTMLElement) => element.getAttribute(`data-${DATA_NAMES[attribute]}`),
  renderHTML: (attrs: Record<string, unknown>) =>
    attrs[attribute] ? { [`data-${DATA_NAMES[attribute]}`]: attrs[attribute] } : {},
});

// The stored text an import keeps beside the nodes; a copy must not carry it to another block.
const sourceAttribute = { default: null, rendered: false, keepOnSplit: false, parseHTML: () => null };

/** The attributes each document node carries for the email, as global attributes on the document's own nodes. */
function emailGlobalAttributes() {
  return Object.entries(EMAIL_GLOBAL_ATTRIBUTES).map(([type, names]) => ({
    types: [type],
    attributes: Object.fromEntries(
      names.map((name) => [name, name === 'source' ? sourceAttribute : dataAttribute(name)]),
    ),
  }));
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
    addProseMirrorPlugins: () => [admittedBlocks(context.admitted, carried), heldMarks(EMAIL_MARKS)],
  });
}

/**
 * The email profile's features: the Document Editor's own blocks, frame and block menu (`standardKit`, the
 * callout and the code block), and what the document has no block for (the button, the columns and their lanes,
 * the html block, the variable chip and the link to a url variable), with the email attributes on the
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

  const extraBlocks = extra.flatMap((feature) =>
    (feature.nodes ?? []).filter((node) => inGroup(node, 'block')).map((node) => node.name),
  );
  // Every kind but columns, whatever the profile allows, so a stored lane opens; adding is narrowed below.
  const laneContent = `(${[
    ...EMAIL_KINDS.filter((kind) => kind !== 'columns').map((kind) => EMAIL_KIND_NODES[kind]),
    ...Object.keys(FOLDED_BLOCKS),
    'emailUnknown',
    ...extraBlocks,
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
  };
  const rules = [
    'zeroxEditorBehavior',
    'variableEngine',
    'bold',
    'italic',
    ...(kinds.includes('list') ? ['bulletList'] : []),
    ...(kinds.includes('divider') ? ['horizontalRule'] : []),
  ];

  const insertable = (editor: IEditor, kind: EmailBlockKind): boolean => {
    const found = contextOf(editor);
    if (!found || locked() || !kinds.includes(kind)) return false;
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
    if (!found || !block || block.node.type.name !== 'emailButton' || locked()) return undefined;
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

  const blocks = defineFeature({
    id: 'emailBlocks',
    nodes: [emailButtonNode(), ...emailColumnsNodes(laneContent), emailHtmlNode(), emailUnknownNode()],
    commands: {
      insertEmailBlock: {
        args: z.object({ kind: z.enum(EMAIL_KINDS as [EmailBlockKind, ...EmailBlockKind[]]) }),
        run: (editor, { kind }: { kind: EmailBlockKind }) => {
          if (!insertable(editor, kind)) return false;
          if (kind === 'paragraph') return editor.run('setParagraph');
          return editor.run('insertContent', { content: NEW_BLOCKS[kind]() });
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
          for (const [name, value] of Object.entries(attrs)) tr.setNodeAttribute(block.pos, name, value);
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
        can: (editor) => linkTarget(editor) !== undefined,
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
    ...standardKit({ placeholder: options.placeholder ?? messages().emptyLine, trailingNode: false }),
    blockMenu: [],
  };

  return [
    standard,
    callout({ variants: ['info'] }),
    codeBlock({ languagePicker: false }),
    blockIdentity({ required: options.required, structure: options.structure, types: extraBlocks }),
    variables.feature,
    emailMarks(),
    blocks,
    defineFeature({
      id: 'emailBlockMenu',
      // Drawn when the menu opens, so the words, the declarations and the block's own lanes are the current ones.
      blockMenu: [
        { id: 'email-block-menu', title: '', command: '', items: (editor) => emailBlockMenuItems(editor, kinds) },
      ],
    }),
    ...extra,
  ];
}

/** The lane shares offered for each lane count up to `maxLanes`, `current` among them when it is none of them. */
function ratioChoices(maxLanes: number, current: readonly number[] | null): number[][] {
  const choices: number[][] = [];
  for (let lanes = 2; lanes <= maxLanes; lanes += 1) {
    choices.push(Array.from({ length: lanes }, () => 1));
    if (lanes === 2) choices.push([2, 1], [1, 2]);
    if (lanes === 3) choices.push([1, 2, 1]);
  }
  if (!current || choices.some((choice) => choice.join(':') === current.join(':'))) return choices;
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
 * Turn into its text kinds, a submenu per attribute the block takes, a button's Link, which opens the link
 * popover on it, the lanes of the columns it is or sits in, and the document's Duplicate and Delete. Each is
 * disabled, with its reason, in locked structure and on a block the host requires; Duplicate also on a block of
 * a kind the profile does not let the author add.
 */
function emailBlockMenuItems(editor: IEditor, kinds: readonly EmailBlockKind[]): BlockMenuItem[] {
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
        ((block.node.attrs[attribute] as string | null | undefined) ?? ATTRIBUTE_DEFAULTS[attribute]) === value,
      disabledReason: own,
    })),
  );

  // Always offered, so a locked button's link can be read; the popover disables its field with the reason.
  const link: BlockMenuItem[] =
    type === 'emailButton' ? [{ id: LINK_ITEM_ID, title: words.link, command: 'editEmailLink' }] : [];

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
        active: () => current?.join(':') === ratio.join(':'),
        disabledReason: () => refusal(context, columns, false),
      }))
    : [];

  const duplicateReason = () => whole() ?? (context.admitted.has(type) ? null : words.kindNotAllowed);
  const documentItem = (id: string, title: string, disabledReason: () => string | null): BlockMenuItem[] =>
    standardBlockMenuItems.filter((item) => item.id === id).map((item) => ({ ...item, title, disabledReason }));

  return [
    ...turnInto,
    ...attributes,
    ...link,
    ...lanes,
    ...documentItem('duplicate', words.duplicate, duplicateReason),
    ...documentItem('delete', words.delete, whole),
  ];
}
