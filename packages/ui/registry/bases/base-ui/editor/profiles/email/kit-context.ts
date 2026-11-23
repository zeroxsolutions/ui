import {
  facadeFor,
  type Editor,
  type EngineHandle,
  type ProseMirrorNode,
} from '@zeroxsolutions/editor-core/document/advanced';
import type { IEditor } from '@zeroxsolutions/editor-core/document/core/index';
import { DEFAULT_PROFILE_MESSAGES, type ProfileEditorMessages } from '../messages';

export type EngineState = Editor['state'];

/** What the kit's commands, views and block menu items read off one editor built from it. */
export interface KitContext {
  locked(): boolean;
  required(): readonly string[];
  maxLanes: number;
  /** The words the kit's views and block menu draw, read each time one renders. */
  messages(): ProfileEditorMessages;
}

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

/** The url variable the selection is linked to, or null when it holds no link. */
export function emailLinkAt(editor: IEditor): string | null {
  const engine = contextOf(editor)?.engine;
  if (!engine) return null;
  const { selection, doc } = engine.state;
  const linkOf = (marks: readonly { type: { name: string }; attrs: Record<string, unknown> }[]) => {
    const link = marks.find((mark) => mark.type.name === 'emailLink');
    return typeof link?.attrs.variable === 'string' ? link.attrs.variable : null;
  };
  if (selection.empty) return linkOf(selection.$from.marks());
  let variable: string | null = null;
  doc.nodesBetween(selection.from, selection.to, (node) => {
    variable ??= node.isInline ? linkOf(node.marks) : null;
    return variable === null;
  });
  return variable;
}
