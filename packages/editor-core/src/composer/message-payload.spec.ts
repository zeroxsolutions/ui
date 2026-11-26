import { describe, expect, it } from 'vitest';
import type { DocJSON, NodeJSON } from '../document/core/index.js';
import { docToPayload } from './message-payload.js';
import { invocationToken, referenceToken } from './triggers/trigger-token.js';

const command = invocationToken('command', '/', {
  nodeName: 'command',
  source: () => [],
  insert: () => undefined,
  readRef: (attrs) => ({ id: String(attrs.id ?? ''), name: String(attrs.slug ?? '') }),
});
const mention = referenceToken('mention', '@', {
  nodeName: 'mention',
  source: () => [],
  insert: () => undefined,
  readRef: (attrs) => ({ id: String(attrs.id ?? ''), label: String(attrs.label ?? '') }),
});
const channel = referenceToken('channel', '#', {
  nodeName: 'channel',
  source: () => [],
  insert: () => undefined,
  readRef: (attrs) => ({ id: String(attrs.id ?? ''), label: String(attrs.label ?? '') }),
});
const tokens = [command, mention];

/** The single-paragraph composer document holding `inline`. */
const para = (...inline: NodeJSON[]): DocJSON => ({ type: 'doc', content: [{ type: 'paragraph', content: inline }] });

const imageGen: NodeJSON = { type: 'command', attrs: { id: 'image', label: 'Image', slug: 'image-gen' } };
const ada: NodeJSON = { type: 'mention', attrs: { id: 'u1', label: 'Ada' } };

describe('docToPayload', () => {
  it('buckets the committed tokens by kind, read through each token, in document order', () => {
    const payload = docToPayload(
      para(
        imageGen,
        { type: 'text', text: 'of ' },
        ada,
        { type: 'text', text: ' and ' },
        {
          type: 'mention',
          attrs: { id: 'u2', label: 'Bo' },
        },
      ),
      tokens,
    );
    expect(payload.tokens).toEqual({
      command: [{ id: 'image', name: 'image-gen' }],
      mention: [
        { id: 'u1', label: 'Ada' },
        { id: 'u2', label: 'Bo' },
      ],
    });
  });

  it('flattens to text, spacing a leading command from what follows it', () => {
    expect(docToPayload(para(imageGen, { type: 'text', text: 'a portrait of ' }, ada), tokens).text).toBe(
      '/image-gen a portrait of @Ada',
    );
  });

  it('writes no space after a command nothing follows', () => {
    expect(docToPayload(para(imageGen), tokens).text).toBe('/image-gen');
  });

  it('opens an empty bucket for every registered kind none of the document uses', () => {
    expect(docToPayload(para({ type: 'text', text: 'hello' }), tokens)).toMatchObject({
      text: 'hello',
      tokens: { command: [], mention: [] },
    });
  });

  it('buckets and flattens a token registered later, with no change to the mapping', () => {
    const payload = docToPayload(
      para({ type: 'text', text: 'ship it in ' }, { type: 'channel', attrs: { id: 'c1', label: 'general' } }),
      [...tokens, channel],
    );
    expect(payload.tokens.channel).toEqual([{ id: 'c1', label: 'general' }]);
    expect(payload.text).toBe('ship it in #general');
  });

  it('writes a hard break as a newline', () => {
    expect(
      docToPayload(para({ type: 'text', text: 'hi' }, { type: 'hardBreak' }, { type: 'text', text: 'again' }), tokens)
        .text,
    ).toBe('hi\nagain');
  });

  it('leaves out an inline node no registered token reads', () => {
    expect(docToPayload(para({ type: 'text', text: 'a' }, { type: 'emoji' }), tokens).text).toBe('a');
  });
});
