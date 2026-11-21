import { Dropcursor, Gapcursor, Placeholder, UndoRedo } from '@tiptap/extensions';
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
  type EditorFeature,
  type IEditor,
  type NodeJSON,
  type SlashItem,
} from '@zeroxsolutions/editor-core/document/core/index';
import {
  blockIdentity,
  EMAIL_KINDS,
  type BlockIdentityOptions,
  type EditorProfile,
  type EmailBlockKind,
  type VariableDeclaration,
} from '@zeroxsolutions/editor-core/profiles/index';
import { variableFeature, type VariableFeature } from '../variables/variable';
import {
  blockAt,
  columnsAt,
  contexts,
  contextOf,
  emailLinkAt,
  laneAt,
  type EngineState,
  type Found,
  type KitContext,
} from './kit-context';
import { emailMarks } from './marks';
import { emailButtonNode, emailButtonSlashItem } from './nodes/button';
import { emailCalloutNode, emailCalloutSlashItem } from './nodes/callout';
import { emailCodeNode, emailCodeSlashItem } from './nodes/code';
import { emailColumnsNodes, emailColumnsSlashItem } from './nodes/columns';
import { emailDividerNode, emailDividerSlashItem } from './nodes/divider';
import { emailHtmlNode, emailHtmlSlashItem } from './nodes/html';
import { emailListNodes, emailListSlashItem } from './nodes/list';
import { emailUnknownNode } from './nodes/unknown';

/** The node each email kind is. */
export const EMAIL_KIND_NODES: Readonly<Record<EmailBlockKind, string>> = {
  paragraph: 'paragraph',
  button: 'emailButton',
  code: 'emailCode',
  list: 'emailList',
  callout: 'emailCallout',
  divider: 'emailDivider',
  columns: 'emailColumns',
  html: 'emailHtml',
};

const ALIGNS = ['left', 'center', 'right'] as const;
const SPACES = ['small', 'medium', 'large'] as const;

/** The attributes the block menu sets on each block node, and the values each takes. */
export const EMAIL_BLOCK_ATTRIBUTES: Readonly<Record<string, Readonly<Record<string, readonly string[]>>>> = {
  paragraph: { align: ALIGNS, spaceAfter: SPACES, tone: ['default', 'muted'] },
  emailButton: { align: ALIGNS, spaceAfter: SPACES, width: ['inline', 'full'] },
  emailCode: { align: ALIGNS, spaceAfter: SPACES },
  emailList: { align: ALIGNS, spaceAfter: SPACES },
  emailCallout: { align: ALIGNS, spaceAfter: SPACES },
  emailDivider: { spaceAfter: SPACES },
  emailHtml: { spaceAfter: SPACES },
  emailColumns: { spaceAfter: SPACES },
};

const paragraphSlashItem: SlashItem = {
  id: 'email-paragraph',
  title: 'Text',
  description: 'A paragraph of text',
  icon: TextAlignStartIcon,
  group: 'Email',
  keywords: ['text', 'paragraph'],
  command: 'insertEmailBlock',
  args: { kind: 'paragraph' },
};

const SLASH_ITEMS: Readonly<Record<EmailBlockKind, SlashItem>> = {
  paragraph: paragraphSlashItem,
  button: emailButtonSlashItem,
  code: emailCodeSlashItem,
  list: emailListSlashItem,
  callout: emailCalloutSlashItem,
  divider: emailDividerSlashItem,
  columns: emailColumnsSlashItem,
  html: emailHtmlSlashItem,
};

const lane = (): NodeJSON => ({ type: 'emailLane', content: [{ type: 'paragraph' }] });

/** What each kind inserts, empty, so the author fills it in place. */
const NEW_BLOCKS: Readonly<Record<Exclude<EmailBlockKind, 'paragraph'>, () => NodeJSON>> = {
  button: () => ({ type: 'emailButton' }),
  code: () => ({ type: 'emailCode' }),
  list: () => ({ type: 'emailList', content: [{ type: 'emailListItem' }] }),
  callout: () => ({ type: 'emailCallout' }),
  divider: () => ({ type: 'emailDivider' }),
  columns: () => ({ type: 'emailColumns', attrs: { ratio: [1, 1] }, content: [lane(), lane()] }),
  html: () => ({ type: 'emailHtml' }),
};

