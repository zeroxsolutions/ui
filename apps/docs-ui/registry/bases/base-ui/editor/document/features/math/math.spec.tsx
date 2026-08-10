import katex from 'katex';
import { afterEach, describe, expect, it } from 'vitest';
import { createEditor } from '@zeroxsolutions/editor-core/document/core/index';
import type { DocJSON, IEditor } from '@zeroxsolutions/editor-core/document/core/index';
import {
  createCodecRegistry,
  importHTML,
  serialize,
} from '@zeroxsolutions/editor-core/document/serialize/index';
import { standardKit } from '../standard/index.js';
import { math } from './math.js';

const editors: IEditor[] = [];
function build(content?: DocJSON): IEditor {
  const element = document.createElement('div');
  document.body.append(element);
  const builder = createEditor().use(standardKit()).use(math());
  if (content) builder.content(content);
  const editor = builder.build({ element });
  editors.push(editor);
  return editor;
}
afterEach(() => {
  while (editors.length) editors.pop()?.destroy();
});

// createCodecRegistry seeds the built-in doc/paragraph substrate, so math() alone
// suffices to serialize a paragraph carrying an inline math node.
const registry = createCodecRegistry([math()]);

const LATEX = 'E=mc^2';

const mathBlockDoc = (latex = LATEX): DocJSON => ({
  type: 'doc',
  content: [{ type: 'mathBlock', attrs: { latex } }],
});

const mathInlineDoc = (latex = LATEX): DocJSON => ({
  type: 'doc',
  content: [
    { type: 'paragraph', content: [{ type: 'mathInline', attrs: { latex } }] },
  ],
});

describe('math', () => {
  it('inserts a mathBlock node with the given latex via its command', () => {
    const editor = build();
    expect(editor.run('insertMathBlock', { latex: LATEX })).not.toBe(false);
    const node = editor.getJSON().content?.find((n) => n.type === 'mathBlock');
    expect(node?.type).toBe('mathBlock');
    expect(node?.attrs?.latex).toBe(LATEX);
  });

  it('exports a mathBlock as a $$-delimited markdown block', () => {
    const md = serialize(mathBlockDoc(), 'markdown', registry);
    expect(md).toContain('$$');
    expect(md).toContain(LATEX);
  });

  it('exports inline math as $…$ markdown', () => {
    const md = serialize(mathInlineDoc(), 'markdown', registry);
    expect(md).toContain(`$${LATEX}$`);
  });

  it('exports HTML carrying data-math-* markers and a data-latex attribute', () => {
    const blockHtml = serialize(mathBlockDoc(), 'html', registry);
    expect(blockHtml).toContain('data-math-block');
    expect(blockHtml).toContain(`data-latex="${LATEX}"`);

    const inlineHtml = serialize(mathInlineDoc(), 'html', registry);
    expect(inlineHtml).toContain('data-math-inline');
    expect(inlineHtml).toContain(`data-latex="${LATEX}"`);
  });

  it('preserves the latex through an HTML export → import round-trip', () => {
    // `importHTML` is exported from serialize/index.ts; the `data-latex`-carrying
    // export is importable and the latex survives the round-trip.
    expect(typeof importHTML).toBe('function');
    const html = serialize(mathBlockDoc(), 'html', registry);
    const result = importHTML(html, registry);
    expect(JSON.stringify(result.doc)).toContain(LATEX);
  });

  it('renders a valid formula with KaTeX without throwing', () => {
    let html = '';
    expect(() => {
      html = katex.renderToString(LATEX, { throwOnError: false });
    }).not.toThrow();
    expect(html).toContain('katex');
  });
});
