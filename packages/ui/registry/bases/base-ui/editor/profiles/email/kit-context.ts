import {
  facadeFor,
  type Editor,
  type EngineHandle,
  type ProseMirrorNode,
} from '@zeroxsolutions/editor-core/document/advanced';
import type { IEditor } from '@zeroxsolutions/editor-core/document/core/index';
import type { VariableDeclaration } from '@zeroxsolutions/editor-core/profiles/index';
import { DEFAULT_PROFILE_MESSAGES, type ProfileEditorMessages } from '../messages';
import type { VariableFeature } from '../variables/variable';

export type EngineState = Editor['state'];

/** What the kit's commands, views and block menu items read off one editor built from it. */
export interface KitContext {
  locked(): boolean;
  required(): readonly string[];
  maxLanes: number;
  /** The block types an author may add: the profile's kinds and the host's own blocks. */
  admitted: ReadonlySet<string>;
  /** The declarations a link is chosen from, read each time the block menu opens. */
  declarations(): readonly VariableDeclaration[];
  /** The variable feature of the editor, whose chips a field inside a block draws, so a refresh reaches them. */
  variables: VariableFeature;
  /** The words the kit's views and block menu draw, read each time one renders. */
  messages(): ProfileEditorMessages;
  /** The link popovers listening to this editor, which `editEmailLink` opens. */
  linkListeners: Set<(target: EmailLinkTarget) => void>;
}

/** What the link popover edits: a button's href, or the link on a range of text. */
export type EmailLinkTarget =
  | {
      kind: 'button';
      /** Where the button is. */
      pos: number;
      href: string;
      /** Why the href cannot change, as in locked structure, or null when it can. */
      reason: string | null;
    }
  | {
      kind: 'text';
      /** The text the link covers, or will: the selection, or the whole link the caret is in. */
      from: number;
      to: number;
      /** The href of the link already there, or empty when the text has none or links of several hrefs. */
      href: string;
      /** Whether the text holds a link, which Remove link takes off. */
      linked: boolean;
      reason: null;
    };

// The kit's commands and views receive the facade; this is how they reach the engine and the options behind it.
export const contexts = new Map<Editor, KitContext>();

export function contextOf(editor: IEditor): { engine: Editor; context: KitContext } | undefined {
  for (const [engine, context] of contexts) {
    if (facadeFor(engine as unknown as EngineHandle) === editor) return { engine, context };
  }
  return undefined;
}

/** The words `editor`'s kit draws: its host's, or the English when it was not built from `emailKit`. */
export function messagesOf(editor: IEditor): ProfileEditorMessages {
  return contextOf(editor)?.context.messages() ?? DEFAULT_PROFILE_MESSAGES;
}

export interface Found {
  node: ProseMirrorNode;
  pos: number;
}

export function carriesKey(node: ProseMirrorNode): boolean {
  const attrs = node.type.spec.attrs;
  return attrs !== undefined && 'key' in attrs;
}

/** The innermost node around the selection that `matches`, or the node a node selection picked. */
function nodeAt(state: EngineState, matches: (node: ProseMirrorNode) => boolean): Found | undefined {
  const picked = (state.selection as { node?: ProseMirrorNode }).node;
  if (picked && matches(picked)) return { node: picked, pos: state.selection.from };
  const { $from } = state.selection;
  for (let depth = $from.depth; depth > 0; depth -= 1) {
    const node = $from.node(depth);
    if (matches(node)) return { node, pos: $from.before(depth) };
  }
  return undefined;
}

export const blockAt = (state: EngineState) => nodeAt(state, carriesKey);
export const columnsAt = (state: EngineState) => nodeAt(state, (node) => node.type.name === 'emailColumns');
export const laneAt = (state: EngineState) => nodeAt(state, (node) => node.type.name === 'emailLane');

/**
 * Selects the block whose view holds `element`. A field inside a block's view takes the focus without moving
 * the editor's selection, so Mod-/ would otherwise open the block menu on whatever block the caret last sat in.
 * The editor does not own the focus then, so the selection changes without taking the focus from the field.
 */
export function selectBlockOf(editor: IEditor, element: Element): boolean {
  const engine = contextOf(editor)?.engine;
  if (!engine) return false;
  let found: number | undefined;
  engine.state.doc.descendants((node, pos) => {
    if (carriesKey(node) && engine.view.nodeDOM(pos)?.contains(element)) found = pos;
    return true;
  });
  if (found === undefined) return false;
  const picked = (engine.state.selection as { node?: ProseMirrorNode }).node;
  if (picked && engine.state.selection.from === found) return true;
  return engine.chain().setNodeSelection(found).run();
}