export interface EmailKitOptions extends BlockIdentityOptions {
  /** The declarations a link picker lists; the profile's own when absent. A getter, so a host changes them live. */
  declarations?: () => readonly VariableDeclaration[];
  /** The variable feature the host also hands its trigger layer; one is built on `declarations` when absent. */
  variables?: VariableFeature;
  /** The hint an empty line shows. */
  placeholder?: string;
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

function validAttributes(type: string, attrs: Record<string, string>): boolean {
  const allowed = EMAIL_BLOCK_ATTRIBUTES[type];
  return (
    allowed !== undefined &&
    Object.entries(attrs).length > 0 &&
    Object.entries(attrs).every(([name, value]) => allowed[name]?.includes(value) === true)
  );
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

/** Enter on the empty last item of a list leaves the list for a new line below it, as a document list does. */
function leaveList(engine: Editor): boolean {
  const { selection } = engine.state;
  const { $from } = selection;
  if (!selection.empty || $from.parent.type.name !== 'emailListItem' || $from.parent.content.size > 0) return false;
  const list = $from.node(-1);
  if (list.childCount < 2 || $from.index(-1) !== list.childCount - 1) return false;
  const item = $from.before();
  const after = $from.before(-1) + list.nodeSize - $from.parent.nodeSize;
  return engine
    .chain()
    .deleteRange({ from: item, to: item + $from.parent.nodeSize })
    .insertContentAt(after, { type: 'paragraph' })
    .setTextSelection(after + 1)
    .run();
}

const dataAttribute = (attribute: string, name: string) => ({
  default: null,
  parseHTML: (element: HTMLElement) => element.getAttribute(`data-${name}`),
  renderHTML: (attrs: Record<string, unknown>) => (attrs[attribute] ? { [`data-${name}`]: attrs[attribute] } : {}),
});

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
 * Refuses a change that adds a block of a type outside `admitted`, such as a pasted or dropped button in a mail
 * layout. A stored one stays, moves and goes, showing its problem; a host's load and an undo pass.
 */
function admittedBlocks(admitted: ReadonlySet<string>): Plugin {
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
      const before = countsOf(state.doc);
      for (const [name, count] of countsOf(tr.doc)) {
        if (count > (before.get(name) ?? 0)) return false;
      }
      return true;
    },
  });
}

/**
 * The engine half: the paragraph's email attributes, the list's way out, the blocks an author may add, and the
 * context the commands read.
 */
