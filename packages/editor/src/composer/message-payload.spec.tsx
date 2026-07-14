import { describe, expect, it } from 'vitest';
import type { DocJSON, NodeJSON } from '../document/core/index.js';
import {
  docToPayload,
  docToSegments,
  segmentsToDoc,
} from './message-payload.js';
import { segmentsToText } from './composer-types.js';

/** The single-paragraph composer document with the given inline nodes. */
const para = (...inline: NodeJSON[]): DocJSON => ({
  type: 'doc',
  content: [{ type: 'paragraph', content: inline }],
});

describe('docToSegments', () => {
  it('reads ordered text and mention segments from the single block', () => {
    const doc = para(
      { type: 'text', text: 'a portrait of ' },
      { type: 'mention', attrs: { id: 'u1', label: 'Ada' } },
    );
    expect(docToSegments(doc)).toEqual([
      { text: 'a portrait of ' },
      { mention: { id: 'u1', label: 'Ada' } },
    ]);
  });

  it('reads a leading command node as a command segment', () => {
    const doc = para(
      { type: 'command', attrs: { id: 'image', label: 'Image', name: 'image-gen' } },
      { type: 'text', text: 'a portrait' },
    );
    expect(docToSegments(doc)).toEqual([
      { command: { id: 'image', label: 'Image', name: 'image-gen' } },
      { text: 'a portrait' },
    ]);
  });

  it('coalesces adjacent text runs and maps a hard break to a newline', () => {
    const doc = para(
      { type: 'text', text: 'hi ' },
      { type: 'text', text: 'there' },
      { type: 'hardBreak' },
      { type: 'text', text: 'again' },
    );
    expect(docToSegments(doc)).toEqual([{ text: 'hi there\nagain' }]);
  });

  it('returns no segments for an empty block', () => {
    expect(docToSegments(para())).toEqual([]);
  });
});

describe('docToPayload', () => {
  it('derives the leading command, de-duped mentions, and positional segments', () => {
    const doc = para(
      { type: 'command', attrs: { id: 'image', label: 'Image', name: 'image-gen' } },
      { type: 'text', text: 'a portrait of ' },
      { type: 'mention', attrs: { id: 'u1', label: 'Ada' } },
      { type: 'text', text: ' and ' },
      { type: 'mention', attrs: { id: 'u1', label: 'Ada' } },
    );
    expect(docToPayload(doc)).toEqual({
      command: { id: 'image', label: 'Image', name: 'image-gen' },
      mentions: [{ id: 'u1', label: 'Ada' }],
      segments: [
        { command: { id: 'image', label: 'Image', name: 'image-gen' } },
        { text: 'a portrait of ' },
        { mention: { id: 'u1', label: 'Ada' } },
        { text: ' and ' },
        { mention: { id: 'u1', label: 'Ada' } },
      ],
    });
  });

  it('emits a null command when the line carries none', () => {
    const doc = para({ type: 'text', text: 'hello' });
    const payload = docToPayload(doc);
    expect(payload.command).toBeNull();
    expect(payload.segments).toEqual([{ text: 'hello' }]);
    expect(payload.mentions).toEqual([]);
  });
});

describe('segmentsToDoc round-trips with docToSegments', () => {
  it('rebuilds the same single-block doc from segments (view <- input)', () => {
    const segments = [
      { command: { id: 'image', label: 'Image', name: 'image-gen' } },
      { text: 'a portrait of ' },
      { mention: { id: 'u1', label: 'Ada' } },
    ];
    const doc = segmentsToDoc(segments);
    expect(doc.content?.[0]?.type).toBe('paragraph');
    // The view's doc, read back, is the exact segments the input produced.
    expect(docToSegments(doc)).toEqual(segments);
    expect(segmentsToText(docToSegments(doc))).toBe(
      '/image-gen a portrait of @Ada',
    );
  });
});
