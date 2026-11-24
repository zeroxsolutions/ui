import { describe, expect, it } from 'vitest';
import type { DocJSON, NodeJSON } from '../../document/core/types/index.js';
import { docProblems } from './doc-problems.js';
import { fromEmailBlocks } from './email-blocks.js';
import { TRAVEL_DEFAULT_BLOCKS } from './fixtures/travel-defaults.fixture.js';

const para = (text: string): NodeJSON => ({
  type: 'paragraph',
  content: [{ type: 'text', text }],
});
const item = (...content: NodeJSON[]): NodeJSON => ({
  type: 'listItem',
  content,
});
const docOf = (...content: NodeJSON[]): DocJSON => ({ type: 'doc', content });
const keyed = (node: NodeJSON, id: string | null = null): NodeJSON => ({
  ...node,
  attrs: { ...node.attrs, id, key: 'k1' },
});

describe('docProblems', () => {
  it.each<[string, NodeJSON]>([
    [
      'a heading',
      {
        type: 'heading',
        attrs: { level: 1 },
        content: [{ type: 'text', text: 'Hi' }],
      },
    ],
    ['an orderedList', { type: 'orderedList', content: [item(para('a'))] }],
    [
      'a taskList',
      {
        type: 'taskList',
        content: [{ type: 'taskItem', content: [para('a')] }],
      },
    ],
    ['a blockquote', { type: 'blockquote', content: [para('a')] }],
    ['a listItem with two paragraphs', { type: 'bulletList', content: [item(para('a'), para('b'))] }],
    [
      'a nested list',
      {
        type: 'bulletList',
        content: [item(para('a'), { type: 'bulletList', content: [item(para('b'))] })],
      },
    ],
    [
      'a callout with two paragraphs',
      {
        type: 'callout',
        attrs: { variant: 'info' },
        content: [para('a'), para('b')],
      },
    ],
  ])('flags %s as not carried', (_, node) => {
    expect(docProblems(docOf(keyed(node)))).toEqual([{ kind: 'block-not-carried', block: 'k1' }]);
  });

  it('names the block by its id when it has one', () => {
    const quote = keyed({ type: 'blockquote', content: [para('a')] }, 'b1');
    expect(docProblems(docOf(quote))).toEqual([{ kind: 'block-not-carried', block: 'b1' }]);
  });

  it('flags a block inside a lane', () => {
    const lane: NodeJSON = {
      type: 'column',
      content: [keyed({ type: 'orderedList', content: [item(para('a'))] })],
    };
    const columns = keyed({ type: 'columns', content: [lane] });
    expect(docProblems(docOf(columns)).map((problem) => problem.kind)).toEqual(['block-not-carried']);
  });

  it('flags nothing in a document built from the travel defaults', () => {
    expect(docProblems(fromEmailBlocks(TRAVEL_DEFAULT_BLOCKS))).toEqual([]);
  });
});
