import type { ImportResult } from '../core/index.js';
import {
  importHTML,
  importMarkdown,
  type CodecRegistry,
} from '../serialize/index.js';

/**
 * A migration **source adapter**: turns one external source format into editor
 * JSON via the shared codec registry, reporting warnings + dropped content in an
 * `ImportResult` (see the `editor-serialization` spec, task 9.1). Each adapter is
 * a thin binding over an import walker — a new source (Notion export, Google Docs
 * HTML, …) is a new adapter, no change to the migrator.
 */
export interface ISourceAdapter {
  /** The source format key this adapter handles (e.g. `markdown`, `html`). */
  readonly format: string;
  /** Reconstruct editor JSON from the source, reporting warnings/dropped. */
  import(content: string, registry: CodecRegistry): ImportResult;
}

/** Generic Markdown (CommonMark + GFM) via the remark token path. */
export const markdownSourceAdapter: ISourceAdapter = {
  format: 'markdown',
  import: (content, registry) => importMarkdown(content, registry),
};

/** Generic HTML via the DOM walker. */
export const htmlSourceAdapter: ISourceAdapter = {
  format: 'html',
  import: (content, registry) => importHTML(content, registry),
};
