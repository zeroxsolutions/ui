/**
 * Migrate — bring existing content into the editor's JSON model through the same
 * codec registry the runtime uses, with an observable `ImportResult` (see the
 * `editor-serialization` spec). Engine-free.
 */
export {
  createMigrator,
  summarizeImport,
  Migrator,
  type IMigrator,
  type ImportSummary,
  type MigrationSource,
} from './migrator.js';
export { htmlSourceAdapter, markdownSourceAdapter, type ISourceAdapter } from './source-adapter.js';
