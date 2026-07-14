import type { DocJSON, NodeJSON } from '../document/core/index.js';
import type {
  ChatCommandRef,
  ChatMention,
  ChatMessagePayload,
  ChatSegment,
} from './composer-types.js';

/**
 * The **one** mapping between the composer's single-block document JSON and the
 * structured message payload — the shared codec both surfaces ride so the pills
 * and text placement cannot drift. `ChatInput` reads its content forward
 * (`docToPayload`) on submit; `ChatMessageView` renders a stored payload back
 * (`segmentsToDoc`) through the same `mention` / `command` codecs. Pure and
 * engine-free — it touches only the canonical JSON shape (see
 * `contract-derive-schema` in spirit: derive the wire shape from the one
 * document, never re-declare it per surface).
 */

/** The inline content of the composer's single paragraph (empty when absent). */
function inlineNodes(doc: DocJSON): NodeJSON[] {
  return doc.content?.[0]?.content ?? [];
}

/**
 * The ordered text / mention / command segments of a composer document. Adjacent
 * text runs coalesce and a `hardBreak` (from `Shift+Enter`) becomes a `\n`, so
 * the segments are the minimal positional record a reader needs to place each
 * pill. A `command` node (only ever the leading inline node) becomes a leading
 * command segment.
 */
export function docToSegments(doc: DocJSON): ChatSegment[] {
  const segments: ChatSegment[] = [];
  const pushText = (text: string) => {
    if (!text) return;
    const last = segments[segments.length - 1];
    if (last && 'text' in last) last.text += text;
    else segments.push({ text });
  };
  for (const node of inlineNodes(doc)) {
    if (node.type === 'text') pushText(node.text ?? '');
    else if (node.type === 'hardBreak') pushText('\n');
    else if (node.type === 'mention') {
      const attrs = node.attrs as { id?: string; label?: string } | undefined;
      segments.push({
        mention: { id: attrs?.id ?? '', label: attrs?.label ?? '' },
      });
    } else if (node.type === 'command') {
      const attrs = node.attrs as
        | { id?: string; label?: string; name?: string }
        | undefined;
      segments.push({
        command: {
          id: attrs?.id ?? '',
          label: attrs?.label ?? '',
          name: attrs?.name ?? '',
        },
      });
    }
  }
  return segments;
}

/** The resolved mentions in first-seen order, de-duplicated by `id`. */
export function dedupeMentions(segments: ChatSegment[]): ChatMention[] {
  const seen = new Set<string>();
  const mentions: ChatMention[] = [];
  for (const segment of segments) {
    if ('mention' in segment && !seen.has(segment.mention.id)) {
      seen.add(segment.mention.id);
      mentions.push(segment.mention);
    }
  }
  return mentions;
}

/** The leading command of a message, or `null` — the first `command` segment. */
export function leadingCommand(segments: ChatSegment[]): ChatCommandRef | null {
  for (const segment of segments) {
    if ('command' in segment) return segment.command;
  }
  return null;
}

/** Build the submit payload from the composer document alone — the command is an
 *  inline node in the document now, not surface state. */
export function docToPayload(doc: DocJSON): ChatMessagePayload {
  const segments = docToSegments(doc);
  return {
    command: leadingCommand(segments),
    mentions: dedupeMentions(segments),
    segments,
  };
}

/** The inverse — a single-block composer document rebuilt from stored segments,
 *  so `ChatMessageView` renders it through the same `mention` / `command` codecs
 *  the input uses. A `\n` inside a text run becomes a `hardBreak` between text
 *  nodes. */
export function segmentsToDoc(segments: ChatSegment[]): DocJSON {
  const inline: NodeJSON[] = [];
  for (const segment of segments) {
    if ('mention' in segment) {
      inline.push({ type: 'mention', attrs: { ...segment.mention } });
      continue;
    }
    if ('command' in segment) {
      inline.push({ type: 'command', attrs: { ...segment.command } });
      continue;
    }
    const parts = segment.text.split('\n');
    parts.forEach((part, index) => {
      if (index > 0) inline.push({ type: 'hardBreak' });
      if (part) inline.push({ type: 'text', text: part });
    });
  }
  return { type: 'doc', content: [{ type: 'paragraph', content: inline }] };
}
