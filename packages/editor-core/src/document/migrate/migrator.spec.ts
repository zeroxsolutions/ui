import { describe, expect, it } from 'vitest';
import { EditorError } from '../core/index.js';
import { createCodecRegistry } from '../serialize/index.js';
import { createMigrator, summarizeImport } from './migrator.js';
import type { ISourceAdapter } from './source-adapter.js';

const registry = createCodecRegistry([]);

describe('createMigrator', () => {
  it('migrates Markdown and HTML through the adapters it starts with', () => {
    const migrator = createMigrator();
    expect(migrator.migrate({ format: 'markdown', content: 'one\n\ntwo' }, registry).doc.content).toEqual([
      { type: 'paragraph', content: [{ type: 'text', text: 'one' }] },
      { type: 'paragraph', content: [{ type: 'text', text: 'two' }] },
    ]);
    expect(migrator.migrate({ format: 'html', content: '<p>three</p>' }, registry).doc.content).toEqual([
      { type: 'paragraph', content: [{ type: 'text', text: 'three' }] },
    ]);
  });

  it('refuses a format no adapter handles', () => {
    expect(() => createMigrator().migrate({ format: 'notion', content: 'x' }, registry)).toThrow(EditorError);
  });

  it('routes a format to the adapter registered for it last', () => {
    const notion: ISourceAdapter = {
      format: 'markdown',
      import: (content) => ({
        doc: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: `notion:${content}` }] }] },
        warnings: [],
        dropped: [],
      }),
    };
    const migrated = createMigrator().register(notion).migrate({ format: 'markdown', content: 'x' }, registry);
    expect(migrated.doc.content?.[0]?.content?.[0]?.text).toBe('notion:x');
  });
});

describe('summarizeImport', () => {
  it('counts what an import dropped, and calls it clean only when it dropped nothing', () => {
    const table = createMigrator().migrate({ format: 'markdown', content: '| a |\n| - |\n| 1 |' }, registry);
    expect(summarizeImport(table)).toMatchObject({ clean: false });
    expect(summarizeImport(table).dropped).toBe(table.dropped.length);
    expect(table.dropped.length).toBeGreaterThan(0);
    expect(summarizeImport(createMigrator().migrate({ format: 'markdown', content: 'a' }, registry))).toEqual({
      warnings: 0,
      dropped: 0,
      clean: true,
    });
  });
});
