import { EditorError, type ImportResult } from '../core/index.js';
import type { CodecRegistry } from '../serialize/index.js';
import { htmlSourceAdapter, markdownSourceAdapter, type ISourceAdapter } from './source-adapter.js';

/**
 * The migrator (task 9.1): orchestrates import codecs across registered source
 * adapters. A caller hands it a `{ format, content }` source; it routes to the
 * adapter for that format and returns the walker's `ImportResult` — the doc plus
 * the observable warnings/dropped list (task 9.2). Engine-free: it composes the
 * serialization walkers and the codec registry, never the editing engine.
 */
export interface MigrationSource {
  /** The source format key, matched against a registered adapter. */
  format: string;
  /** The raw source content (Markdown text, HTML string, …). */
  content: string;
}

export interface IMigrator {
  /** Register (or replace) the adapter for its format; chainable. */
  register(adapter: ISourceAdapter): this;
  /** Whether an adapter is registered for `format`. */
  has(format: string): boolean;
  /** Migrate a source into editor JSON, reporting warnings/dropped. */
  migrate(source: MigrationSource, registry: CodecRegistry): ImportResult;
}

export class Migrator implements IMigrator {
  private readonly adapters = new Map<string, ISourceAdapter>();

  register(adapter: ISourceAdapter): this {
    this.adapters.set(adapter.format, adapter);
    return this;
  }

  has(format: string): boolean {
    return this.adapters.has(format);
  }

  migrate(source: MigrationSource, registry: CodecRegistry): ImportResult {
    const adapter = this.adapters.get(source.format);
    if (!adapter) {
      throw new EditorError('MIGRATE_NO_ADAPTER', `No migration adapter for source format "${source.format}".`);
    }
    return adapter.import(source.content, registry);
  }
}

/**
 * Build a migrator pre-registered with the generic Markdown + HTML adapters. Pass
 * a custom adapter list to add/override (e.g. a Notion-export adapter).
 */
export function createMigrator(adapters: ISourceAdapter[] = [markdownSourceAdapter, htmlSourceAdapter]): IMigrator {
  const migrator = new Migrator();
  for (const adapter of adapters) migrator.register(adapter);
  return migrator;
}

/** A compact, caller-facing summary of a migration's observable outcome (task 9.2). */
export interface ImportSummary {
  warnings: number;
  dropped: number;
  /** No content was dropped. */
  clean: boolean;
}

export function summarizeImport(result: ImportResult): ImportSummary {
  return {
    warnings: result.warnings.length,
    dropped: result.dropped.length,
    clean: result.dropped.length === 0,
  };
}
