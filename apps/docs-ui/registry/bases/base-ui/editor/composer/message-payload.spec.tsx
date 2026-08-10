import { describe, expect, it } from 'vitest';
import type { DocJSON, NodeJSON } from '@zeroxsolutions/editor-core/document/core/index';
import { docToPayload } from '@zeroxsolutions/editor-core/composer/message-payload';
import {
  channelTrigger,
  commandTrigger,
  mentionTrigger,
} from './composer-triggers.js';

// The registry the payload derives from - the shipped mention + command tokens.
const tokens = [mentionTrigger().token, commandTrigger().token];

/** The single-paragraph composer document with the given inline nodes. */
const para = (...inline: NodeJSON[]): DocJSON => ({
  type: 'doc',
  content: [{ type: 'paragraph', content: inline }],
});

describe('docToPayload', () => {
  it('buckets committed tokens by kind, typed, in document order', () => {
    const doc = para(
      { type: 'command', attrs: { id: 'image', label: 'Image', slug: 'image-gen' } },
      { type: 'text', text: 'a portrait of ' },
      { type: 'mention', attrs: { id: 'u1', label: 'Ada' } },
      { type: 'text', text: ' and ' },
      { type: 'mention', attrs: { id: 'u2', label: 'Bo' } },
    );
    const payload = docToPayload(doc, tokens);
    expect(payload.tokens.command).toEqual([
      { id: 'image', label: 'Image', name: 'image-gen' },
    ]);
    expect(payload.tokens.mention).toEqual([
      { id: 'u1', label: 'Ada' },
      { id: 'u2', label: 'Bo' },
    ]);
    // The typed field is reachable (a rename of ChatCommandRef.name breaks this).
    expect(payload.tokens.command?.[0]?.name).toBe('image-gen');
  });

  it('flattens to text - a leading command is spaced from its argument', () => {
    const doc = para(
      { type: 'command', attrs: { id: 'image', label: 'Image', slug: 'image-gen' } },
      { type: 'text', text: 'a portrait of ' },
      { type: 'mention', attrs: { id: 'u1', label: 'Ada' } },
    );
    expect(docToPayload(doc, tokens).text).toBe('/image-gen a portrait of @Ada');
  });

  it('carries the document through as the positional source of truth', () => {
    const doc = para({ type: 'text', text: 'hello' });
    expect(docToPayload(doc, tokens).doc).toBe(doc);
  });

  it('initialises every registered kind to an empty bucket when none are used', () => {
    const payload = docToPayload(para({ type: 'text', text: 'hello' }), tokens);
    expect(payload.text).toBe('hello');
    expect(payload.tokens.command).toEqual([]);
    expect(payload.tokens.mention).toEqual([]);
  });

  it('buckets a newly registered trigger with no change to this mapping', () => {
    // The generalisation proof: #channel is registered as one token; docToPayload
    // is not touched, yet its refs bucket and flatten correctly.
    const withChannel = [...tokens, channelTrigger().token];
    const doc = para(
      { type: 'text', text: 'ship it in ' },
      { type: 'channel', attrs: { id: 'c1', label: 'general', slug: 'c1' } },
      { type: 'text', text: ' with ' },
      { type: 'mention', attrs: { id: 'u1', label: 'Ada' } },
    );
    const payload = docToPayload(doc, withChannel);
    expect(payload.tokens.channel).toEqual([{ id: 'c1', label: 'general' }]);
    expect(payload.tokens.mention).toEqual([{ id: 'u1', label: 'Ada' }]);
    expect(payload.text).toBe('ship it in #general with @Ada');
  });

  it('maps a hard break to a newline and coalesces text', () => {
    const doc = para(
      { type: 'text', text: 'hi ' },
      { type: 'text', text: 'there' },
      { type: 'hardBreak' },
      { type: 'text', text: 'again' },
    );
    expect(docToPayload(doc, tokens).text).toBe('hi there\nagain');
  });
});
