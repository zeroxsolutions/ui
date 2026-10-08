import type { DocJSON, NodeJSON } from '../document/core/index.js';
import type { TriggerToken } from './triggers/trigger-token.js';
import type { ChatMessagePayload, ComposerTokens } from './composer-types.js';

/**
 * The one mapping from the composer's single-block document to the structured
 * submit payload - registry-driven, so a new trigger needs no edit here. It
 * walks the document's inline nodes once and, for every node matching a
 * registered token's node type, buckets `token.readRef(attrs)` under the token's
 * `kind`; the buckets are typed from `ComposerTokenRegistry`. Pure and
 * engine-free (it touches only the canonical JSON), so the input reads it forward
 * on submit and the view renders the carried `doc` back through the same codecs.
 */

/** The inline content of the composer's single paragraph (empty when absent). */
function inlineNodes(doc: DocJSON): NodeJSON[] {
  return doc.content?.[0]?.content ?? [];
}

/** The literal text a committed token contributes to the flattened line - the
 *  char plus the field the token reads its query against (slug or label). */
function tokenText(token: TriggerToken, attrs: Record<string, unknown>): string {
  const value = token.queryField === 'slug' ? (attrs.slug ?? attrs.id ?? '') : (attrs.label ?? attrs.id ?? '');
  return `${token.char}${String(value)}`;
}

/**
 * Build the submit payload from the composer document and the registered tokens.
 * The document is the positional source of truth (carried as `doc`); `text` is
 * the flattened line; `tokens` groups the committed refs by kind. A leading
 * `one-leading` token (a `/command`) is followed by a space in the flat text
 * when more content follows, since the document keeps no literal space there.
 */
export function docToPayload(doc: DocJSON, tokens: readonly TriggerToken[]): ChatMessagePayload {
  const byNode = new Map(tokens.map((token) => [token.nodeName, token]));
  const buckets: Partial<Record<string, unknown[]>> = {};
  for (const token of tokens) buckets[token.kind] = [];

  const nodes = inlineNodes(doc);
  let text = '';
  nodes.forEach((node, index) => {
    if (node.type === 'text') {
      text += node.text ?? '';
      return;
    }
    if (node.type === 'hardBreak') {
      text += '\n';
      return;
    }
    const token = byNode.get(node.type);
    if (!token) return;
    const attrs = node.attrs ?? {};
    buckets[token.kind]?.push(token.readRef(attrs));
    text += tokenText(token, attrs);
    if (token.multiplicity === 'one-leading' && index < nodes.length - 1) {
      text += ' ';
    }
  });

  return { text, tokens: buckets as Partial<ComposerTokens>, doc };
}