function emailEngine(context: KitContext, admitted: ReadonlySet<string>): Extension {
  return Extension.create({
    name: 'emailKit',
    onBeforeCreate() {
      contexts.set(this.editor, context);
    },
    onDestroy() {
      contexts.delete(this.editor);
    },
    addGlobalAttributes: () => [
      {
        types: ['paragraph'],
        attributes: {
          align: dataAttribute('align', 'align'),
          spaceAfter: dataAttribute('spaceAfter', 'space-after'),
          tone: dataAttribute('tone', 'tone'),
          // The stored text an import keeps beside the nodes; a copy must not carry it to another block.
          source: { default: null, rendered: false, keepOnSplit: false, parseHTML: () => null },
        },
      },
    ],
    addKeyboardShortcuts() {
      return { Enter: () => leaveList(this.editor) };
    },
    addProseMirrorPlugins: () => [admittedBlocks(admitted)],
  });
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

/**
 * The email profile's features: block identity, variables, the three marks and the blocks `profile` allows,
 * with the slash items, toolbar and bubble that offer only those. Every email node is in the schema, so a
 * stored block of a kind the profile leaves out still opens and shows its problem; none is offered, and a
 * change that adds one is refused. `extra` joins when each of its block nodes has an email codec, and its blocks
 * carry an id and a key.
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
  const context: KitContext = { locked, required, maxLanes: profile.bounds.lanes };

  const extraBlocks = extra.flatMap((feature) =>
    (feature.nodes ?? []).filter((node) => inGroup(node, 'block')).map((node) => node.name),
  );
  // Every kind but columns, whatever the profile allows, so a stored lane opens; adding is narrowed below.
  const laneContent = `(${[
    ...EMAIL_KINDS.filter((kind) => kind !== 'columns').map((kind) => EMAIL_KIND_NODES[kind]),
    'emailUnknown',
    ...extraBlocks,
  ].join(' | ')})*`;
  const admitted = new Set([...kinds.map((kind) => EMAIL_KIND_NODES[kind]), 'emailUnknown', ...extraBlocks]);

  const insertable = (editor: IEditor, kind: EmailBlockKind): boolean => {
    const found = contextOf(editor);
    if (!found || locked() || !kinds.includes(kind)) return false;
    return kind !== 'columns' || laneAt(found.engine.state) === undefined;
  };

  const blocks = defineFeature({
    id: 'emailBlocks',
    nodes: [
      emailButtonNode(declarations),
      emailCodeNode(),
      ...emailListNodes(),
      emailCalloutNode(),
      emailDividerNode(),
      ...emailColumnsNodes(laneContent),
      emailHtmlNode(),
      emailUnknownNode(),
    ],
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
          const found = contextOf(editor);
          const block = found && blockAt(found.engine.state);
          if (!found || !block || locked() || !validAttributes(block.node.type.name, attrs)) return false;
          const tr = found.engine.state.tr;
          for (const [name, value] of Object.entries(attrs)) tr.setNodeAttribute(block.pos, name, value);
          const before = found.engine.state.doc;
          found.engine.view.dispatch(tr);
          return found.engine.state.doc !== before;
        },
        can: (editor, { attrs }: { attrs: Record<string, string> }) => {
          const found = contextOf(editor);
          const block = found && blockAt(found.engine.state);
          return !!block && !locked() && validAttributes(block.node.type.name, attrs);
        },
      },
      // Here rather than with the marks: a caret inside a link removes the whole link, which needs the engine.
      unsetEmailLink: {
        run: (editor) => {
          const found = contextOf(editor);
          return !!found && found.engine.chain().focus().extendMarkRange('emailLink').unsetMark('emailLink').run();
        },
        can: (editor) => emailLinkAt(editor) !== null,
      },
      setColumnsRatio: {
        args: z.object({ ratio: z.array(z.number().int().min(1).max(12)).min(2) }),
        run: (editor, { ratio }: { ratio: number[] }) => {
          const found = contextOf(editor);
          const columns = found && columnsAt(found.engine.state);
          if (!found || !columns || locked() || ratio.length > profile.bounds.lanes) return false;
          return setRatio(found.engine, columns, ratio);
        },
        can: (editor, { ratio }: { ratio: number[] }) => {
          const found = contextOf(editor);
          return !!found && !!columnsAt(found.engine.state) && !locked() && ratio.length <= profile.bounds.lanes;
        },
      },
    },
    slash: kinds.map((kind) => SLASH_ITEMS[kind]),
    advanced: {
      engineExtensions: [
        emailEngine(context, admitted),
        UndoRedo,
        Dropcursor,
        Gapcursor,
        Placeholder.configure({ includeChildren: true, placeholder: options.placeholder ?? "Type '/' for blocks" }),
      ],
    },
  });

  return [
    blockIdentity({ required: options.required, structure: options.structure, types: extraBlocks }),
    variables.feature,
    emailMarks(),
    blocks,
    ...extra,
  ];
}

/** The block the selection is in, as the block menu reads it. */
export interface EmailBlockState {
  /** The block's node type. */
  type: string;
  attrs: Readonly<Record<string, unknown>>;
  /** The block's element, to place chrome beside it. */
  element: HTMLElement | null;
  /** The columns block the selection is in, or is: its ratio, one share per lane. */
  columns: { ratio: readonly number[] } | null;
  /** The most lanes a columns block may have. */
  maxLanes: number;
  /** Whether the structure is locked, so no attribute changes and no block goes. */
  locked: boolean;
  /** Whether the block, or a block inside it, is one the host requires. */
  required: boolean;
}

/** The block the selection is in, or null when the editor was not built from `emailKit` or holds no selection in a block. */
export function emailBlockAt(editor: IEditor): EmailBlockState | null {
  const found = contextOf(editor);
  if (!found) return null;
  const { engine, context } = found;
  const block = blockAt(engine.state);
  if (!block) return null;
  const columns = columnsAt(engine.state);
  const ratio = columns?.node.attrs.ratio as number[] | null | undefined;
  return {
    type: block.node.type.name,
    attrs: block.node.attrs,
    element: (engine.view.nodeDOM(block.pos) as HTMLElement | null) ?? null,
    columns: columns
      ? { ratio: ratio && ratio.length > 0 ? ratio : Array.from({ length: columns.node.childCount }, () => 1) }
      : null,
    maxLanes: context.maxLanes,
    locked: context.locked(),
    required: holdsRequired(block.node, context.required()),
  };
}
