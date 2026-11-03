/**
 * L1–L3 feature blocks, each a self-contained `defineFeature` bundling its
 * node/mark, commands, codec, view, and UI contributions (see
 * `editor-feature-api`). Each also has a per-feature subpath entry (`./*`) so a
 * heavy block (table, code-block, mermaid, math) is imported lazily and kept out
 * of the core bundle; this barrel is the eager convenience surface.
 */
export { standardKit } from './standard/index.js';
export { callout } from './callout/index.js';
export { toggle } from './toggle/index.js';
export { link } from './link/index.js';
export { image } from './image/index.js';
export { table } from './table/index.js';
export { codeBlock } from './code-block/index.js';
export { mermaid } from './mermaid/index.js';
export { math } from './math/index.js';
export { mention } from './mention/index.js';
export { embed } from './embed/index.js';
