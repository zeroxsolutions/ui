import { describe, expect, it } from 'vitest';
import { EditorError } from '@zeroxsolutions/editor-core/document/core/index';
import { createCodecRegistry } from '@zeroxsolutions/editor-core/document/serialize/index';
import { standardKit } from '../features/standard/index.js';
import { createMigrator, summarizeImport } from '@zeroxsolutions/editor-core/document/migrate/migrator';

const registry = createCodecRegistry([standardKit()]);

describe('migrator', () => {
  it('migrates Markdown through the registered adapter', () => {
    const migrator = createMigrator();
    const result = migrator.migrate(
      { format: 'markdown', content: '# Title\n\n- a\n- b' },
      registry,
    );
    expect(result.doc.content?.[0]?.type).toBe('heading');
    expect(result.doc.content?.[1]?.type).toBe('bulletList');
  });

  it('migrates HTML through the registered adapter', () => {
    const migrator = createMigrator();
    const result = migrator.migrate(
      { format: 'html', content: '<h2>Sub</h2><blockquote>q</blockquote>' },
      registry,
    );
    expect(result.doc.content?.[0]?.type).toBe('heading');
    expect(result.doc.content?.[1]?.type).toBe('blockquote');
  });

  it('throws for an unregistered source format', () => {
    const migrator = createMigrator();
    expect(() =>
      migrator.migrate({ format: 'notion', content: 'x' }, registry),
    ).toThrow(EditorError);
  });

  it('surfaces warnings and dropped content in the ImportResult', () => {
    const migrator = createMigrator();
    // A GFM table has no codec when only standardKit is registered → dropped.
    const result = migrator.migrate(
      { format: 'markdown', content: '| a | b |\n| --- | --- |\n| 1 | 2 |' },
      registry,
    );
    const summary = summarizeImport(result);
    expect(summary.dropped).toBeGreaterThan(0);
    expect(summary.clean).toBe(false);
  });
});
