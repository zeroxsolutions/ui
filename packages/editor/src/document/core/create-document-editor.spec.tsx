import { z } from 'zod';
import { afterEach, describe, expect, it } from 'vitest';
import {
  CommandArgumentError,
  MissingFeatureDependencyError,
  UnknownCommandError,
  createEditor,
  defineFeature,
} from './index.js';
import type { DocJSON, Delta, IEditor } from './index.js';

const bold = defineFeature({
  id: 'bold',
  marks: [{ name: 'bold', htmlTag: 'strong' }],
  commands: {
    toggleBold: { run: (editor) => editor.run('toggleMark', { name: 'bold' }) },
  },
});

const doc = (text: string): DocJSON => ({
  type: 'doc',
  content: [{ type: 'paragraph', content: [{ type: 'text', text }] }],
});

const editors: IEditor[] = [];
const build = (
  configure: (b: ReturnType<typeof createEditor>) => ReturnType<typeof createEditor>,
): IEditor => {
  const element = document.createElement('div');
  document.body.append(element);
  const editor = configure(createEditor()).build({ element });
  editors.push(editor);
  return editor;
};

afterEach(() => {
  while (editors.length) editors.pop()?.destroy();
});

describe('createDocumentEditor', () => {
  it('builds a ready editor exposing content through the façade', () => {
    const editor = build((b) => b.use(bold).content(doc('hello')));
    expect(editor.status).toBe('ready');
    expect(editor.getText()).toBe('hello');
    expect(editor.getJSON().type).toBe('doc');
    expect(editor.hasFeature('bold')).toBe(true);
    expect(editor.hasFeature('nope')).toBe(false);
  });

  it('runs a feature command that composes a built-in primitive', () => {
    const editor = build((b) => b.use(bold).content(doc('hello')));
    editor.run('selectAll');
    expect(editor.run('toggleBold')).toBe(true);
    expect(editor.isActive('bold')).toBe(true);
    const textNode = editor.getJSON().content?.[0]?.content?.[0];
    expect(textNode?.marks?.some((m) => m.type === 'bold')).toBe(true);
  });

  it('emits a step-sized delta for a localized edit on a large document', () => {
    const deltas: Delta[] = [];
    const large = 'lorem ipsum dolor sit amet '.repeat(400);
    const editor = build((b) =>
      b.use(bold).content(doc(large)).onChange((d) => deltas.push(d)),
    );

    editor.run('focus', { position: 'end' });
    editor.run('insertContent', { content: '!' });

    expect(deltas.length).toBeGreaterThan(0);
    const last = deltas.at(-1)!;
    expect(Array.isArray(last.changes)).toBe(true);
    // The delta describes only the edit, not the whole (large) document.
    const deltaSize = JSON.stringify(last.changes).length;
    const docSize = JSON.stringify(editor.getJSON()).length;
    expect(deltaSize).toBeLessThan(docSize / 10);
  });

  it('rejects invalid command arguments without mutating the document', () => {
    const setHeading = defineFeature({
      id: 'h',
      commands: {
        setH: {
          args: z.object({ level: z.number().int().min(1).max(3) }),
          run: () => true,
        },
      },
    });
    const editor = build((b) => b.use(setHeading).content(doc('x')));
    const before = editor.getJSON();
    expect(() => editor.run('setH', { level: 9 })).toThrow(CommandArgumentError);
    expect(editor.getJSON()).toEqual(before);
  });

  it('throws on an unknown command', () => {
    const editor = build((b) => b.use(bold).content(doc('x')));
    expect(() => editor.run('doesNotExist')).toThrow(UnknownCommandError);
  });

  it('builds independent instances that share no mutable state', () => {
    const a = build((b) => b.use(bold).content(doc('A')));
    const b = build((c) => c.use(bold).content(doc('B')));
    a.run('selectAll');
    a.run('toggleBold');
    expect(a.isActive('bold')).toBe(true);
    expect(b.isActive('bold')).toBe(false);
    expect(b.getText()).toBe('B');
  });

  it('fails to build a feature with a missing dependency', () => {
    const child = defineFeature({
      id: 'child',
      dependsOn: ['parent'],
      nodes: [{ name: 'child', group: 'block' }],
    });
    const element = document.createElement('div');
    expect(() => createEditor().use(child).build({ element })).toThrow(
      MissingFeatureDependencyError,
    );
  });
});