/** The href of the link the selection is in, or null when it holds none or links of several hrefs. */
export function emailLinkAt(editor: IEditor): string | null {
  const engine = contextOf(editor)?.engine;
  const hrefs = engine ? linksIn(engine.state) : [];
  return hrefs.length === 1 ? hrefs[0] : null;
}

function hrefOf(marks: readonly { type: { name: string }; attrs: Record<string, unknown> }[]): string | null {
  const link = marks.find((mark) => mark.type.name === 'emailLink');
  return typeof link?.attrs.href === 'string' ? link.attrs.href : null;
}

/** The hrefs of the links the selection is in or holds, each once. */
function linksIn(state: EngineState): string[] {
  const { selection, doc } = state;
  if (selection.empty) {
    const href = hrefOf(selection.$from.marks());
    return href === null ? [] : [href];
  }
  const hrefs = new Set<string>();
  doc.nodesBetween(selection.from, selection.to, (node) => {
    const href = node.isInline ? hrefOf(node.marks) : null;
    if (href !== null) hrefs.add(href);
    return true;
  });
  return [...hrefs];
}

/**
 * What a link popover opened on the selection now edits: the button a node selection picked, or the selected
 * text, each end widened to the whole link it cuts into, and a caret to the link it is in. Undefined where
 * there is nothing to link: a caret outside a link, or text that takes no mark, such as a code block's.
 * Text holding links of several hrefs shows no href; setting one links the whole of it.
 */
export function emailLinkTarget(engine: Editor, reason: (button: Found) => string | null): EmailLinkTarget | undefined {
  const { state } = engine;
  const picked = (state.selection as { node?: ProseMirrorNode }).node;
  if (picked) {
    if (picked.type.name !== 'emailButton') return undefined;
    const button = { node: picked, pos: state.selection.from };
    return { kind: 'button', pos: button.pos, href: String(picked.attrs.href ?? ''), reason: reason(button) };
  }
  const link = state.schema.marks.emailLink;
  const { $from, empty, from, to } = state.selection;
  if (!link || !$from.parent.type.allowsMarkType(link)) return undefined;
  const hrefs = linksIn(state);
  if (empty && hrefs.length === 0) return undefined;
  const runs = linkRuns(state, from);
  const start =
    runs.find((run) => run.from <= from && from < run.to) ?? (empty ? runs.find((run) => run.to === from) : undefined);
  const end =
    runs.find((run) => run.from < to && to <= run.to) ?? (empty ? runs.find((run) => run.from === to) : undefined);
  return {
    kind: 'text',
    from: Math.min(from, start?.from ?? from),
    to: Math.max(to, end?.to ?? to),
    href: hrefs.length === 1 ? hrefs[0] : '',
    linked: hrefs.length > 0,
    reason: null,
  };
}

/** The runs of linked text in the block around `pos`: each stretch of one href, where it starts and ends. */
function linkRuns(state: EngineState, pos: number): { from: number; to: number }[] {
  const $pos = state.doc.resolve(pos);
  const base = $pos.start();
  const runs: { from: number; to: number; href: string }[] = [];
  $pos.parent.forEach((child, offset) => {
    const href = hrefOf(child.marks);
    if (href === null) return;
    const from = base + offset;
    const last = runs[runs.length - 1];
    if (last && last.href === href && last.to === from) last.to = from + child.nodeSize;
    else runs.push({ from, to: from + child.nodeSize, href });
  });
  return runs;
}

/** Whether a link popover is listening to `editor`, so `editEmailLink` has one to open. */
export function hasEmailLinkPopover(editor: IEditor): boolean {
  return (contextOf(editor)?.context.linkListeners.size ?? 0) > 0;
}

/** Tells the link popovers listening to `editor` to open on `target`; false when none is listening. */
export function requestEmailLink(editor: IEditor, target: EmailLinkTarget): boolean {
  if (!hasEmailLinkPopover(editor)) return false;
  for (const listener of contextOf(editor)?.context.linkListeners ?? []) listener(target);
  return true;
}

/** Calls `listener` each time `editor`'s `editEmailLink` opens a link popover; returns the unsubscribe. */
export function onEmailLinkRequest(editor: IEditor, listener: (target: EmailLinkTarget) => void): () => void {
  const listeners = contextOf(editor)?.context.linkListeners;
  listeners?.add(listener);
  return () => {
    listeners?.delete(listener);
  };
}
