import { afterEach, describe, expect, it } from 'vitest';
import { createDocumentEditor } from './create-document-editor.js';
import type { IEditor, TriggerBoundary } from './types/index.js';

const mounted: IEditor[] = [];
afterEach(() => {
  for (const editor of mounted.splice(0)) editor.destroy();
});

/** The trigger query with the caret at the end of a paragraph reading `text`. */
function queryAtEnd(text: string, char: string, boundary?: TriggerBoundary) {
  const element = document.createElement('div');
  document.body.append(element);
  const editor = createDocumentEditor({
    content: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text }] }] },
    element,
  });
  mounted.push(editor);
  editor.focus('end');
  return editor.triggerQuery(char, boundary ? { boundary } : undefined);
}

describe('triggerQuery', () => {
  it('opens only after whitespace or at the block start by default', () => {
    expect(queryAtEnd('Hi @al', '@')).toEqual({ query: 'al', from: 4, to: 7 });
    expect(queryAtEnd('mail@al', '@')).toBeNull();
  });

  it('opens a two-character trigger after anything under the any boundary', () => {
    expect(queryAtEnd('Code:{{co', '{{', 'any')).toEqual({ query: 'co', from: 6, to: 10 });
    expect(queryAtEnd('Code:{{co', '{{')).toBeNull();
  });

  it('queries from the last occurrence of the char under the any boundary', () => {
    expect(queryAtEnd('{{a}}{{b', '{{', 'any')).toEqual({ query: 'b', from: 6, to: 9 });
  });
});
