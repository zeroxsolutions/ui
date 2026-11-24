import { describe, expect, it } from 'vitest';
import { createCodecRegistry } from './create-codec-registry.js';
import { serialize } from './serialize-to-string.js';

describe('serialize', () => {
  it('writes text as text in HTML, so an author cannot write markup into the export', () => {
    const doc = {
      type: 'doc',
      content: [{ type: 'paragraph', content: [{ type: 'text', text: '<b onclick="x">&</b>' }] }],
    };
    expect(serialize(doc, 'html', createCodecRegistry())).toBe('<p>&lt;b onclick=&quot;x&quot;&gt;&amp;&lt;/b&gt;</p>');
    expect(serialize(doc, 'markdown', createCodecRegistry())).toBe('<b onclick="x">&</b>');
  });
});
