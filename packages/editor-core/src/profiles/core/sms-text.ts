import type { DocJSON, NodeJSON } from '../../document/core/types/index.js';
import { measureSms, SMS_SEGMENT_UNITS, type SmsEncoding } from '../../template/sms/index.js';
import { VARIABLE_TOKEN } from '../../template/index.js';

/** Units a segment holds once a body spans several: the concatenation header takes 7 of 160 and 3 of 70. */
const CONCATENATED_SEGMENT_UNITS = { gsm7: 153, ucs2: 67 } as const;

function inlineText(node: NodeJSON): string {
  if (node.type === 'variable') return `{{${String(node.attrs?.name ?? '')}}}`;
  if (node.type === 'hardBreak') return '\n';
  return node.text ?? (node.content ?? []).map(inlineText).join('');
}

/** The SMS body `doc` spells: one line per paragraph, a variable node as its `{{name}}` token. */
export function toSmsText(doc: DocJSON): string {
  return (doc.content ?? []).map(inlineText).join('\n');
}

/** The document `body` reads as: one paragraph per line, each `{{name}}` a `variable` node. */
export function fromSmsText(body: string): DocJSON {
  const content = body.split('\n').map((line): NodeJSON => {
    const inline: NodeJSON[] = [];
    let last = 0;
    for (const match of line.matchAll(VARIABLE_TOKEN)) {
      if (match.index > last) inline.push({ type: 'text', text: line.slice(last, match.index) });
      inline.push({ type: 'variable', attrs: { name: match[1] } });
      last = match.index + match[0].length;
    }
    if (last < line.length) inline.push({ type: 'text', text: line.slice(last) });
    return inline.length === 0 ? { type: 'paragraph' } : { type: 'paragraph', content: inline };
  });
  return { type: 'doc', content };
}

/**
 * What `body` costs a carrier, tokens counted as their literal text. `limit` is one segment's units in the
 * body's encoding; `segments` is how many a carrier sends, reading a longer body at the concatenated size.
 */
export function measureSmsBody(body: string): {
  units: number;
  limit: number;
  encoding: SmsEncoding;
  segments: number;
} {
  const { units, encoding } = measureSms(body);
  const limit = SMS_SEGMENT_UNITS[encoding];
  const segments = units <= limit ? 1 : Math.ceil(units / CONCATENATED_SEGMENT_UNITS[encoding]);
  return { units, limit, encoding, segments };
}

/** The offset of the first `{{` or `}}` left once every valid token is taken out, or -1 when none is. */
export function strayBraceOffset(body: string): number {
  const blanked = body.replace(VARIABLE_TOKEN, (token) => ' '.repeat(token.length));
  const open = blanked.indexOf('{{');
  const close = blanked.indexOf('}}');
  return open === -1 ? close : close === -1 ? open : Math.min(open, close);
}
